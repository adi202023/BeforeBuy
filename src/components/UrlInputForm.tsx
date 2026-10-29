"use client";

import React, { useState } from "react";
import { SAMPLE_CASES } from "@/lib/samples";
import { SampleCase } from "@/lib/types";
import { Search, ArrowRight, ShieldCheck, HelpCircle, FileText } from "lucide-react";

interface UrlInputFormProps {
  onSubmitUrl: (url: string) => Promise<void>;
  onSelectSample: (sample: SampleCase) => void;
  onOpenManualPaste: () => void;
  isLoading: boolean;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({
  onSubmitUrl,
  onSelectSample,
  onOpenManualPaste,
  isLoading,
}) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please paste a product link to check");
      return;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setError("Address must begin with http:// or https://");
        return;
      }
    } catch {
      setError("Please enter a valid website address (e.g. https://store.com/item)");
      return;
    }

    setError(null);
    await onSubmitUrl(trimmed);
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-left">
      {/* The Single Prominent URL Input */}
      <form onSubmit={handleSubmit} noValidate className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2 bg-white border border-sand-300 rounded-2xl shadow-elevated focus-within:border-charcoal-800 focus-within:ring-2 focus-within:ring-charcoal-800/10 transition-all duration-150">
          <div className="flex items-center gap-2.5 pl-3 flex-1 min-w-0">
            <Search size={18} className="text-charcoal-400 shrink-0" aria-hidden="true" />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste a product page link (https://...)"
              className="w-full py-2 bg-transparent text-charcoal-900 placeholder:text-charcoal-400 text-sm sm:text-base focus:outline-none"
              aria-label="Product page link"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="px-6 py-3 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Checking...</span>
            ) : (
              <>
                <span>Check this product</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-coral-700 font-medium pl-2">
            {error}
          </p>
        )}
      </form>

      {/* Privacy & Accuracy Note */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-charcoal-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-mint-700" />
          <span>No account or card details required. Only public page details are read.</span>
        </div>

        <button
          type="button"
          onClick={onOpenManualPaste}
          className="text-charcoal-600 hover:text-charcoal-900 font-medium hover:underline inline-flex items-center gap-1"
        >
          <FileText size={12} />
          <span>Or paste listing text</span>
        </button>
      </div>

      {/* Small sample links to try the experience */}
      <div className="mt-6 pt-5 border-t border-sand-200/80">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
            Try a sample listing:
          </span>
          <span className="text-[11px] text-charcoal-400">Pre-extracted demos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_CASES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setUrl(sample.displayUrl);
                onSelectSample(sample);
              }}
              className="p-2.5 rounded-xl border border-sand-200 bg-white hover:bg-sand-50 text-left transition flex flex-col justify-between group shadow-card"
            >
              <div>
                <span className="text-xs font-semibold text-charcoal-900 group-hover:text-charcoal-700 line-clamp-1">
                  {sample.name}
                </span>
                <span className="text-[11px] text-charcoal-500 line-clamp-1 mt-0.5">
                  {sample.tagline}
                </span>
              </div>
              <span className="text-[11px] text-charcoal-400 group-hover:text-charcoal-700 font-mono mt-2 block">
                Test sample →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

