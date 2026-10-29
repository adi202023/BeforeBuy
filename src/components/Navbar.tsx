"use client";

import React from "react";
import { ShieldCheck, History, Lock, HelpCircle } from "lucide-react";

interface NavbarProps {
  onOpenHistory: () => void;
  onOpenPrivacy: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onOpenPrivacy,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-sand-200 bg-sand-50/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between py-3">
        {/* Brand logo & title */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-charcoal-900 text-sand-50 flex items-center justify-center font-bold shadow-sm">
            <svg
              className="w-4 h-4 text-sand-50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold text-charcoal-900 tracking-tight group-hover:text-charcoal-700 transition">
              BeforeBuy
            </span>
          </div>
        </a>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-charcoal-600 hover:text-charcoal-900 hover:bg-sand-100 transition"
          >
            <Lock size={13} className="text-charcoal-500" />
            <span>Privacy note</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-charcoal-800 bg-white hover:bg-sand-100 border border-sand-200 shadow-card transition"
            aria-label={`Open recent checks (${historyCount} saved)`}
          >
            <History size={13} className="text-charcoal-600" />
            <span>Recent checks</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-charcoal-900 text-white">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
