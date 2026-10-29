"use client";

import React from "react";
import { RiskLevel } from "@/lib/types";
import { motion, useReducedMotion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  level: RiskLevel;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, level }) => {
  const prefersReducedMotion = useReducedMotion();
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorConfig = {
    LOW: {
      stroke: "#059669",
      text: "text-mint-800",
      badge: "bg-mint-50 text-mint-800 border-mint-200",
      track: "#e2e8f0",
      label: "Lower-risk profile",
    },
    MEDIUM: {
      stroke: "#d97706",
      text: "text-amber-800",
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      track: "#fef3c7",
      label: "Needs verification",
    },
    HIGH: {
      stroke: "#e11d48",
      text: "text-coral-800",
      badge: "bg-coral-50 text-coral-800 border-coral-200",
      track: "#ffe4e6",
      label: "High caution advised",
    },
  }[level];

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white border border-sand-200 rounded-2xl shadow-card text-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 112 112">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="#f1ede5"
            strokeWidth="7"
            fill="transparent"
          />
          <motion.circle
            cx="56"
            cy="56"
            r={radius}
            stroke={colorConfig.stroke}
            strokeWidth="7"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: prefersReducedMotion ? strokeDashoffset : strokeDashoffset }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.9, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold tracking-tight ${colorConfig.text}`}>
            {score}
          </span>
          <span className="text-[11px] text-charcoal-500 font-medium">/ 100</span>
        </div>
      </div>

      <div className="mt-3">
        <span className="text-xs font-semibold text-charcoal-800 block">
          {colorConfig.label}
        </span>
        <span className="text-[11px] text-charcoal-500 block mt-0.5">
          Estimated risk score
        </span>
      </div>
    </div>
  );
};
