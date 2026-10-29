import { describe, it, expect } from "vitest";
import { isPrivateIp, validateUrlForSsrf } from "../lib/url/ssrf";
import { validateUrlInput } from "../lib/validation";

describe("SSRF Protection & URL Validation", () => {
  it("correctly identifies private, loopback, and cloud metadata IPv4 addresses", () => {
    // Loopback
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("127.0.1.10")).toBe(true);

    // Private Class A, B, C
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("10.255.255.254")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.255")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);

    // Link-local & cloud metadata
    expect(isPrivateIp("169.254.169.254")).toBe(true);
    expect(isPrivateIp("169.254.1.1")).toBe(true);

    // Current network & CGNAT
    expect(isPrivateIp("0.0.0.0")).toBe(true);
    expect(isPrivateIp("100.64.0.1")).toBe(true);

    // Multicast & Reserved
    expect(isPrivateIp("224.0.0.1")).toBe(true);
    expect(isPrivateIp("240.0.0.1")).toBe(true);

    // Public IPs should NOT be identified as private
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("93.184.216.34")).toBe(false); // example.com
  });

  it("correctly identifies IPv6 loopback, link-local, and unique local addresses", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("::")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
    expect(isPrivateIp("fd12:3456:789a::1")).toBe(true);
    expect(isPrivateIp("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIp("::ffff:10.0.0.1")).toBe(true);
  });

  it("blocks non-standard web ports", async () => {
    const res8080 = await validateUrlForSsrf("http://example.com:8080/product");
    expect(res8080.valid).toBe(false);
    expect(res8080.error).toContain("Non-standard port");

    const res22 = await validateUrlForSsrf("http://example.com:22/product");
    expect(res22.valid).toBe(false);

    const res6379 = await validateUrlForSsrf("http://example.com:6379");
    expect(res6379.valid).toBe(false);
  });

  it("blocks forbidden hostnames like localhost and cloud metadata", async () => {
    const resLocalhost = await validateUrlForSsrf("http://localhost/item");
    expect(resLocalhost.valid).toBe(false);
    expect(resLocalhost.error).toContain("forbidden");

    const resMetadata = await validateUrlForSsrf("http://metadata.google.internal/computeMetadata/v1/");
    expect(resMetadata.valid).toBe(false);

    const resLocal = await validateUrlForSsrf("http://mycomputer.local/test");
    expect(resLocal.valid).toBe(false);
  });

  it("blocks direct private IP literals in URL", async () => {
    const resPrivate = await validateUrlForSsrf("http://192.168.1.100/admin");
    expect(resPrivate.valid).toBe(false);
    expect(resPrivate.error).toContain("private or loopback");

    const resLoopback = await validateUrlForSsrf("http://127.0.0.1/secret");
    expect(resLoopback.valid).toBe(false);

    const resAwsMeta = await validateUrlForSsrf("http://169.254.169.254/latest/meta-data/");
    expect(resAwsMeta.valid).toBe(false);
  });

  it("rejects non-HTTP protocols at schema validation", () => {
    expect(validateUrlInput({ url: "ftp://files.example.com/item" }).success).toBe(false);
    expect(validateUrlInput({ url: "file:///etc/passwd" }).success).toBe(false);
    expect(validateUrlInput({ url: "javascript:alert(1)" }).success).toBe(false);
    expect(validateUrlInput({ url: "" }).success).toBe(false);
    expect(validateUrlInput({ url: "https://validstore.com/item" }).success).toBe(true);
  });
});

