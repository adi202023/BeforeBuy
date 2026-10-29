import { describe, it, expect } from "vitest";
import { extractProductData } from "../lib/url/extractor";

describe("Product Page Metadata & HTML Extractor", () => {
  it("extracts structured JSON-LD product details correctly", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page</title>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "Classic Wool Knit Sweater",
            "image": "https://example.com/sweater.jpg",
            "description": "100% Merino wool knit sweater crafted with ribbed cuffs.",
            "brand": {
              "@type": "Brand",
              "name": "Heritage Woolens"
            },
            "offers": {
              "@type": "Offer",
              "price": "89.50",
              "priceCurrency": "USD",
              "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "name": "30-day free returns"
              }
            }
          }
          </script>
        </head>
        <body>
          <h1>Shop</h1>
        </body>
      </html>
    `;

    const extracted = extractProductData(html, "https://heritagewoolens.com/products/sweater");

    expect(extracted.title.value).toBe("Classic Wool Knit Sweater");
    expect(extracted.price.value).toBe(89.5);
    expect(extracted.currency.value).toBe("USD");
    expect(extracted.brand.value).toBe("Heritage Woolens");
    expect(extracted.image.value).toBe("https://example.com/sweater.jpg");
    expect(extracted.returnPolicy.value).toBe("30-day free returns");
    expect(extracted.title.confidence).toBe("high");
  });

  it("extracts OpenGraph and Twitter meta tags when JSON-LD is absent", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:title" content="Wireless Bluetooth Speaker" />
          <meta property="og:description" content="Waterproof outdoor portable speaker with 12 hour battery life." />
          <meta property="og:image" content="https://example.com/speaker.png" />
          <meta property="product:price:amount" content="45.00" />
          <meta property="product:price:currency" content="EUR" />
          <meta property="og:site_name" content="SoundWave Audio" />
        </head>
        <body>
          <p>Accepted payment methods: Visa, Mastercard, Apple Pay</p>
        </body>
      </html>
    `;

    const extracted = extractProductData(html, "https://soundwave.com/speaker");

    expect(extracted.title.value).toBe("Wireless Bluetooth Speaker");
    expect(extracted.price.value).toBe(45.0);
    expect(extracted.currency.value).toBe("EUR");
    expect(extracted.retailer.value).toBe("Soundwave");
    expect(extracted.image.value).toBe("https://example.com/speaker.png");
    expect(extracted.description.value).toContain("Waterproof outdoor");
  });

  it("falls back to HTML headings and regex snippets when metadata is sparse", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Handmade Ceramic Mug | Pottery Studio</title>
        </head>
        <body>
          <h1>Handmade Ceramic Mug</h1>
          <p>Return policy: 14-day money back guarantee on all tableware items.</p>
        </body>
      </html>
    `;

    const extracted = extractProductData(html, "https://potterystudio.com/mug");

    expect(extracted.title.value).toBe("Handmade Ceramic Mug");
    expect(extracted.returnPolicy.value).toContain("14-day money back guarantee");
    // Missing fields should be tracked honestly
    expect(extracted.missingFields).toContain("Price");
    expect(extracted.price.value).toBeNull();
  });

  it("identifies missing fields honestly without fabricating data", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Minimal Listing</title></head>
        <body>
          <h1>Simple Widget</h1>
        </body>
      </html>
    `;

    const extracted = extractProductData(html, "https://example.com/item");
    expect(extracted.missingFields).toContain("Price");
    expect(extracted.missingFields).toContain("Product description");
    expect(extracted.missingFields).toContain("Return policy");
    expect(extracted.missingFields).toContain("Payment methods");
  });
});
