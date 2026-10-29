import * as cheerio from "cheerio";

export interface ExtractedField<T> {
  value: T;
  source: string;
  confidence: "high" | "medium" | "low";
  raw?: string;
}

export interface ExtractedProductDetails {
  title: ExtractedField<string | null>;
  image: ExtractedField<string | null>;
  price: ExtractedField<number | null>;
  mrp: ExtractedField<number | null>;
  currency: ExtractedField<string>;
  retailer: ExtractedField<string>;
  seller: ExtractedField<string | null>;
  brand: ExtractedField<string | null>;
  brandStore: ExtractedField<string | null>;
  description: ExtractedField<string | null>;
  returnPolicy: ExtractedField<string | null>;
  paymentMethods: ExtractedField<string | null>;
  rating: ExtractedField<number | null>;
  reviewCount: ExtractedField<number | null>;
  boughtPastMonth: ExtractedField<string | null>;
  canonicalUrl: string;
  submittedUrl: string;
  missingFields: string[];
}

function cleanText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const decoded = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return decoded.length > 0 ? decoded : null;
}

export function detectRetailerFromUrl(urlString: string): {
  name: string;
  isMarketplace: boolean;
  platform: string;
} {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "amazon.in" || host === "amzn.in") {
      return { name: "Amazon India", isMarketplace: true, platform: "amazon" };
    }
    if (host === "amazon.com" || host === "amzn.to" || host === "a.co") {
      return { name: "Amazon", isMarketplace: true, platform: "amazon" };
    }
    if (host === "amazon.co.uk") {
      return { name: "Amazon UK", isMarketplace: true, platform: "amazon" };
    }
    if (host.startsWith("amazon.")) {
      const tld = host.split(".")[1]?.toUpperCase() || "";
      return {
        name: `Amazon ${tld}`,
        isMarketplace: true,
        platform: "amazon",
      };
    }
    if (host === "flipkart.com") {
      return { name: "Flipkart", isMarketplace: true, platform: "flipkart" };
    }
    if (host === "walmart.com") {
      return { name: "Walmart", isMarketplace: true, platform: "walmart" };
    }
    if (host === "target.com") {
      return { name: "Target", isMarketplace: true, platform: "target" };
    }
    if (host === "ebay.com" || host.startsWith("ebay.")) {
      return { name: "eBay", isMarketplace: true, platform: "ebay" };
    }
    if (host === "bestbuy.com") {
      return { name: "Best Buy", isMarketplace: true, platform: "bestbuy" };
    }

    // Generic domain formatting: e.g. blueridgeroasters.com -> "Blue Ridge Roasters"
    const rootName = host.split(".")[0] || host;
    const formatted = rootName
      .replace(/[-_]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    return {
      name: formatted || host,
      isMarketplace: false,
      platform: "independent",
    };
  } catch {
    return { name: "Online Store", isMarketplace: false, platform: "unknown" };
  }
}

function parsePriceNumber(raw: any): number | null {
  if (typeof raw === "number") return raw > 0 ? raw : null;
  if (typeof raw === "string") {
    // Look for numbers with optional commas or dots: e.g. "52,990", "52,990.00", "89.50"
    const match = raw.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      return !isNaN(parsed) && parsed > 0 ? parsed : null;
    }
  }
  return null;
}

function parseCurrencyCode(raw: string | null | undefined): string {
  if (!raw) return "USD";
  if (raw.includes("₹") || /inr/i.test(raw) || /rs\.?/i.test(raw)) return "INR";
  if (raw.includes("€") || /eur/i.test(raw)) return "EUR";
  if (raw.includes("£") || /gbp/i.test(raw)) return "GBP";
  if (raw.includes("$") || /usd/i.test(raw)) return "USD";
  if (/cad/i.test(raw)) return "CAD";
  if (/aud/i.test(raw)) return "AUD";
  const threeLetter = raw.match(/[A-Z]{3}/);
  return threeLetter ? threeLetter[0] : "USD";
}

function extractJsonLdProducts($: cheerio.CheerioAPI): any[] {
  const products: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).contents().text().trim();
      if (!content) return;
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed)
        ? parsed
        : parsed["@graph"] && Array.isArray(parsed["@graph"])
        ? parsed["@graph"]
        : [parsed];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const type = item["@type"];
        const isProduct =
          type === "Product" ||
          (Array.isArray(type) && type.includes("Product")) ||
          type === "IndividualProduct";

        if (isProduct) {
          products.push(item);
        }
      }
    } catch {
      // Safe ignore malformed json-ld
    }
  });
  return products;
}

function extractMetaTag($: cheerio.CheerioAPI, propertyOrName: string): string | null {
  const val =
    $(`meta[property="${propertyOrName}"]`).attr("content") ||
    $(`meta[name="${propertyOrName}"]`).attr("content") ||
    $(`meta[property="${propertyOrName.toLowerCase()}"]`).attr("content") ||
    $(`meta[name="${propertyOrName.toLowerCase()}"]`).attr("content");
  return cleanText(val);
}

export function extractProductData(
  html: string,
  canonicalUrl: string,
  submittedUrl?: string
): ExtractedProductDetails {
  const sourceUrl = submittedUrl || canonicalUrl;
  const retailerInfo = detectRetailerFromUrl(canonicalUrl || sourceUrl);

  const $ = cheerio.load(html);

  let title: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let image: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let price: ExtractedField<number | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let mrp: ExtractedField<number | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let currency: ExtractedField<string> = {
    value: canonicalUrl.includes(".in") || sourceUrl.includes(".in") ? "INR" : "USD",
    source: "domain_default",
    confidence: "low",
  };
  let retailer: ExtractedField<string> = {
    value: retailerInfo.name,
    source: "domain_url",
    confidence: "high",
  };
  let seller: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let brand: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let brandStore: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let description: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let returnPolicy: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let paymentMethods: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let rating: ExtractedField<number | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let reviewCount: ExtractedField<number | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };
  let boughtPastMonth: ExtractedField<string | null> = {
    value: null,
    source: "none",
    confidence: "low",
  };

  // ==========================================
  // LEVEL 1: JSON-LD Structured Data
  // ==========================================
  const jsonLdProducts = extractJsonLdProducts($);
  if (jsonLdProducts.length > 0) {
    const primary = jsonLdProducts[0];

    if (primary.name) {
      title = {
        value: cleanText(String(primary.name)),
        source: "json_ld_name",
        confidence: "high",
      };
    }

    if (primary.description) {
      description = {
        value: cleanText(String(primary.description)),
        source: "json_ld_description",
        confidence: "high",
      };
    }

    if (primary.image) {
      let imgVal: string | null = null;
      if (typeof primary.image === "string") imgVal = primary.image;
      else if (Array.isArray(primary.image) && primary.image.length > 0) {
        imgVal = typeof primary.image[0] === "string" ? primary.image[0] : primary.image[0]?.url;
      } else if (primary.image.url) {
        imgVal = primary.image.url;
      }
      if (imgVal) {
        image = {
          value: imgVal,
          source: "json_ld_image",
          confidence: "high",
        };
      }
    }

    if (primary.brand) {
      const bName = typeof primary.brand === "string" ? primary.brand : primary.brand.name;
      if (bName) {
        brand = {
          value: cleanText(bName),
          source: "json_ld_brand",
          confidence: "high",
        };
      }
    }

    if (primary.aggregateRating) {
      const ar = primary.aggregateRating;
      const rVal = parseFloat(ar.ratingValue);
      const rCount = parseInt(ar.ratingCount || ar.reviewCount, 10);
      if (!isNaN(rVal)) {
        rating = { value: rVal, source: "json_ld_aggregateRating", confidence: "high" };
      }
      if (!isNaN(rCount)) {
        reviewCount = { value: rCount, source: "json_ld_aggregateRating", confidence: "high" };
      }
    }

    const offers = primary.offers;
    if (offers) {
      const offerList = Array.isArray(offers) ? offers : [offers];
      if (offerList.length > 0) {
        const firstOffer = offerList[0];
        if (firstOffer.price) {
          const parsed = parsePriceNumber(firstOffer.price);
          if (parsed !== null) {
            price = {
              value: parsed,
              source: "json_ld_offer_price",
              confidence: "high",
              raw: String(firstOffer.price),
            };
          }
        }
        if (firstOffer.priceCurrency) {
          currency = {
            value: parseCurrencyCode(firstOffer.priceCurrency),
            source: "json_ld_priceCurrency",
            confidence: "high",
          };
        }
        if (firstOffer.seller) {
          const sName =
            typeof firstOffer.seller === "string"
              ? firstOffer.seller
              : firstOffer.seller.name;
          if (sName) {
            seller = {
              value: cleanText(sName),
              source: "json_ld_seller",
              confidence: "high",
            };
          }
        }
        if (firstOffer.hasMerchantReturnPolicy) {
          const rp = firstOffer.hasMerchantReturnPolicy;
          const rpName = typeof rp === "string" ? rp : rp.name || rp.returnPolicyCategory;
          if (rpName) {
            returnPolicy = {
              value: cleanText(rpName),
              source: "json_ld_returnPolicy",
              confidence: "high",
            };
          }
        }
      }
    }
  }

  // ==========================================
  // LEVEL 2: Marketplace-Specific Extraction (Amazon India)
  // ==========================================
  const isAmazon = retailerInfo.platform === "amazon";

  if (isAmazon) {
    // 1. Amazon Product Title
    if (!title.value || title.confidence !== "high") {
      const amzTitleEl = $("#productTitle");
      if (amzTitleEl.length > 0) {
        const cleanAmzTitle = cleanText(amzTitleEl.text());
        if (cleanAmzTitle) {
          title = {
            value: cleanAmzTitle,
            source: "amazon_product_title",
            confidence: "high",
            raw: amzTitleEl.text(),
          };
        }
      }
    }

    // 2. Amazon Price & Currency
    const priceSelectors = [
      ".priceToPay .a-offscreen",
      "#corePriceDisplay_desktop_feature_div .a-offscreen",
      "#corePrice_feature_div .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      ".a-price.aok-align-center .a-offscreen",
      "#apex_desktop .a-price .a-offscreen",
    ];

    for (const sel of priceSelectors) {
      const match = $(sel).first();
      if (match.length > 0) {
        const rawPriceStr = match.text().trim();
        const parsedP = parsePriceNumber(rawPriceStr);
        if (parsedP !== null) {
          price = {
            value: parsedP,
            source: "amazon_price_offscreen",
            confidence: "high",
            raw: rawPriceStr,
          };
          currency = {
            value: parseCurrencyCode(rawPriceStr),
            source: "amazon_price_symbol",
            confidence: "high",
          };
          break;
        }
      }
    }

    // Amazon MRP / Basis Price
    const mrpSelectors = [
      ".a-text-price .a-offscreen",
      "#basisPrice .a-offscreen",
      ".basisPrice .a-offscreen",
    ];
    for (const sel of mrpSelectors) {
      const match = $(sel).first();
      if (match.length > 0) {
        const rawMrpStr = match.text().trim();
        const parsedMrp = parsePriceNumber(rawMrpStr);
        if (parsedMrp !== null) {
          mrp = {
            value: parsedMrp,
            source: "amazon_basis_price_mrp",
            confidence: "high",
            raw: rawMrpStr,
          };
          break;
        }
      }
    }

    // 3. Amazon Image
    if (!image.value) {
      const landingImg = $("#landingImage");
      if (landingImg.length > 0) {
        const dynamicImgAttr = landingImg.attr("data-a-dynamic-image");
        if (dynamicImgAttr) {
          try {
            const imgObj = JSON.parse(dynamicImgAttr);
            const imgKeys = Object.keys(imgObj);
            if (imgKeys.length > 0 && imgKeys[0].startsWith("http")) {
              image = {
                value: imgKeys[0],
                source: "amazon_dynamic_image",
                confidence: "high",
              };
            }
          } catch {
            // ignore
          }
        }

        if (!image.value) {
          const oldHires = landingImg.attr("data-old-hires");
          if (oldHires && oldHires.startsWith("http")) {
            image = {
              value: oldHires,
              source: "amazon_landingImage_old_hires",
              confidence: "high",
            };
          }
        }

        if (!image.value) {
          const srcAttr = landingImg.attr("src");
          if (srcAttr && srcAttr.startsWith("http")) {
            image = {
              value: srcAttr,
              source: "amazon_landingImage_src",
              confidence: "medium",
            };
          }
        }
      }
    }

    // 4. Amazon Ratings & Review Count
    const acrPopoverTitle = $("#acrPopover").attr("title");
    const aIconAltText = $(".a-icon-alt").first().text();
    const ratingRaw = acrPopoverTitle || aIconAltText;
    if (ratingRaw) {
      const match = ratingRaw.match(/([0-9.]+)\s+out\s+of/i);
      if (match && match[1]) {
        const parsedR = parseFloat(match[1]);
        if (!isNaN(parsedR)) {
          rating = {
            value: parsedR,
            source: "amazon_acrPopover",
            confidence: "high",
          };
        }
      }
    }

    const reviewText = $("#acrCustomerReviewText").text();
    if (reviewText) {
      const match = reviewText.match(/([0-9,]+)\s*(?:ratings|reviews)/i);
      if (match && match[1]) {
        const parsedCount = parseInt(match[1].replace(/,/g, ""), 10);
        if (!isNaN(parsedCount)) {
          reviewCount = {
            value: parsedCount,
            source: "amazon_acrCustomerReviewText",
            confidence: "high",
          };
        }
      }
    }

    // Social proof: "1K+ bought in past month"
    const socialProofEl = $("#social-proofing-faceout-title-tk_bought, .social-proofing-faceout-title");
    const socialProofText = socialProofEl.text() || html;
    const boughtMatch = socialProofText.match(/([0-9Kk+]+\s*bought\s+in\s+past\s+month)/i);
    if (boughtMatch && boughtMatch[1]) {
      boughtPastMonth = {
        value: cleanText(boughtMatch[1]),
        source: "amazon_social_proofing",
        confidence: "high",
      };
    }

    // 5. Amazon Brand Store vs Seller
    const bylineEl = $("#bylineInfo");
    if (bylineEl.length > 0) {
      const bylineClean = cleanText(bylineEl.text());
      if (bylineClean) {
        brandStore = {
          value: bylineClean,
          source: "amazon_byline_store",
          confidence: "high",
        };
        const brandClean = bylineClean
          .replace(/^Visit the\s+/i, "")
          .replace(/\s+Store$/i, "")
          .replace(/^Brand:\s*/i, "")
          .trim();
        if (brandClean) {
          brand = {
            value: brandClean,
            source: "amazon_byline_brand",
            confidence: "high",
          };
        }
      }
    }

    // Explicit Transaction Seller:
    const merchantInfoEl = $("#merchant-info");
    const tabularSoldByEl = $('[tabular-attribute-name="Sold by"]');
    const rawMerchant = cleanText(merchantInfoEl.text()) || cleanText(tabularSoldByEl.text());

    if (rawMerchant) {
      const soldByMatch = rawMerchant.match(/Sold by\s+([^.<]+?)(?:and\s+Fulfilled|\.|$)/i);
      const sellerName = soldByMatch ? cleanText(soldByMatch[1]) : rawMerchant;
      if (sellerName) {
        seller = {
          value: sellerName,
          source: "amazon_merchant_info",
          confidence: "high",
        };
      }
    }

    // 6. Amazon Return / Replacement Policy
    const rpEl = $("#RETURNS_POLICY, #productSupport-replacement-count, .icon-farm-wrapper");
    if (rpEl.length > 0) {
      const rpText = cleanText(rpEl.text());
      if (rpText) {
        const match = rpText.match(/(\d+\s*days?\s*(?:Service\s*Centre\s*)?Replacement|\d+\s*days?\s*Returnable|\d+\s*days?\s*Return)/i);
        if (match && match[1]) {
          returnPolicy = {
            value: cleanText(match[1]),
            source: "amazon_service_pill",
            confidence: "high",
          };
        } else if (rpText.length < 100) {
          returnPolicy = {
            value: rpText,
            source: "amazon_service_pill",
            confidence: "high",
          };
        }
      }
    }
  }

  // ==========================================
  // LEVEL 3: Open Graph & Meta Tags (Fallback)
  // ==========================================
  if (!title.value) {
    const ogTitle = extractMetaTag($, "og:title") || extractMetaTag($, "twitter:title");
    if (ogTitle) {
      title = {
        value: ogTitle,
        source: "open_graph_title",
        confidence: "medium",
      };
    }
  }

  if (!image.value) {
    const ogImage =
      extractMetaTag($, "og:image") ||
      extractMetaTag($, "twitter:image") ||
      extractMetaTag($, "og:image:secure_url");
    if (ogImage) {
      image = {
        value: ogImage,
        source: "open_graph_image",
        confidence: "medium",
      };
    }
  }

  if (!description.value) {
    const ogDesc =
      extractMetaTag($, "og:description") ||
      extractMetaTag($, "twitter:description") ||
      extractMetaTag($, "description");
    if (ogDesc) {
      description = {
        value: ogDesc,
        source: "open_graph_description",
        confidence: "medium",
      };
    }
  }

  if (!price.value) {
    const ogPrice =
      extractMetaTag($, "product:price:amount") ||
      extractMetaTag($, "og:price:amount");
    if (ogPrice) {
      const parsedOgP = parsePriceNumber(ogPrice);
      if (parsedOgP !== null) {
        price = {
          value: parsedOgP,
          source: "open_graph_price",
          confidence: "medium",
        };
      }
    }
  }

  const ogCurrency =
    extractMetaTag($, "product:price:currency") ||
    extractMetaTag($, "og:price:currency");
  if (ogCurrency && ogCurrency.length === 3) {
    currency = {
      value: ogCurrency.toUpperCase(),
      source: "open_graph_currency",
      confidence: "medium",
    };
  }

  // ==========================================
  // LEVEL 4: HTML Heading / Title Tag Fallback
  // ==========================================
  if (!title.value) {
    const titleTagText = cleanText($("title").text());
    if (titleTagText) {
      const cleanedTitle = titleTagText.split(/\s*[-–—|:•]\s*/)[0];
      title = {
        value: cleanText(cleanedTitle) || titleTagText,
        source: "html_title_tag",
        confidence: "low",
      };
    }
  }

  if (!title.value) {
    const h1Text = cleanText($("h1").first().text());
    if (h1Text) {
      title = {
        value: h1Text,
        source: "html_h1_tag",
        confidence: "low",
      };
    }
  }

  // Look for return policy clues in text only if not already found
  if (!returnPolicy.value) {
    const returnSnippets = [
      /(?:return|refund)\s+policy[:\s]+([^.<\n]{15,180}\.)/i,
      /(?:30-day|14-day|60-day)\s+(?:money[- ]back\s+guarantee|free returns|return window)/i,
      /(?:all sales final|no returns accepted|no refunds|as-is)/i,
      /(?:returns accepted within \d+ days)/i,
    ];

    const bodyText = $("body").text() || html;
    for (const pat of returnSnippets) {
      const match = bodyText.match(pat);
      if (match) {
        returnPolicy = {
          value: cleanText(match[0]),
          source: "html_text_snippet",
          confidence: "low",
        };
        break;
      }
    }
  }

  // Normalize absolute image URL if relative
  if (image.value && !image.value.startsWith("http://") && !image.value.startsWith("https://")) {
    try {
      image.value = new URL(image.value, canonicalUrl).toString();
    } catch {
      image.value = null;
    }
  }

  // Identify missing fields honestly
  const missingFields: string[] = [];
  if (!title.value) missingFields.push("Product title");
  if (price.value === null) missingFields.push("Price");
  if (!seller.value && !retailer.value) missingFields.push("Seller identity");
  if (!description.value) missingFields.push("Product description");
  if (!returnPolicy.value) missingFields.push("Return policy");
  if (!paymentMethods.value) missingFields.push("Payment methods");

  return {
    title,
    image,
    price,
    mrp,
    currency,
    retailer,
    seller,
    brand,
    brandStore,
    description,
    returnPolicy,
    paymentMethods,
    rating,
    reviewCount,
    boughtPastMonth,
    canonicalUrl,
    submittedUrl: sourceUrl,
    missingFields,
  };
}
