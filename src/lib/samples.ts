import { SampleCase } from "./types";

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: "sample-amazon-vivobook",
    name: "ASUS Vivobook 15 Laptop (Amazon India)",
    displayUrl: "https://amzn.in/d/0bqSf8t5",
    tagline: "Amazon India verified listing, ₹52,990 (-38% off M.R.P.), 10-day replacement",
    expectedRisk: "LOW",
    scenarioNotes:
      "A legitimate Amazon India electronics listing visibly offering ₹52,990 price, 3.9 stars (42 ratings), 1K+ bought in past month, and 10 days service centre replacement.",
    input: {
      title:
        'ASUS Vivobook 15 (2026),Intel Core 3 100U (i3-14th Gen),Intel iGPU, 8GB/512GB, FHD, 15.6"(39.6 cm),Windows 11,M365 Basic(1 Year)* Office 2024,Quiet Blue,1.7 Kg, X1504VAP-BQ1322WS,Thin & Light Laptop',
      retailer: "Amazon India",
      seller: null,
      brand: "ASUS",
      brandStore: "Visit the ASUS Store",
      price: 52990,
      mrp: 84990,
      currency: "INR",
      rating: 3.9,
      reviewCount: 42,
      boughtPastMonth: "1K+ bought in past month",
      image:
        "https://m.media-amazon.com/images/I/71c5W9NxN5L._SL1500_.jpg",
      description:
        "Processor: Intel Core 3 100U Processor 1.2 GHz (10MB Cache, up to 4.7 GHz, 6 cores, 8 Threads) | Memory: 8GB DDR4 SO-DIMM | Storage: 512GB M.2 NVMe PCIe 4.0 SSD | Display: 15.6-inch (39.62 cm) FHD (1920 x 1080) 16:9 aspect ratio, 60Hz refresh rate, 250nits, 45% NTSC color gamut, Anti-glare display | Operating System: Windows 11 Home with lifetime validity.",
      returnPolicy: "10 days Service Centre Replacement",
      paymentMethods: null,
      url: "https://amzn.in/d/0bqSf8t5",
      canonicalUrl: "https://www.amazon.in/dp/B0D1VAPWS",
    },
  },
  {
    id: "sample-suspicious",
    name: "Rolex Submariner 41mm Luxury 'Clearance'",
    displayUrl: "https://rolex-clearance-outlet.xyz/products/submariner-date",
    tagline: "96% discount ($49.99), wire/crypto only, all sales final disclaimed",
    expectedRisk: "HIGH",
    scenarioNotes:
      "Classic fraudulent liquidation template advertising authentic Swiss luxury watches for $49.99, mandating irreversible wire/crypto payments, and disclaiming all refunds.",
    input: {
      title: "Rolex Submariner Date 41mm Oystersteel Automatic - Brand New in Box",
      retailer: "Rolex Clearance Outlet",
      seller: "Official-Luxury-Clearance-Direct",
      brand: "Rolex",
      price: 49.99,
      mrp: 14500,
      currency: "USD",
      image:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23fbf5f5'/><circle cx='200' cy='200' r='100' fill='%231f2937'/><circle cx='200' cy='200' r='80' fill='%230f172a' stroke='%23e11d48' stroke-width='4'/><line x1='200' y1='200' x2='200' y2='150' stroke='%23ffffff' stroke-width='4'/><line x1='200' y1='200' x2='235' y2='200' stroke='%23ffffff' stroke-width='3'/><text x='200' y='330' font-family='sans-serif' font-size='14' fill='%23e11d48' text-anchor='middle'>96% OFF SALE</text></svg>",
      description:
        "ACT FAST! Factory direct bankruptcy liquidation warehouse sale! 100% authentic original Swiss luxury timepiece. Only 2 units remaining at this special price before inventory returns to $14,500 retail. Over 96% off today only! Contact our warehouse manager on WhatsApp for expedited order confirmation.",
      returnPolicy:
        "Strictly all sales final. As-is liquidation items cannot be returned or refunded under any circumstances. No chargebacks permitted.",
      paymentMethods:
        "Cryptocurrency (USDT/Bitcoin), Western Union, Bank Wire Transfer, or Zelle only.",
      url: "https://rolex-clearance-outlet.xyz/products/submariner-date",
      canonicalUrl: "https://rolex-clearance-outlet.xyz/products/submariner-date",
    },
  },
  {
    id: "sample-ambiguous",
    name: "UltraBreeze Portable 3-in-1 Cooler",
    displayUrl: "https://techvibestore.shop/products/ultrabreeze-cooler",
    tagline: "Overseas return burden, 25% restocking deduction, and store credit only",
    expectedRisk: "MEDIUM",
    scenarioNotes:
      "A typical social media direct-to-consumer gadget storefront. Credit cards are accepted, but returns require shipping back to an overseas fulfillment center with a 25% restocking penalty.",
    input: {
      title: "UltraBreeze Portable 3-in-1 Hydro-Cooling Air Conditioner Fan",
      retailer: "TechVibe Store",
      seller: "TechVibe Direct",
      brand: "UltraBreeze",
      price: 64.95,
      mrp: 99.95,
      currency: "USD",
      image:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23f8fafc'/><rect x='140' y='120' width='120' height='160' rx='20' fill='%23e2e8f0' stroke='%2394a3b8' stroke-width='4'/><circle cx='200' cy='180' r='35' fill='%2338bdf8' opacity='0.3'/><text x='200' y='320' font-family='sans-serif' font-size='14' fill='%2364748b' text-anchor='middle'>Portable Cooler</text></svg>",
      description:
        "Stay cool anywhere! Next-generation mini portable evaporative air cooler with 7-color LED mood lights and ultrasonic mist spray. Plugs into any USB-C port. Compact design suitable for office desks and bedrooms. Fast worldwide shipping.",
      returnPolicy:
        "Returns considered at company discretion within 14 days of delivery. Customer must pay all international return shipping fees to our overseas fulfillment warehouse plus a 25% restocking fee. Items must be unopened in original shrinkwrap. Store credit only.",
      paymentMethods: "Visa, Mastercard, Shopify Payments",
      url: "https://techvibestore.shop/products/ultrabreeze-cooler",
      canonicalUrl: "https://techvibestore.shop/products/ultrabreeze-cooler",
    },
  },
];
