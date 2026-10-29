import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/analyzer/rateLimit";
import { validateUrlInput, validateManualListing } from "@/lib/validation";
import { fetchProductPage } from "@/lib/url/fetcher";
import { extractProductData } from "@/lib/url/extractor";
import { runDeterministicAnalysis } from "@/lib/analyzer/deterministic";
import { enrichWithAIIfConfigured } from "@/lib/analyzer/gemini";
import { SAMPLE_CASES } from "@/lib/samples";
import { ListingInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "Rate limit reached. Please wait a few moments before checking another product.",
          retryAfterSec: rateLimit.resetInSec,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.resetInSec) },
        }
      );
    }

    // 2. Parse request payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    // Case A: Sample request by sampleId
    if (body.sampleId) {
      const sample = SAMPLE_CASES.find((s) => s.id === body.sampleId);
      if (!sample) {
        return NextResponse.json(
          { error: `Sample with ID "${body.sampleId}" was not found.` },
          { status: 404 }
        );
      }

      const deterministic = runDeterministicAnalysis(sample.input, {
        isDemo: true,
        retrievalMethod: "demo_sample",
      });
      const enriched = await enrichWithAIIfConfigured(sample.input, deterministic);
      return NextResponse.json(enriched, { status: 200 });
    }

    // Case B: Direct manual input or edited details fallback
    if (body.manualInput) {
      const validation = validateManualListing(body.manualInput);
      if (!validation.success || !validation.data) {
        return NextResponse.json(
          {
            error: "Please check the provided listing details.",
            fieldErrors: validation.errors,
          },
          { status: 400 }
        );
      }

      const deterministic = runDeterministicAnalysis(validation.data, {
        isDemo: false,
        retrievalMethod: "manual_paste",
      });
      const enriched = await enrichWithAIIfConfigured(
        validation.data,
        deterministic
      );
      return NextResponse.json(enriched, { status: 200 });
    }

    // Case C: One-link product URL check (Primary flow)
    const urlValidation = validateUrlInput(body);
    if (!urlValidation.success || !urlValidation.url) {
      return NextResponse.json(
        { error: urlValidation.error || "Please enter a valid product URL." },
        { status: 400 }
      );
    }

    const targetUrl = urlValidation.url;

    // Check if URL matches a sample link directly
    const matchedSample = SAMPLE_CASES.find(
      (s) =>
        s.displayUrl.toLowerCase() === targetUrl.toLowerCase() ||
        s.input.url?.toLowerCase() === targetUrl.toLowerCase()
    );
    if (matchedSample) {
      const deterministic = runDeterministicAnalysis(matchedSample.input, {
        isDemo: true,
        retrievalMethod: "demo_sample",
      });
      const enriched = await enrichWithAIIfConfigured(
        matchedSample.input,
        deterministic
      );
      return NextResponse.json(enriched, { status: 200 });
    }

    // Retrieve public product page on the server
    const fetchResult = await fetchProductPage(targetUrl);

    if (!fetchResult.ok || !fetchResult.html) {
      return NextResponse.json(
        {
          retrievalFailed: true,
          error:
            fetchResult.error ||
            "Unable to retrieve the product page from this server.",
          blockedByAntiBot: fetchResult.blockedByAntiBot ?? false,
          statusCode: fetchResult.statusCode,
          url: targetUrl,
        },
        { status: 200 }
      );
    }

    const finalCanonicalUrl = fetchResult.finalUrl || targetUrl;

    // Extract product details safely from HTML
    const extracted = extractProductData(fetchResult.html, finalCanonicalUrl, targetUrl);

    // If page contains virtually no product text (blank client SPA shell)
    if (!extracted.title.value && !extracted.description.value) {
      return NextResponse.json(
        {
          retrievalFailed: true,
          error:
            "The webpage loaded, but no readable product details or metadata could be extracted. The site may rely exclusively on client-side JavaScript rendering or require user authentication.",
          url: targetUrl,
        },
        { status: 200 }
      );
    }

    const listingInput: ListingInput = {
      title: extracted.title.value || "Untitled Product",
      retailer: extracted.retailer.value,
      seller: extracted.seller.value,
      brand: extracted.brand.value,
      brandStore: extracted.brandStore.value,
      price: extracted.price.value,
      mrp: extracted.mrp.value,
      currency: extracted.currency.value,
      description:
        extracted.description.value ||
        "No full product description text was extracted from page metadata.",
      returnPolicy: extracted.returnPolicy.value,
      paymentMethods: extracted.paymentMethods.value,
      url: targetUrl,
      canonicalUrl: finalCanonicalUrl,
      image: extracted.image.value,
      rating: extracted.rating.value,
      reviewCount: extracted.reviewCount.value,
      boughtPastMonth: extracted.boughtPastMonth.value,
    };

    const deterministic = runDeterministicAnalysis(listingInput, {
      isDemo: false,
      retrievalMethod: "url_fetch",
    });

    const finalResult = await enrichWithAIIfConfigured(
      listingInput,
      deterministic
    );

    return NextResponse.json(finalResult, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (err: unknown) {
    console.error("API /api/analyze error:", err);
    return NextResponse.json(
      {
        error:
          "An unexpected server error occurred while analyzing the product.",
      },
      { status: 500 }
    );
  }
}
