"use client";

import React, { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const STAGES = [
  "Opening product page...",
  "Reading listing details...",
  "Checking evidence...",
];

export const LoadingSkeleton: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 750);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      className="w-full max-w-3xl mx-auto space-y-5"
    >
      {/* Informative Progress Header */}
      <div className="p-5 bg-white border border-sand-200 rounded-2xl shadow-card text-center">
        <div className="w-10 h-10 rounded-full bg-sand-100 flex items-center justify-center mx-auto mb-3 text-charcoal-700">
          <Globe size={20} className="animate-spin" style={{ animationDuration: "2.5s" }} />
        </div>

        <h3 className="text-base font-semibold text-charcoal-900 mb-1">
          Inspecting Product Page
        </h3>

        <div className="min-h-[22px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={stageIndex}
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="text-xs text-charcoal-600 font-medium"
            >
              {STAGES[stageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Subtle step progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {STAGES.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stageIndex
                  ? "w-6 bg-charcoal-900"
                  : i < stageIndex
                  ? "w-2.5 bg-charcoal-400"
                  : "w-2.5 bg-sand-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Skeleton placeholders */}
      <div className="p-6 bg-white border border-sand-200 rounded-2xl shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-36 h-36 rounded-xl bg-sand-100 animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2.5 pt-1 w-full">
            <div className="h-4 bg-sand-100 animate-shimmer rounded w-1/4" />
            <div className="h-5 bg-sand-100 animate-shimmer rounded w-4/5" />
            <div className="h-6 bg-sand-100 animate-shimmer rounded w-1/3" />
            <div className="h-4 bg-sand-100 animate-shimmer rounded w-1/2" />
          </div>
        </div>

        <div className="pt-4 border-t border-sand-100 space-y-3">
          <div className="h-14 bg-sand-100 animate-shimmer rounded-xl" />
          <div className="h-14 bg-sand-100 animate-shimmer rounded-xl" />
        </div>
      </div>
    </motion.div>
  );
};
