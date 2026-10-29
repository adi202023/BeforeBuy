import { describe, it, expect, beforeEach } from "vitest";
import { SAMPLE_CASES } from "../lib/samples";
import { validateUrlInput, validateManualListing } from "../lib/validation";
import { runDeterministicAnalysis } from "../lib/analyzer/deterministic";
import {
  loadScanHistory,
  saveScanToHistory,
  deleteScanFromHistory,
  clearScanHistory,
} from "../lib/storage";

describe("Main User Flow: Single URL -> Extract -> Results -> Edit -> History", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    global.window = {
      localStorage: {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        },
      },
    } as any;
  });

  it("completes the one-link product check and editing workflow", () => {
    // 1. Shopper inputs a product URL
    const sample = SAMPLE_CASES[1]; // Rolex liquidation sample
    const urlValidation = validateUrlInput({ url: sample.displayUrl });
    expect(urlValidation.success).toBe(true);
    expect(urlValidation.url).toBe(sample.displayUrl);

    // 2. Server extracts and analyzes
    const analysis = runDeterministicAnalysis(sample.input, {
      isDemo: true,
      retrievalMethod: "url_fetch",
    });

    expect(analysis.riskLevel).toBe("HIGH");
    expect(analysis.riskScore).toBeGreaterThanOrEqual(60);
    expect(analysis.warnings.length).toBeGreaterThan(0);
    expect(analysis.input.title).toBe(sample.input.title);

    // 3. Shopper reviews results and clicks "Edit details"
    const editedInput = {
      ...analysis.input,
      returnPolicy: "Updated: 30 days full money back refund guarantee",
      paymentMethods: "Visa, Mastercard, Apple Pay",
    };

    const manualValidation = validateManualListing(editedInput);
    expect(manualValidation.success).toBe(true);
    expect(manualValidation.data).toBeDefined();

    // Re-analyzing with supplemented details lowers risk
    const reanalysis = runDeterministicAnalysis(manualValidation.data!, {
      retrievalMethod: "manual_paste",
    });
    expect(reanalysis.riskScore).toBeLessThan(analysis.riskScore);

    // 4. Save to client history
    const saved = saveScanToHistory(reanalysis);
    expect(saved.length).toBe(1);
    expect(loadScanHistory().length).toBe(1);

    // 5. Delete from history
    deleteScanFromHistory(reanalysis.id);
    expect(loadScanHistory().length).toBe(0);
  });
});
