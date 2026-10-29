"use client";

import React from "react";
import { AnalysisResult } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { X, Trash2, Clock, ArrowRight, ShieldCheck } from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisResult[];
  onSelectScan: (scan: AnalysisResult) => void;
  onDeleteScan: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectScan,
  onDeleteScan,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-charcoal-900/30 backdrop-blur-sm animate-fade-up"
    >
      <div className="relative w-full max-w-md h-full bg-sand-50 border-l border-sand-200 shadow-modal flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-sand-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-charcoal-700" aria-hidden="true" />
            <h2 id="history-drawer-title" className="text-sm font-bold text-charcoal-900">
              Recent Product Checks ({history.length})
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-sand-100 transition"
            aria-label="Close history drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {history.length === 0 ? (
            <div className="py-16 text-center text-charcoal-400 text-xs space-y-1.5">
              <ShieldCheck size={28} className="mx-auto text-charcoal-400 mb-2" />
              <p className="font-semibold text-charcoal-700">No recent checks</p>
              <p className="max-w-xs mx-auto">
                Any products you check will be stored privately in your browser’s localStorage.
              </p>
            </div>
          ) : (
            history.map((scan) => (
              <div
                key={scan.id}
                className="p-3.5 rounded-xl bg-white border border-sand-200 shadow-card flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <RiskBadge level={scan.riskLevel} size="sm" />
                    <span className="text-[11px] font-mono text-charcoal-400">
                      {new Date(scan.timestamp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-charcoal-900 line-clamp-1">
                    {scan.input.title}
                  </h3>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-charcoal-500">
                    <span className="truncate max-w-[150px]">
                      {scan.input.seller}
                    </span>
                    {scan.input.price !== null && scan.input.price !== undefined ? (
                      <span className="font-mono font-medium text-charcoal-800">
                        {scan.input.currency} {scan.input.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-charcoal-400 italic">No price</span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-sand-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelectScan(scan);
                      onClose();
                    }}
                    className="text-xs font-semibold text-charcoal-800 hover:text-charcoal-950 flex items-center gap-1"
                  >
                    View Report <ArrowRight size={11} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScan(scan.id);
                    }}
                    className="p-1 rounded text-charcoal-400 hover:text-coral-700 transition"
                    title="Delete this check"
                    aria-label={`Delete record for ${scan.input.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {history.length > 0 && (
          <div className="p-4 border-t border-sand-200 bg-white flex items-center justify-between">
            <span className="text-xs text-charcoal-500">Stored in browser</span>
            <button
              onClick={onClearAll}
              className="text-xs text-coral-700 hover:text-coral-900 font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg border border-coral-200 bg-coral-50 hover:bg-coral-100 transition"
            >
              <Trash2 size={12} /> Clear all history
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
