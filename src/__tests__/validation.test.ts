import { describe, it, expect } from "vitest";
import {
  validateManualListing,
  validateUrlInput,
  sanitizeInputText,
} from "../lib/validation";

describe("Input Validation & Schema Enforcement", () => {
  const validBase = {
    title: "Ergonomic Office Chair",
    seller: "Comfort Works Inc",
    price: 199.99,
    currency: "USD",
    description: "Breathable mesh back with adjustable lumbar support and 3D armrests.",
    returnPolicy: "30-day free returns",
    paymentMethods: "Visa, Mastercard, PayPal",
    url: "https://example.com/chair",
  };

  it("passes validation with valid complete inputs", () => {
    const res = validateManualListing(validBase);
    expect(res.success).toBe(true);
    expect(res.data?.currency).toBe("USD");
  });

  it("fails when required fields are missing", () => {
    const empty = {};
    const res = validateManualListing(empty);
    expect(res.success).toBe(false);
    expect(res.errors?.title).toBeDefined();
    expect(res.errors?.description).toBeDefined();
  });

  it("rejects non-positive prices and invalid numbers", () => {
    const negativePrice = { ...validBase, price: -50 };
    const resNeg = validateManualListing(negativePrice);
    expect(resNeg.success).toBe(false);

    const stringPrice = { ...validBase, price: "not-a-number" as any };
    const resStr = validateManualListing(stringPrice);
    expect(resStr.success).toBe(false);
  });

  it("rejects oversized inputs beyond defined limits", () => {
    // Title > 300 chars
    const oversizedTitle = {
      ...validBase,
      title: "A".repeat(301),
    };
    const resTitle = validateManualListing(oversizedTitle);
    expect(resTitle.success).toBe(false);
    expect(resTitle.errors?.title).toContain("must not exceed 300");

    // Description > 15,000 chars
    const oversizedDesc = {
      ...validBase,
      description: "X".repeat(15001),
    };
    const resDesc = validateManualListing(oversizedDesc);
    expect(resDesc.success).toBe(false);
    expect(resDesc.errors?.description).toContain("must not exceed 15000");

    // Price > 100,000,000
    const giantPrice = {
      ...validBase,
      price: 150_000_000,
    };
    const resPrice = validateManualListing(giantPrice);
    expect(resPrice.success).toBe(false);
  });

  it("validates currency codes strictly as 3-letter codes", () => {
    const badCurrency = { ...validBase, currency: "US DOLLAR" };
    const res = validateManualListing(badCurrency);
    expect(res.success).toBe(false);
    expect(res.errors?.currency).toBeDefined();

    const lowercaseValid = { ...validBase, currency: "eur" };
    const resLower = validateManualListing(lowercaseValid);
    expect(resLower.success).toBe(true);
    expect(resLower.data?.currency).toBe("EUR");
  });

  it("validates URL structure if provided", () => {
    const badUrl = { ...validBase, url: "ftp://files.example.com" };
    const resBad = validateManualListing(badUrl);
    expect(resBad.success).toBe(false);

    const notAUrl = { ...validBase, url: "just text not a url" };
    const resNot = validateManualListing(notAUrl);
    expect(resNot.success).toBe(false);

    const validHttps = { ...validBase, url: "https://shop.example.com/product/123" };
    expect(validateManualListing(validHttps).success).toBe(true);
  });

  it("validates single URL input for the one-link product check flow", () => {
    expect(validateUrlInput({ url: "" }).success).toBe(false);
    expect(validateUrlInput({ url: "not a url" }).success).toBe(false);
    expect(validateUrlInput({ url: "https://example.com/product/item-1" }).success).toBe(true);
    expect(validateUrlInput({ url: "http://store.net/shoes" }).success).toBe(true);
  });

  it("sanitizes text by removing null bytes and control characters", () => {
    const dirty = "Hello\0 World\u0007!";
    const cleaned = sanitizeInputText(dirty);
    expect(cleaned).toBe("Hello World!");
  });
});
