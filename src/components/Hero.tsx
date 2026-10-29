import React from "react";
import { UrlInputForm } from "./UrlInputForm";
import { SampleCase } from "@/lib/types";
import { ShieldCheck, RotateCcw, CreditCard, Sparkles } from "lucide-react";

interface HeroProps {
  onSubmitUrl: (url: string) => Promise<void>;
  onSelectSample: (sample: SampleCase) => void;
  onOpenManualPaste: () => void;
  isLoading: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onSubmitUrl,
  onSelectSample,
  onOpenManualPaste,
  isLoading,
}) => {
  return (
    <section className="text-center py-8 sm:py-12 max-w-3xl mx-auto px-4">
      {/* Editorial Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-charcoal-900 tracking-tight leading-[1.18] mb-4">
        Check a product before you pay.
      </h1>

      <p className="text-base sm:text-lg text-charcoal-600 max-w-xl mx-auto leading-relaxed mb-8">
        Paste any product page link. BeforeBuy inspects public page details for hidden return clauses, wire payment traps, and warning signs—grounded strictly in evidence.
      </p>

      {/* Prominent URL Input Form */}
      <UrlInputForm
        onSubmitUrl={onSubmitUrl}
        onSelectSample={onSelectSample}
        onOpenManualPaste={onOpenManualPaste}
        isLoading={isLoading}
      />

      {/* Concise explanation of what BeforeBuy checks */}
      <div className="mt-14 pt-8 border-t border-sand-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-charcoal-900 font-semibold text-sm">
            <RotateCcw size={16} className="text-charcoal-700" />
            <span>Return & Refund Terms</span>
          </div>
          <p className="text-xs text-charcoal-500 leading-relaxed">
            Checks for strict "all sales final" disclaimers, heavy restocking deductions, or overseas return shipping mandates.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5 text-charcoal-900 font-semibold text-sm">
            <CreditCard size={16} className="text-charcoal-700" />
            <span>Payment Safeguards</span>
          </div>
          <p className="text-xs text-charcoal-500 leading-relaxed">
            Flags requests for irreversible wire transfers, cryptocurrency, gift cards, or P2P Friends & Family transfers.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5 text-charcoal-900 font-semibold text-sm">
            <ShieldCheck size={16} className="text-charcoal-700" />
            <span>Storefront Signals</span>
          </div>
          <p className="text-xs text-charcoal-500 leading-relaxed">
            Identifies brand squatting, artificial countdown pressure, and impossible discounts on luxury merchandise.
          </p>
        </div>
      </div>
    </section>
  );
};
