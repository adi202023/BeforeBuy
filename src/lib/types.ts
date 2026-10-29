export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type FindingType = "warning" | "observation" | "unverified";

export type FindingSeverity = "critical" | "warning" | "caution" | "neutral" | "positive";

export type FindingCategory =
  | "payment"
  | "return_policy"
  | "seller"
  | "pricing"
  | "claims"
  | "urgency"
  | "security"
  | "transparency"
  | "marketplace";

export interface Finding {
  id: string;
  type: FindingType; // warning vs observation vs unverified
  severity: FindingSeverity;
  category: FindingCategory;
  title: string;
  description: string;
  evidence: string; // The exact text or page detail and where it came from
  location?: string; // e.g. "Page body", "Buy box", "Metadata"
  source: "deterministic" | "ai_augmented";
}

export interface ExtractedFieldMetadata<T> {
  value: T;
  source: string; // e.g. "amazon_html_price", "json_ld", "open_graph", "url_domain"
  confidence: "high" | "medium" | "low";
  raw?: string;
}

export interface ListingInput {
  title: string;
  retailer?: string; // e.g. "Amazon India", "Flipkart", "Walmart"
  seller: string | null; // Transaction seller if identified on page
  brand?: string | null; // e.g. "ASUS"
  brandStore?: string | null; // e.g. "Visit the ASUS Store"
  price: number | null; // Current selling price
  mrp?: number | null; // Original MRP / list price if available
  currency: string;
  description: string;
  returnPolicy?: string | null;
  paymentMethods?: string | null;
  url?: string;
  canonicalUrl?: string;
  image?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  boughtPastMonth?: string | null;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  input: ListingInput;
  riskScore: number; // 0 - 100 based strictly on evidence-backed warnings
  riskLevel: RiskLevel;
  headline: string;
  summary: string;
  warnings: Finding[]; // Specific warnings backed by page evidence
  observations: Finding[]; // Neutral verified observations
  thingsToCheck: string[]; // Actionable next steps before payment
  unverifiedAspects: string[]; // Clearly separated unverified information
  missingFields: string[]; // Data not found on page
  engine: "deterministic" | "hybrid";
  disclaimer: string;
  isDemo?: boolean;
  retrievalMethod: "url_fetch" | "manual_paste" | "demo_sample";
  pageRetrievalError?: string | null;
}

export interface SampleCase {
  id: string;
  name: string;
  displayUrl: string;
  tagline: string;
  expectedRisk: RiskLevel;
  input: ListingInput;
  scenarioNotes: string;
}
