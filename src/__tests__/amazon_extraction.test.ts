import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { extractProductData, detectRetailerFromUrl } from "../lib/url/extractor";
import { runDeterministicAnalysis } from "../lib/analyzer/deterministic";
import { ListingInput } from "../lib/types";

describe("Amazon India Vivobook Regression & Extraction Audit", () => {
  const fixturePath = path.resolve(__dirname, "./fixtures/amazon_vivobook_in.html");
  const html = fs.readFileSync(fixturePath, "utf-8");
  const submittedShortUrl = "https://amzn.in/d/0bqSf8t5";
  const canonicalUrl = "https://www.amazon.in/dp/B0D1VAPWS";

  it("maps Amazon short link and canonical URL to 'Amazon India' instead of 'Amzn'", () => {
    const retailerShort = detectRetailerFromUrl(submittedShortUrl);
    expect(retailerShort.name).toBe("Amazon India");
    expect(retailerShort.name).not.toBe("Amzn");

    const retailerCanonical = detectRetailerFromUrl(canonicalUrl);
    expect(retailerCanonical.name).toBe("Amazon India");
  });

  it("extracts visible title, image, ₹52,990 price, MRP, rating, and review count accurately", () => {
    const extracted = extractProductData(html, canonicalUrl, submittedShortUrl);

    // 1. Title
    expect(extracted.title.value).toContain("ASUS Vivobook 15 (2026)");
    expect(extracted.title.confidence).toBe("high");

    // 2. Price and Currency
    expect(extracted.price.value).toBe(52990);
    expect(extracted.currency.value).toBe("INR");
    expect(extracted.mrp.value).toBe(84990);

    // 3. Image
    expect(extracted.image.value).toBe(
      "https://m.media-amazon.com/images/I/71c5W9NxN5L._SL1500_.jpg"
    );

    // 4. Rating and Reviews
    expect(extracted.rating.value).toBe(3.9);
    expect(extracted.reviewCount.value).toBe(42);
    expect(extracted.boughtPastMonth.value).toBe("1K+ bought in past month");

    // 5. Brand vs Brand Store vs Seller
    expect(extracted.brand.value).toBe("ASUS");
    expect(extracted.brandStore.value).toBe("Visit the ASUS Store");
    // Ensure "ASUS Store" is NOT labeled as transaction seller
    expect(extracted.seller.value).toBeNull();

    // 6. Return / Replacement terms
    expect(extracted.returnPolicy.value).toBe("10 days Service Centre Replacement");

    // 7. Retailer identity
    expect(extracted.retailer.value).toBe("Amazon India");
  });

  it("produces zero evidence-backed warnings and classifies listing as LOW risk", () => {
    const extracted = extractProductData(html, canonicalUrl, submittedShortUrl);

    const input: ListingInput = {
      title: extracted.title.value || "",
      retailer: extracted.retailer.value,
      seller: extracted.seller.value,
      brand: extracted.brand.value,
      brandStore: extracted.brandStore.value,
      price: extracted.price.value,
      mrp: extracted.mrp.value,
      currency: extracted.currency.value,
      description: extracted.description.value || "",
      returnPolicy: extracted.returnPolicy.value,
      paymentMethods: extracted.paymentMethods.value, // null on page
      url: submittedShortUrl,
      canonicalUrl,
      image: extracted.image.value,
      rating: extracted.rating.value,
      reviewCount: extracted.reviewCount.value,
      boughtPastMonth: extracted.boughtPastMonth.value,
    };

    const analysis = runDeterministicAnalysis(input, { retrievalMethod: "url_fetch" });

    // 1. Must produce ZERO warnings
    expect(analysis.warnings.length).toBe(0);

    // 2. Risk level must be LOW
    expect(analysis.riskLevel).toBe("LOW");
    expect(analysis.riskScore).toBe(0);

    // 3. Must NOT warn that payment methods are suspicious
    const paymentWarning = analysis.warnings.find((w) => w.category === "payment");
    expect(paymentWarning).toBeUndefined();

    // 4. Must NOT claim return terms are restrictive
    const returnWarning = analysis.warnings.find((w) => w.category === "return_policy");
    expect(returnWarning).toBeUndefined();

    // 5. Missing payment methods must be in unverifiedAspects, NOT in warnings
    expect(
      analysis.unverifiedAspects.some((u) => u.toLowerCase().includes("payment"))
    ).toBe(true);

    // 6. Summary must clearly state that no specific warnings were detected
    expect(analysis.summary).toContain("No specific warning signs were found");
  });
});

