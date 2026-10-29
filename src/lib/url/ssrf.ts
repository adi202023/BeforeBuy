import dns from "node:dns/promises";
import net from "node:net";

export function isPrivateIp(ip: string): boolean {
  // Check IPv4 mapped in IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (ip.startsWith("::ffff:")) {
    const v4Part = ip.slice(7);
    if (net.isIPv4(v4Part)) {
      return isPrivateIp(v4Part);
    }
  }

  const family = net.isIP(ip);
  if (family === 4) {
    const parts = ip.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true; // Malformed IPv4 treated as unsafe
    }

    const [b0, b1] = parts;

    // 0.0.0.0/8 - Current network
    if (b0 === 0) return true;

    // 10.0.0.0/8 - Private network
    if (b0 === 10) return true;

    // 127.0.0.0/8 - Loopback
    if (b0 === 127) return true;

    // 100.64.0.0/10 - Carrier-grade NAT
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

    // 169.254.0.0/16 - Link-local & cloud metadata (AWS, GCP, Azure, etc.)
    if (b0 === 169 && b1 === 254) return true;

    // 172.16.0.0/12 - Private network (172.16.0.0 - 172.31.255.255)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

    // 192.0.0.0/24, 192.0.2.0/24 (TEST-NET-1)
    if (b0 === 192 && b1 === 0) return true;

    // 192.168.0.0/16 - Private network
    if (b0 === 192 && b1 === 168) return true;

    // 198.18.0.0/15 - Benchmark testing
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;

    // 198.51.100.0/24 - TEST-NET-2
    if (b0 === 198 && b1 === 51) return true;

    // 203.0.113.0/24 - TEST-NET-3
    if (b0 === 203 && b1 === 0 && parts[2] === 113) return true;

    // 224.0.0.0/4 - Multicast
    if (b0 >= 224 && b0 <= 239) return true;

    // 240.0.0.0/4 - Reserved
    if (b0 >= 240) return true;

    return false;
  }

  if (family === 6) {
    const normalized = ip.toLowerCase();

    // Loopback
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

    // Unspecified
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

    // Link-local: fe80::/10 (fe80 to febf)
    if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

    // Unique Local Addresses (ULA): fc00::/7 (fc00:: to fdff::)
    if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

    // Multicast: ff00::/8
    if (normalized.startsWith("ff")) return true;

    return false;
  }

  return true; // Unknown address family treated as unsafe
}

export interface SsrfValidationResult {
  valid: boolean;
  error?: string;
  url?: URL;
  resolvedIps?: string[];
}

export async function validateUrlForSsrf(
  urlString: string
): Promise<SsrfValidationResult> {
  if (!urlString || typeof urlString !== "string") {
    return { valid: false, error: "Product URL is required" };
  }

  const trimmed = urlString.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // 1. Protocol: HTTP or HTTPS only
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      error: `Unsupported protocol "${parsed.protocol}". Only public http and https links are permitted.`,
    };
  }

  // 2. Standard web ports only (80, 443, or default)
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    return {
      valid: false,
      error: `Non-standard port "${parsed.port}" is not allowed. Only ports 80 and 443 are supported.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Reject forbidden hostnames
  const forbiddenHosts = [
    "localhost",
    "metadata.google.internal",
    "metadata.internal",
    "instance-data",
  ];
  if (
    forbiddenHosts.includes(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return {
      valid: false,
      error: "Access to local or internal cloud metadata hostnames is forbidden.",
    };
  }

  // 4. If hostname is a raw IP literal, check directly
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return {
        valid: false,
        error: "Direct access to private or loopback IP addresses is prohibited.",
      };
    }
    return { valid: true, url: parsed, resolvedIps: [hostname] };
  }

  // 5. DNS Resolution check
  try {
    const lookups = await dns.lookup(hostname, { all: true });
    if (!lookups || lookups.length === 0) {
      return {
        valid: false,
        error: `Could not resolve domain name "${hostname}". Please check that the URL is spelled correctly.`,
      };
    }

    const resolvedIps = lookups.map((l) => l.address);
    for (const record of lookups) {
      if (isPrivateIp(record.address)) {
        return {
          valid: false,
          error: `Domain "${hostname}" resolved to a private or restricted address (${record.address}). Retrieval blocked.`,
        };
      }
    }

    return { valid: true, url: parsed, resolvedIps };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DNS resolution failed";
    return {
      valid: false,
      error: `Failed to resolve host "${hostname}": ${msg}`,
    };
  }
}

