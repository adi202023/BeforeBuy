import React from "react";
import { SAMPLE_CASES } from "@/lib/samples";
import { SampleCase } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { ArrowUpRight } from "lucide-react";

interface SampleSelectorProps {
  onSelectSample: (sample: SampleCase) => void;
  selectedId?: string;
}

export const SampleSelector: React.FC<SampleSelectorProps> = ({
  onSelectSample,
  selectedId,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
          Or test with a sample listing:
        </span>
        <span className="text-xs text-charcoal-500">Works offline</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SAMPLE_CASES.map((sample) => {
          const isSelected = selectedId === sample.id;
          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                isSelected
                  ? "bg-sand-100 border-charcoal-800"
                  : "bg-white border-sand-200 hover:bg-sand-50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <RiskBadge level={sample.expectedRisk} size="sm" />
                  <ArrowUpRight
                    size={14}
                    className="text-charcoal-400 group-hover:text-charcoal-700 transition-colors"
                  />
                </div>
                <h4 className="text-sm font-semibold text-charcoal-900 line-clamp-1">
                  {sample.name}
                </h4>
                <p className="text-xs text-charcoal-500 mt-1 line-clamp-2 leading-relaxed">
                  {sample.tagline}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between text-[11px] font-mono text-charcoal-500">
                <span>
                  {sample.input.currency === "INR" ? "₹" : sample.input.currency + " "}
                  {sample.input.price !== null && sample.input.price !== undefined
                    ? sample.input.price.toLocaleString("en-IN")
                    : "N/A"}
                </span>
                <span className="text-charcoal-700 group-hover:underline font-sans">
                  Inspect link →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
