import {
  AnalysisResult,
  Finding,
  FindingCategory,
  FindingSeverity,
  ListingInput,
  RiskLevel,
} from "../types";

export function runDeterministicAnalysis(
  input: ListingInput,
  options?: {
    isDemo?: boolean;
    retrievalMethod?: "url_fetch" | "manual_paste" | "demo_sample";
    pageRetrievalError?: string | null;
  }
): AnalysisResult {
  const warnings: Finding[] = [];
  const observations: Finding[] = [];
  const thingsToCheck: string[] = [];
  const unverifiedAspects: string[] = [];
  const missingFields: string[] = [];

  const fullText = `${input.title} ${input.seller || ""} ${input.description} ${
    input.returnPolicy || ""
  } ${input.paymentMethods || ""} ${input.url || ""}`.toLowerCase();

  // Track absent data points honestly
  if (!input.title || input.title.trim().length === 0) missingFields.push("Product title");
  if (input.price === null || input.price === undefined) missingFields.push("Current price");
  if (!input.seller && !input.retailer) missingFields.push("Seller identity");
  if (!input.description || input.description.trim().length === 0) missingFields.push("Description");
  if (!input.returnPolicy || input.returnPolicy.trim().length === 0) missingFields.push("Return policy");
  if (!input.paymentMethods || input.paymentMethods.trim().length === 0) missingFields.push("Payment methods");

  // ==========================================
  // 1. NEUTRAL & VERIFIED OBSERVATIONS
  // ==========================================
  if (input.retailer) {
    observations.push({
      id: "obs-retailer",
      type: "observation",
      severity: "neutral",
      category: "marketplace",
      title: `Product listed on ${input.retailer}`,
      description: `The web address corresponds to ${input.retailer}.`,
      evidence: `Domain: ${input.url || input.canonicalUrl || "Provided URL"}`,
      location: "URL / Domain",
      source: "deterministic",
    });
  }

  if (input.brand) {
    observations.push({
      id: "obs-brand",
      type: "observation",
      severity: "neutral",
      category: "seller",
      title: `Brand identified as ${input.brand}`,
      description: input.brandStore
        ? `Listing links to "${input.brandStore}". Note: this indicates brand storefront affiliation, not necessarily the third-party merchant fulfilling the order.`
        : `Product is branded as "${input.brand}".`,
      evidence: input.brandStore || `Brand: ${input.brand}`,
      location: "Brand byline",
      source: "deterministic",
    });
  }

  if (input.seller) {
    observations.push({
      id: "obs-seller",
      type: "observation",
      severity: "neutral",
      category: "seller",
      title: `Fulfillment merchant: ${input.seller}`,
      description: `Page explicitly identifies "${input.seller}" as the seller.`,
      evidence: `Sold by: ${input.seller}`,
      location: "Buy box merchant info",
      source: "deterministic",
    });
  }

  if (input.price !== null && input.price !== undefined) {
    let priceDesc = `Current listed price is ${input.currency} ${input.price.toLocaleString("en-IN")}.`;
    if (input.mrp && input.mrp > input.price) {
      const discountPct = Math.round(((input.mrp - input.price) / input.mrp) * 100);
      priceDesc += ` Discounted by ${discountPct}% from M.R.P. ${input.currency} ${input.mrp.toLocaleString("en-IN")}.`;
    }
    observations.push({
      id: "obs-price",
      type: "observation",
      severity: "neutral",
      category: "pricing",
      title: `Price: ${input.currency} ${input.price.toLocaleString("en-IN")}`,
      description: priceDesc,
      evidence: input.mrp
        ? `Price: ${input.currency} ${input.price} (M.R.P.: ${input.currency} ${input.mrp})`
        : `Price: ${input.currency} ${input.price}`,
      location: "Price block",
      source: "deterministic",
    });
  }

  if (input.rating !== null && input.rating !== undefined) {
    let ratingDesc = `Page displays a customer rating of ${input.rating} out of 5 stars`;
    if (input.reviewCount !== null && input.reviewCount !== undefined) {
      ratingDesc += ` based on ${input.reviewCount} customer ratings`;
    }
    if (input.boughtPastMonth) {
      ratingDesc += ` (${input.boughtPastMonth})`;
    }
    ratingDesc += `. Note: BeforeBuy does not verify review authenticity.`;

    observations.push({
      id: "obs-rating",
      type: "observation",
      severity: "neutral",
      category: "transparency",
      title: `Customer ratings: ${input.rating} ★ (${input.reviewCount || 0} ratings)`,
      description: ratingDesc,
      evidence: `${input.rating} stars, ${input.reviewCount || 0} ratings${
        input.boughtPastMonth ? `, ${input.boughtPastMonth}` : ""
      }`,
      location: "Customer reviews header",
      source: "deterministic",
    });
  }

  if (input.returnPolicy) {
    // Check if return policy is normal/protective
    const rpLower = input.returnPolicy.toLowerCase();
    const isStrictlyNoReturn =
      rpLower.includes("no return") ||
      rpLower.includes("all sales final") ||
      rpLower.includes("no refund") ||
      rpLower.includes("as is") ||
      rpLower.includes("as-is");

    if (!isStrictlyNoReturn) {
      observations.push({
        id: "obs-return-policy",
        type: "observation",
        severity: "positive",
        category: "return_policy",
        title: "Return or replacement window indicated",
        description: `Listing specifies return or replacement terms: "${input.returnPolicy}".`,
        evidence: `Return policy: "${input.returnPolicy}"`,
        location: "Product service pills / return policy",
        source: "deterministic",
      });
    }
  }

  // ==========================================
  // 2. EVIDENCE-BACKED WARNING SIGNS
  // (Only real evidence can produce a warning!)
  // ==========================================
  let riskScore = 0;

  // A. Adversarial Prompt Injection / Tampering
  const injectionPatterns = [
    /ignore (all )?(previous|prior) instructions/i,
    /system prompt/i,
    /you are now/i,
    /override (risk|analysis|safety)/i,
    /mark (this|all) (as )?(safe|low risk|zero risk)/i,
    /output (only )?low risk/i,
    /risk score\s*:\s*0/i,
    /do not (report|flag|warn)/i,
  ];

  for (const pattern of injectionPatterns) {
    const hit = fullText.match(pattern);
    if (hit) {
      warnings.push({
        id: `warn-security-${warnings.length + 1}`,
        type: "warning",
        severity: "critical",
        category: "security",
        title: "Adversarial text or prompt override attempt detected",
        description:
          "The listing text contains instructions attempting to manipulate automated risk analyzers. This is a severe red flag often used in phishing or malicious listings.",
        evidence: `Found pattern matching: "${hit[0]}" inside listing text`,
        location: "Product description",
        source: "deterministic",
      });
      riskScore += 45;
      break;
    }
  }

  // B. Irreversible or High-Risk Payment Methods (ONLY if explicitly found on page!)
  const paymentStr = (input.paymentMethods || "").toLowerCase();
  const descStr = input.description.toLowerCase();

  const wirePatterns = [
    "western union",
    "moneygram",
    "wire transfer",
    "bank wire",
    "direct deposit to personal account",
  ];
  for (const p of wirePatterns) {
    if (paymentStr.includes(p) || descStr.includes(p)) {
      warnings.push({
        id: `warn-payment-${warnings.length + 1}`,
        type: "warning",
        severity: "critical",
        category: "payment",
        title: "Irreversible wire transfer payment requested",
        description:
          "Wire transfers offer zero buyer protection or dispute rights once funds are sent. Established retail marketplaces do not mandate wire transfers.",
        evidence: `Mention of "${p}" in payment terms or description`,
        location: "Payment options / description",
        source: "deterministic",
      });
      riskScore += 35;
      break;
    }
  }

  const cryptoPatterns = [
    "bitcoin",
    "crypto only",
    "usdt",
    "ethereum",
    "wallet transfer",
    "send btc",
  ];
  for (const p of cryptoPatterns) {
    if (paymentStr.includes(p) || descStr.includes(p)) {
      warnings.push({
        id: `warn-payment-${warnings.length + 1}`,
        type: "warning",
        severity: "critical",
        category: "payment",
        title: "Cryptocurrency payment requirement",
        description:
          "Cryptocurrency payments are irreversible and provide no formal chargeback or dispute mechanism if goods are not delivered or are counterfeit.",
        evidence: `Mention of "${p}" in payment options`,
        location: "Payment terms",
        source: "deterministic",
      });
      riskScore += 35;
      break;
    }
  }

  const giftCardPatterns = [
    "gift card",
    "amazon gift card",
    "apple gift card",
    "steam card",
    "paysafecard",
  ];
  for (const p of giftCardPatterns) {
    if (paymentStr.includes(p) || descStr.includes(p)) {
      warnings.push({
        id: `warn-payment-${warnings.length + 1}`,
        type: "warning",
        severity: "critical",
        category: "payment",
        title: "Retail gift cards requested as payment",
        description:
          "Demanding consumer gift cards as payment is a recognized hallmark of payment scams. Gift cards are untraceable and non-refundable.",
        evidence: `Reference to "${p}" for payment`,
        location: "Payment terms",
        source: "deterministic",
      });
      riskScore += 40;
      break;
    }
  }

  const offPlatform = [
    "whatsapp me",
    "contact on telegram",
    "message seller before paying",
    "email me for paypal invoice",
    "dm on instagram to purchase",
  ];
  for (const p of offPlatform) {
    if (fullText.includes(p)) {
      warnings.push({
        id: `warn-payment-${warnings.length + 1}`,
        type: "warning",
        severity: "critical",
        category: "payment",
        title: "Off-platform payment or communication requested",
        description:
          "Directing shoppers to complete transactions outside the platform via private messaging removes all marketplace buyer protections.",
        evidence: `Found phrase "${p}" in listing content`,
        location: "Listing description",
        source: "deterministic",
      });
      riskScore += 30;
      break;
    }
  }

  // C. Restrictive Return Clauses (ONLY if explicit restrictive terms were found!)
  const returnStr = (input.returnPolicy || "").toLowerCase();
  if (
    returnStr.includes("no return") ||
    returnStr.includes("all sales final") ||
    returnStr.includes("no refund") ||
    returnStr.includes("as is") ||
    returnStr.includes("as-is")
  ) {
    warnings.push({
      id: `warn-return-${warnings.length + 1}`,
      type: "warning",
      severity: "warning",
      category: "return_policy",
      title: "Strict 'No Returns' or 'All Sales Final' policy stated",
      description:
        "The seller explicitly disclaims returns and refunds. If the merchandise arrives damaged or misrepresented, you bear all financial risk.",
      evidence: `Return policy states: "${input.returnPolicy?.slice(0, 150)}"`,
      location: "Return policy section",
      source: "deterministic",
    });
    riskScore += 25;
  } else if (
    returnStr.includes("restocking fee") ||
    returnStr.includes("store credit only") ||
    returnStr.includes("buyer pays international return") ||
    returnStr.includes("overseas fulfillment")
  ) {
    warnings.push({
      id: `warn-return-${warnings.length + 1}`,
      type: "warning",
      severity: "caution",
      category: "return_policy",
      title: "Restrictive return clauses or restocking deductions",
      description:
        "Returns are conditional, subject to restocking fees, store credit only, or require international return shipping.",
      evidence: `Policy mentions: "${input.returnPolicy?.slice(0, 150)}"`,
      location: "Return policy terms",
      source: "deterministic",
    });
    riskScore += 18;
  }

  // D. Extreme Luxury / Tech Pricing Anomaly (>90% discount on luxury on unfamiliar store)
  const price = input.price;
  const titleLower = input.title.toLowerCase();
  const luxuryKeywords = [
    "rolex",
    "louis vuitton",
    "gucci",
    "chanel",
    "hermes",
    "prada",
    "ps5",
    "playstation 5",
    "iphone 16",
    "iphone 15 pro",
    "rtx 4090",
  ];
  const hasLuxury = luxuryKeywords.some((l) => titleLower.includes(l));

  // If a high-end luxury watch is priced under $90 USD (or under ₹7,500 INR)
  const isSuspiciousLowPrice =
    hasLuxury &&
    price !== null &&
    price > 0 &&
    ((input.currency === "USD" && price < 90) ||
      (input.currency === "INR" && price < 7500));

  if (isSuspiciousLowPrice) {
    warnings.push({
      id: `warn-price-${warnings.length + 1}`,
      type: "warning",
      severity: "critical",
      category: "pricing",
      title: "Suspiciously low price for luxury or high-demand product",
      description: `Premium luxury item listed at only ${input.currency} ${input.price}. This is overwhelmingly consistent with counterfeit goods or non-delivery schemes.`,
      evidence: `Title specifies premium brand while listed price is ${input.currency} ${input.price}`,
      location: "Product title and price",
      source: "deterministic",
    });
    riskScore += 40;
  }

  if (
    descStr.includes("95% off") ||
    descStr.includes("90% off") ||
    descStr.includes("warehouse liquidation") ||
    descStr.includes("lost cargo auction")
  ) {
    warnings.push({
      id: `warn-price-${warnings.length + 1}`,
      type: "warning",
      severity: "caution",
      category: "pricing",
      title: "Liquidation or deep clearance narrative",
      description:
        "Claims of 90%+ discounts or 'unclaimed freight liquidation' are common tropes used by fraudulent pop-up storefronts.",
      evidence: "Found liquidation/deep discount phrasing in description",
      location: "Product description",
      source: "deterministic",
    });
    riskScore += 18;
  }

  // E. URL Structural Red Flags (Only if URL exists and is not a known verified marketplace)
  const urlToCheck = input.canonicalUrl || input.url;
  if (urlToCheck) {
    try {
      const parsedUrl = new URL(urlToCheck);
      const hostname = parsedUrl.hostname.toLowerCase();

      if (parsedUrl.protocol === "http:") {
        warnings.push({
          id: `warn-url-${warnings.length + 1}`,
          type: "warning",
          severity: "warning",
          category: "security",
          title: "Insecure unencrypted connection (HTTP)",
          description:
            "The product link uses unencrypted HTTP rather than HTTPS. Modern checkout requires HTTPS encryption.",
          evidence: `URL protocol is http: "${urlToCheck}"`,
          location: "URL scheme",
          source: "deterministic",
        });
        riskScore += 25;
      }

      // Check brand spoofing in subdomain (e.g. apple.com.fake-store.xyz)
      const majorBrands = ["apple", "amazon", "walmart", "target", "nike", "paypal", "rolex"];
      for (const b of majorBrands) {
        if (
          hostname.includes(b) &&
          !hostname.endsWith(`.${b}.com`) &&
          !hostname.endsWith(`.${b}.in`) &&
          !hostname.endsWith(`.${b}.co.uk`) &&
          hostname !== `${b}.com` &&
          hostname !== `${b}.in` &&
          hostname !== `amzn.in` &&
          hostname !== `amzn.to` &&
          hostname !== `a.co`
        ) {
          warnings.push({
            id: `warn-url-${warnings.length + 1}`,
            type: "warning",
            severity: "critical",
            category: "seller",
            title: "Potential brand name spoofing in domain address",
            description: `The domain '${hostname}' contains '${b}' but does not appear to be an official domain for that brand.`,
            evidence: `Domain structure: "${hostname}"`,
            location: "URL hostname",
            source: "deterministic",
          });
          riskScore += 35;
          break;
        }
      }

      // High churn TLDs on unfamiliar sites
      const suspiciousTlds = [".top", ".xyz", ".buzz", ".surf", ".rest", ".icu", ".cam", ".sbs"];
      const hasSuspiciousTld = suspiciousTlds.some((tld) => hostname.endsWith(tld));
      if (hasSuspiciousTld && !input.retailer?.includes("Amazon")) {
        warnings.push({
          id: `warn-url-${warnings.length + 1}`,
          type: "warning",
          severity: "caution",
          category: "security",
          title: "High-churn domain extension detected",
          description: `The storefront uses '${hostname}', which features an extension frequently favored for short-lived disposable stores due to low registration costs.`,
          evidence: `Hostname: "${hostname}"`,
          location: "URL TLD",
          source: "deterministic",
        });
        riskScore += 12;
      }
    } catch {
      // ignore
    }
  }

  // ==========================================
  // 3. UNVERIFIED INFORMATION
  // (Separated clearly so missing data is never treated as fraud!)
  // ==========================================
  if (!input.paymentMethods || input.paymentMethods.trim() === "") {
    unverifiedAspects.push(
      "Accepted checkout payment methods were not explicitly enumerated on the product page (standard for marketplace listings; verify supported payment options during checkout)."
    );
  }

  if (!input.returnPolicy || input.returnPolicy.trim() === "") {
    unverifiedAspects.push(
      "Detailed return and refund terms were not detected in the extracted page text; confirm the return window before placing an order."
    );
  }

  unverifiedAspects.push(
    "Physical warehouse inventory, supplier invoices, and product authenticity could not be verified."
  );

  unverifiedAspects.push(
    "Customer reviews, seller rating metrics, and purchase counts are provided by the storefront and cannot be independently audited without platform access."
  );

  if (!input.seller) {
    unverifiedAspects.push(
      "The specific third-party transaction seller was not identified on the page; check the 'Sold by' merchant name in the buy box."
    );
  }

  // ==========================================
  // 4. ACTIONABLE "THINGS TO CHECK"
  // ==========================================
  if (warnings.length > 0) {
    thingsToCheck.push(
      "Do not send payment via wire transfer, cryptocurrency, gift cards, or private P2P apps."
    );
    thingsToCheck.push(
      "Search the exact product title and image on independent search engines to see if they were copied from another creator."
    );
    thingsToCheck.push(
      "Check independent review platforms (such as Trustpilot or community consumer forums), avoiding reviews hosted only on the seller's own site."
    );
  } else {
    thingsToCheck.push(
      "Check the 'Sold by' merchant name and seller feedback ratings in the buy box prior to completing checkout."
    );
    thingsToCheck.push(
      "Pay with an established credit card or protected marketplace payment method that offers formal dispute rights."
    );
    thingsToCheck.push(
      "Inspect the package promptly upon delivery to verify specifications and condition match the description before the return window closes."
    );
  }

  // ==========================================
  // 5. RISK SCORE & CLASSIFICATION
  // (Strictly based on evidence-backed warnings!)
  // ==========================================
  // Bound score
  riskScore = Math.max(0, Math.min(100, riskScore));

  let riskLevel: RiskLevel = "LOW";
  if (riskScore >= 60 || warnings.some((w) => w.severity === "critical")) {
    riskLevel = "HIGH";
  } else if (riskScore >= 25 || warnings.length > 0) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  let headline = "";
  let summary = "";

  if (warnings.length === 0) {
    headline = "No Specific Warning Signs Found";
    summary =
      "No specific warning signs were found in the information available. Review unverified details before completing payment.";
  } else if (riskLevel === "HIGH") {
    headline = `${warnings.length} High-Severity Warning Flag${warnings.length > 1 ? "s" : ""} Identified`;
    summary =
      "Significant evidence-backed warning signs were found on this listing, notably around payment safety, transaction risks, or unverified claims. We advise extreme caution before sending money.";
  } else {
    headline = `${warnings.length} Cautionary Signal${warnings.length > 1 ? "s" : ""} Identified`;
    summary =
      "Specific cautionary signals were detected in the listing details. Review the evidence and suggested precautions before completing your purchase.";
  }

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    input,
    riskScore,
    riskLevel,
    headline,
    summary,
    warnings,
    observations,
    thingsToCheck,
    unverifiedAspects,
    missingFields,
    engine: "deterministic",
    isDemo: options?.isDemo ?? false,
    retrievalMethod: options?.retrievalMethod ?? "url_fetch",
    pageRetrievalError: options?.pageRetrievalError ?? null,
    disclaimer:
      "BeforeBuy is an informational risk-assessment aid based strictly on available page evidence. It is guidance, not a guarantee that a merchant is safe or fraudulent.",
  };
}
