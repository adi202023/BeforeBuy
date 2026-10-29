import React from "react";
import { CheckCircle2 } from "lucide-react";

interface NextStepsProps {
  steps: string[];
}

export const NextSteps: React.FC<NextStepsProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="p-5 sm:p-6 bg-white border border-sand-200 rounded-2xl shadow-card">
      <h3 className="text-base font-semibold text-charcoal-900 mb-1">
        Suggested Next Steps Before You Pay
      </h3>
      <p className="text-xs text-charcoal-500 mb-4">
        Pragmatic precautions to protect your payment and verify the listing.
      </p>

      <ul className="space-y-2.5">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 text-sm text-charcoal-700 leading-relaxed"
          >
            <CheckCircle2
              size={16}
              className="text-mint-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
