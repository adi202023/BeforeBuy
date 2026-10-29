"use client";

import React, { useState } from "react";
import { AnalysisResult, ListingInput } from "@/lib/types";
import { ProductHeaderCard } from "./ProductHeaderCard";
import { RiskBadge } from "./RiskBadge";
import { ScoreGauge } from "./ScoreGauge";
import { FindingCard } from "./FindingCard";
import { NextSteps } from "./NextSteps";
import { LimitationsNotice } from "./LimitationsNotice";
import { EditDetailsModal } from "./EditDetailsModal";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Check,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface ScanResultsProps {
  result: AnalysisResult;
  onNewScan: () => void;
  onReanalyzeWithUpdatedDetails: (updatedInput: ListingInput) => Promise<void>;
}

export const ScanResults: React.FC<ScanResultsProps> = ({
  result,
  onNewScan,
  onReanalyzeWithUpdatedDetails,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleShare = async () => {
    const text = `BeforeBuy Check: ${result.input.title}\nStatus: ${result.riskLevel} (${result.riskScore}/100)\n${result.summary}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const hasWarnings = result.warnings && result.warnings.length > 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-sand-200">
        <button
          onClick={onNewScan}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-700 hover:text-charcoal-900 transition"
        >
          <ArrowLeft size={14} />
          <span>Check another product</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1 text-xs text-charcoal-600 hover:text-charcoal-900 font-medium px-2.5 py-1 rounded-lg border border-sand-200 bg-white hover:bg-sand-50 transition"
        >
          {copied ? (
            <>
              <Check size={12} className="text-mint-700" />
              <span className="text-mint-800">Copied</span>
            </>
          ) : (
            <>
              <Share2 size={12} />
              <span>Share summary</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Prominent Product Header */}
      <ProductHeaderCard
        input={result.input}
        isDemo={result.isDemo}
        onEditDetails={() => setIsEditOpen(true)}
      />

      {/* 2. Overall Assessment Summary */}
      <div className="p-5 sm:p-6 bg-white border border-sand-200 rounded-2xl shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-1 flex justify-center">
            <ScoreGauge score={result.riskScore} level={result.riskLevel} />
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level={result.riskLevel} size="md" />
              <span className="text-xs text-charcoal-500 font-mono">
                {result.retrievalMethod === "url_fetch"
                  ? "Verified page retrieval"
                  : result.retrievalMethod === "demo_sample"
                  ? "Demonstration sample"
                  : "Manual text review"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-serif font-bold text-charcoal-900 leading-tight">
              {result.headline}
            </h1>

            <p className="text-sm text-charcoal-600 leading-relaxed">
              {result.summary}
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECTION 1: WHAT WE FOUND */}
      <section aria-labelledby="findings-heading" className="space-y-3.5">
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <h2 id="findings-heading" className="text-base font-bold text-charcoal-900">
              What We Found
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sand-100 text-charcoal-700">
              {result.warnings.length + result.observations.length} signals
            </span>
          </div>
        </div>

        {/* Warning cards (if any) */}
        {hasWarnings ? (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-coral-800 uppercase tracking-wide">
              <AlertTriangle size={13} />
              <span>Evidence-backed warnings ({result.warnings.length})</span>
            </div>
            {result.warnings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-mint-50/70 border border-mint-200 text-xs sm:text-sm text-mint-900 flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-mint-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">
                No specific warning signs were detected in the available listing content.
              </strong>
              <span className="text-xs text-mint-800 leading-relaxed">
                The listing does not exhibit common red flags like wire/crypto demands, fake countdown timers, or restrictive &apos;all sales final&apos; clauses.
              </span>
            </div>
          </div>
        )}

        {/* Observations list */}
        {result.observations && result.observations.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-semibold text-charcoal-700 uppercase tracking-wide block">
              Verified page observations ({result.observations.length})
            </span>
            <div className="space-y-2">
              {result.observations.map((obs) => (
                <FindingCard key={obs.id} finding={obs} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4. SECTION 2: THINGS TO CHECK */}
      <section aria-labelledby="things-to-check-heading">
        <NextSteps steps={result.thingsToCheck} />
      </section>

      {/* 5. SECTION 3: COULDN'T VERIFY */}
      <section aria-labelledby="unverified-heading">
        <LimitationsNotice
          unverifiedAspects={result.unverifiedAspects}
          missingFields={result.missingFields}
          disclaimer={result.disclaimer}
        />
      </section>

      {/* Edit Extracted Details Modal */}
      <EditDetailsModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialInput={result.input}
        onSaveAndReanalyze={onReanalyzeWithUpdatedDetails}
      />
    </motion.div>
  );
};
