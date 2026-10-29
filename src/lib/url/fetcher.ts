import { validateUrlForSsrf } from "./ssrf";

export interface PageFetchResult {
  ok: boolean;
  html?: string;
  submittedUrl?: string;
  finalUrl?: string;
  redirectChain?: string[];
  statusCode?: number;
  contentType?: string;
  error?: string;
  blockedByAntiBot?: boolean;
}

const MAX_REDIRECTS = 6;
const TIMEOUT_MS = 7000;
const MAX_BYTE_SIZE = 2.5 * 1024 * 1024; // 2.5 MB

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 BeforeBuy/1.0";

export async function fetchProductPage(
  targetUrl: string
): Promise<PageFetchResult> {
  const submittedUrl = targetUrl.trim();
  let currentUrl = submittedUrl;
  let redirectCount = 0;
  const redirectChain: string[] = [submittedUrl];

  while (redirectCount <= MAX_REDIRECTS) {
    // 1. SSRF validate current URL before dispatching request
    const ssrfCheck = await validateUrlForSsrf(currentUrl);
    if (!ssrfCheck.valid || !ssrfCheck.url) {
      return {
        ok: false,
        submittedUrl,
        finalUrl: currentUrl,
        redirectChain,
        error: ssrfCheck.error || "URL failed security validation",
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en-IN;q=0.9,en;q=0.8",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "manual", // Handle redirects manually to validate destination IP on every hop
        signal: controller.signal,
      });

      clearTimeout(timer);

      // 2. Handle HTTP Redirects (301, 302, 303, 307, 308)
      if (
        [301, 302, 303, 307, 308].includes(response.status) &&
        response.headers.has("location")
      ) {
        redirectCount++;
        if (redirectCount > MAX_REDIRECTS) {
          return {
            ok: false,
            submittedUrl,
            finalUrl: currentUrl,
            redirectChain,
            error: "Too many redirects encountered while loading product page.",
          };
        }

        const locationHeader = response.headers.get("location")!;
        try {
          const resolvedLocation = new URL(locationHeader, currentUrl).toString();
          currentUrl = resolvedLocation;
          redirectChain.push(currentUrl);
          continue;
        } catch {
          return {
            ok: false,
            submittedUrl,
            finalUrl: currentUrl,
            redirectChain,
            error: `Malformed redirect Location header received: ${locationHeader}`,
          };
        }
      }

      // 3. Handle Anti-bot, Access Denied, or Client Error Statuses
      if (response.status === 403 || response.status === 401) {
        return {
          ok: false,
          submittedUrl,
          finalUrl: currentUrl,
          redirectChain,
          statusCode: response.status,
          blockedByAntiBot: true,
          error:
            "The merchant’s website blocked automated access (Cloudflare / CAPTCHA / bot protection).",
        };
      }

      if (response.status === 429) {
        return {
          ok: false,
          submittedUrl,
          finalUrl: currentUrl,
          redirectChain,
          statusCode: response.status,
          blockedByAntiBot: true,
          error: "The storefront returned a rate limit (429 Too Many Requests).",
        };
      }

      if (response.status === 404) {
        return {
          ok: false,
          submittedUrl,
          finalUrl: currentUrl,
          redirectChain,
          statusCode: response.status,
          error: "Product listing was not found on the store (404 Not Found).",
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          submittedUrl,
          finalUrl: currentUrl,
          redirectChain,
          statusCode: response.status,
          error: `Storefront server returned HTTP error status ${response.status}.`,
        };
      }

      // 4. Validate Content-Type: Must be HTML
      const contentType = response.headers.get("content-type") || "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml+xml")
      ) {
        return {
          ok: false,
          submittedUrl,
          finalUrl: currentUrl,
          redirectChain,
          statusCode: response.status,
          contentType,
          error: `The page returned content-type "${contentType}", but BeforeBuy only inspects HTML web pages.`,
        };
      }

      // 5. Read stream with byte-size cutoff limit
      if (!response.body) {
        return {
          ok: false,
          submittedUrl,
          finalUrl: currentUrl,
          redirectChain,
          error: "Empty response body received from server",
        };
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > MAX_BYTE_SIZE) {
            chunks.push(value);
            break;
          }
          chunks.push(value);
        }
      }

      const fullBuffer = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        fullBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      const html = new TextDecoder("utf-8").decode(fullBuffer);

      // Check if this is a meta-refresh redirect page (common in some link shorteners)
      const metaRefreshMatch = html.match(
        /<meta\s+[^>]*http-equiv=["']refresh["'][^>]*content=["']\d+;\s*url=([^"']+)["']/i
      );
      if (metaRefreshMatch && metaRefreshMatch[1] && html.length < 5000 && redirectCount < MAX_REDIRECTS) {
        try {
          const refreshUrl = new URL(metaRefreshMatch[1], currentUrl).toString();
          redirectCount++;
          currentUrl = refreshUrl;
          redirectChain.push(currentUrl);
          continue;
        } catch {
          // ignore and proceed
        }
      }

      // Check if page contains an obvious Cloudflare / CAPTCHA challenge HTML body
      const lowerHtml = html.toLowerCase();
      if (
        lowerHtml.includes("cf-challenge-running") ||
        lowerHtml.includes("just a moment...") ||
        lowerHtml.includes("turnstile") ||
        lowerHtml.includes("attention required! | cloudflare") ||
        lowerHtml.includes("enter the characters you see below") || // Amazon CAPTCHA
        (lowerHtml.includes("please verify you are a human") && html.length < 20000)
      ) {
        return {
          ok: false,
          submittedUrl,
          finalUrl: currentUrl,
          redirectChain,
          statusCode: response.status,
          blockedByAntiBot: true,
          error:
            "The storefront presented a verification challenge (CAPTCHA / bot protection).",
        };
      }

      return {
        ok: true,
        html,
        submittedUrl,
        finalUrl: currentUrl,
        redirectChain,
        statusCode: response.status,
        contentType,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        return {
          ok: false,
          submittedUrl,
          finalUrl: currentUrl,
          redirectChain,
          error:
            "Request timed out after 7 seconds while connecting to the store.",
        };
      }
      const msg = err instanceof Error ? err.message : "Network error";
      return {
        ok: false,
        submittedUrl,
        finalUrl: currentUrl,
        redirectChain,
        error: `Could not retrieve the product page: ${msg}`,
      };
    }
  }

  return {
    ok: false,
    submittedUrl,
    finalUrl: currentUrl,
    redirectChain,
    error: "Maximum redirect count exceeded.",
  };
}
