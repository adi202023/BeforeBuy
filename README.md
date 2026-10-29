# BeforeBuy — One-Link Product Risk Assessment

**BeforeBuy** is an objective, consumer-friendly web tool that helps shoppers check unfamiliar online product listings before making a payment.

Instead of filling out long forms, shoppers simply paste a product page link. BeforeBuy retrieves public page details on the server, extracts product metadata (JSON-LD and OpenGraph), runs a rigorous deterministic risk assessment, and presents clear, evidence-backed findings.

> **Integrity Principle**: BeforeBuy is a risk-assessment aid, not a guarantee that a merchant is safe or fraudulent. It never fabricates unverified claims, fake reviews, or seller ratings.

---

## 🚀 The One-Link Product Flow

1. **Paste a Link**: The shopper pastes a product URL into one prominent input.
2. **Server-Side Retrieval & SSRF Protection**: The server validates the URL against strict SSRF rules, resolves DNS, follows redirects safely, and retrieves the public HTML (max 2.5MB, 6s timeout).
3. **Structured Extraction**: Extracts product name, image, price, currency, store name, description, and return policy using JSON-LD (`schema.org/Product`), OpenGraph tags, and HTML heuristics without running page scripts.
4. **Instant Assessment**: Evaluates payment protections, return policy traps, pricing realism, and urgency tactics.
5. **Transparency & Correction**:
   - Displays extracted product details with an **"Edit details"** action so shoppers can correct or supplement missing fields.
   - If a storefront blocks automated access (Cloudflare/CAPTCHA), BeforeBuy explains the blockage honestly and provides a **one-click fallback to paste listing text**.

---

## 🛡️ SSRF & Security Architecture

- **Public Web Only**: Allows only public HTTP and HTTPS links on standard ports (`80` and `443`).
- **IP & DNS Validation**: Rejects localhost (`127.0.0.0/8`, `::1`), private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.169.254`), and CGNAT ranges.
- **Manual Redirect Validation**: Every redirect hop is re-validated against the SSRF filter before dispatching subsequent requests (max 4 redirects).
- **HTML Content-Type Enforced**: Rejects binary, streaming, or non-HTML payloads.
- **Zero Script Execution**: HTML is parsed without running client-side page scripts.
- **Prompt Injection Defense**: Untrusted listing text is isolated within strict delimiters to prevent overriding safety rules.

---

## 🎨 Visual Design

- **Palette**: Warm off-white background (`#faf8f5`), deep charcoal text (`#111827`), with restrained accents in mint green, warm amber, and soft coral.
- **Aesthetic**: Human, trustworthy consumer ecommerce feel (inspired by modern editorial publications and clean checkout pages) rather than a dark futuristic dashboard.
- **Motion & Accessibility**: Smooth, fast transitions, skeleton placeholders during loading, and full compliance with `prefers-reduced-motion`.

---

## 🧪 Automated Test Suite

Run the full test suite (29 tests across 6 test suites):
```bash
npm test
```

### Covered Test Areas:
1. `src/__tests__/ssrf_url.test.ts`: SSRF protections, loopback/private/cloud metadata IP rejections, non-standard port blocking, protocol enforcement.
2. `src/__tests__/extractor.test.ts`: JSON-LD Product schema parsing, OpenGraph fallback, missing field tracking without fabrication.
3. `src/__tests__/analyzer.test.ts`: Normal (LOW), Suspicious (HIGH), and Ambiguous (MEDIUM) risk classification, URL heuristics, score bounds.
4. `src/__tests__/security.test.ts`: Prompt injection resilience, HTML/script tag sanitization.
5. `src/__tests__/validation.test.ts`: Single URL input validation, manual listing schema limits.
6. `src/__tests__/flow.test.ts`: End-to-end flow from URL input to extracted results, editing details, saving to `localStorage`, and history deletion.

---

## 🏃 Getting Started

### Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

### Optional AI Enrichment
BeforeBuy runs 100% locally with its deterministic rule engine. To optionally enable hybrid Gemini AI synthesis, set `GEMINI_API_KEY` in your `.env.local` file:
```env
GEMINI_API_KEY=your_key_here
```

---

## ⚠️ Notes & Limitations on Anti-Bot Sites

Some major marketplaces and storefronts employ aggressive anti-bot protections (Cloudflare Turnstile, perimeter CAPTCHAs, or mandatory login walls) that reject server-side automated requests. 

When this occurs:
- BeforeBuy **never pretends** the page was checked.
- It displays a clear explanation that automated access was blocked.
- It provides a built-in fallback form allowing the shopper to paste the product text directly and receive an immediate assessment.
- Three built-in sample products are always available to demo the experience.
>>>>>>> 4a0bcd5 (feat: complete BeforeBuy one-link check with Cheerio, Framer Motion, and evidence-based risk assessment)
