"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ScanResults } from "@/components/ScanResults";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { BlockedPageFallback } from "@/components/BlockedPageFallback";
import { ManualPasteModal } from "@/components/ManualPasteModal";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { PrivacyModal } from "@/components/PrivacyModal";
import { AnalysisResult, ListingInput, SampleCase } from "@/lib/types";
import {
  loadScanHistory,
  saveScanToHistory,
  deleteScanFromHistory,
  clearScanHistory,
} from "@/lib/storage";
import { AlertCircle } from "lucide-react";

export default function HomePage() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Blocked page state
  const [blockedPageState, setBlockedPageState] = useState<{
    url: string;
    errorMessage: string;
  } | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isManualPasteOpen, setIsManualPasteOpen] = useState(false);

  // Load history on mount
  useEffect(() => {
    const loaded = loadScanHistory();
    setHistory(loaded);
  }, []);

  // Primary Flow: Single URL submission
  const handleSubmitUrl = async (url: string) => {
    setIsLoading(true);
    setApiError(null);
    setBlockedPageState(null);
    setCurrentResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      // Check if page retrieval failed or was blocked by anti-bot
      if (data.retrievalFailed) {
        setBlockedPageState({
          url: data.url || url,
          errorMessage:
            data.error ||
            "The merchant’s site could not be retrieved by the server.",
        });
        return;
      }

      // Successful analysis result
      const result: AnalysisResult = data;
      setCurrentResult(result);

      // Save to client localStorage history
      const updated = saveScanToHistory(result);
      setHistory(updated);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      console.error("Analysis error:", err);
      const msg =
        err instanceof Error ? err.message : "Network error. Please try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample listing flow
  const handleSelectSample = async (sample: SampleCase) => {
    setIsLoading(true);
    setApiError(null);
    setBlockedPageState(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId: sample.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load sample demonstration.");
      }

      const result: AnalysisResult = await res.json();
      setCurrentResult(result);

      const updated = saveScanToHistory(result);
      setHistory(updated);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error loading sample.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual fallback flow
  const handleAnalyzeManualInput = async (input: ListingInput) => {
    setIsLoading(true);
    setApiError(null);
    setBlockedPageState(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualInput: input }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to analyze provided listing.");
      }

      const result: AnalysisResult = await res.json();
      setCurrentResult(result);

      const updated = saveScanToHistory(result);
      setHistory(updated);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error analyzing listing.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-analyze when user updates extracted details in modal
  const handleReanalyzeWithUpdatedDetails = async (
    updatedInput: ListingInput
  ) => {
    await handleAnalyzeManualInput(updatedInput);
  };

  const handleDeleteScan = (id: string) => {
    const updated = deleteScanFromHistory(id);
    setHistory(updated);
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
  };

  const handleClearAllHistory = () => {
    clearScanHistory();
    setHistory([]);
    setCurrentResult(null);
  };

  const handleSelectHistoricalScan = (scan: AnalysisResult) => {
    setBlockedPageState(null);
    setCurrentResult(scan);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-sand-50 text-charcoal-900 flex flex-col justify-between">
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        historyCount={history.length}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Error Notification Alert */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-coral-50 border border-coral-200 text-coral-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-card animate-fade-up">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-coral-700 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="font-medium underline hover:text-coral-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* State 1: Loading state with progress indicator & skeleton */}
        {isLoading && <LoadingSkeleton />}

        {/* State 2: Blocked Page / Fallback State */}
        {!isLoading && blockedPageState && (
          <BlockedPageFallback
            attemptedUrl={blockedPageState.url}
            errorMessage={blockedPageState.errorMessage}
            onAnalyzeManual={handleAnalyzeManualInput}
            onCancel={() => setBlockedPageState(null)}
          />
        )}

        {/* State 3: Analysis Results View */}
        {!isLoading && !blockedPageState && currentResult && (
          <ScanResults
            result={currentResult}
            onNewScan={() => setCurrentResult(null)}
            onReanalyzeWithUpdatedDetails={handleReanalyzeWithUpdatedDetails}
          />
        )}

        {/* State 4: Default Landing Page with One-Input Form */}
        {!isLoading && !blockedPageState && !currentResult && (
          <Hero
            onSubmitUrl={handleSubmitUrl}
            onSelectSample={handleSelectSample}
            onOpenManualPaste={() => setIsManualPasteOpen(true)}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-sand-200/80 bg-white py-6 px-4 text-center text-xs text-charcoal-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium text-charcoal-700">
            <span>BeforeBuy</span>
            <span className="text-charcoal-400">•</span>
            <span className="text-charcoal-500 font-normal">
              Pre-purchase listing risk assessment
            </span>
          </div>

          <div className="flex items-center gap-4 text-charcoal-500">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-charcoal-900 transition"
            >
              Privacy Notice
            </button>
            <span>•</span>
            <span>Guidance only, not a legal or delivery guarantee</span>
          </div>
        </div>
      </footer>

      {/* Drawers and Modals */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectScan={handleSelectHistoricalScan}
        onDeleteScan={handleDeleteScan}
        onClearAll={handleClearAllHistory}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <ManualPasteModal
        isOpen={isManualPasteOpen}
        onClose={() => setIsManualPasteOpen(false)}
        onSubmitManual={handleAnalyzeManualInput}
      />
    </div>
  );
}
