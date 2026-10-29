"use client";

import React, { useState } from "react";
import { Finding } from "@/lib/types";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [showEvidence, setShowEvidence] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  const severityConfigs: Record<
    string,
    {
      border: string;
      bg: string;
      badge: string;
      badgeText: string;
      icon: React.ElementType;
      iconColor: string;
    }
  > = {
    critical: {
      border: "border-coral-300",
      bg: "bg-coral-50/20",
      badge: "bg-coral-100 text-coral-900 border-coral-200",
      badgeText: "High Warning",
      icon: AlertOctagon,
      iconColor: "text-coral-700",
    },
    warning: {
      border: "border-coral-200",
      bg: "bg-white",
      badge: "bg-coral-50 text-coral-800 border-coral-200",
      badgeText: "Warning",
      icon: AlertOctagon,
      iconColor: "text-coral-700",
    },
    caution: {
      border: "border-amber-200",
      bg: "bg-white",
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      badgeText: "Cautionary Signal",
      icon: AlertTriangle,
      iconColor: "text-amber-700",
    },
    neutral: {
      border: "border-sand-200",
      bg: "bg-white",
      badge: "bg-sand-100 text-charcoal-700 border-sand-200",
      badgeText: "Observed Detail",
      icon: Info,
      iconColor: "text-charcoal-500",
    },
    positive: {
      border: "border-mint-200",
      bg: "bg-white",
      badge: "bg-mint-50 text-mint-800 border-mint-200",
      badgeText: "Documented Policy",
      icon: CheckCircle2,
      iconColor: "text-mint-700",
    },
  };

  const config = severityConfigs[finding.severity] || severityConfigs.neutral;
  const Icon = config.icon;

  return (
    <article
      className={`p-4 sm:p-5 rounded-xl border ${config.border} ${config.bg} shadow-card transition-all duration-150`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badge}`}
        >
          <Icon size={13} className={config.iconColor} aria-hidden="true" />
          <span>{config.badgeText}</span>
        </span>

        <div className="flex items-center gap-2 text-[11px] text-charcoal-500">
          {finding.location && (
            <span className="bg-sand-100 px-2 py-0.5 rounded text-charcoal-600 font-medium">
              {finding.location}
            </span>
          )}
          <span className="capitalize">
            {finding.category.replace("_", " ")}
          </span>
        </div>
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-charcoal-900 mb-1 leading-snug">
        {finding.title}
      </h3>

      <p className="text-xs sm:text-sm text-charcoal-600 mb-3 leading-relaxed">
        {finding.description}
      </p>

      {/* Accordion Toggle for Evidence & Page Details */}
      {finding.evidence && (
        <div className="mt-2 pt-2 border-t border-sand-100">
          <button
            onClick={() => setShowEvidence((prev) => !prev)}
            aria-expanded={showEvidence}
            className="flex items-center justify-between w-full text-left text-[11px] font-semibold text-charcoal-500 hover:text-charcoal-800 py-1 transition"
          >
            <span>Page detail that triggered this:</span>
            {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence initial={false}>
            {showEvidence && (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={prefersReducedMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-2.5 bg-sand-50 rounded-lg border border-sand-200/60 font-mono text-xs text-charcoal-700 whitespace-pre-wrap break-words">
                  {finding.evidence}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </article>
  );
};
