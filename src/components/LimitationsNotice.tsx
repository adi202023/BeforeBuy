import React from "react";
import { HelpCircle, AlertCircle } from "lucide-react";

interface LimitationsNoticeProps {
  unverifiedAspects: string[];
  missingFields: string[];
  disclaimer: string;
}

export const LimitationsNotice: React.FC<LimitationsNoticeProps> = ({
  unverifiedAspects,
  missingFields,
  disclaimer,
}) => {
  return (
    <div className="p-5 sm:p-6 bg-sand-100/60 border border-sand-200 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle size={16} className="text-charcoal-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-charcoal-900">
          What BeforeBuy Could Not Verify
        </h3>
      </div>

      <p className="text-xs text-charcoal-600 mb-3 leading-relaxed">
        BeforeBuy assesses only publicly readable text and metadata extracted from the provided page. We do not make unsupported claims or verify inventory.
      </p>

      {missingFields && missingFields.length > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-white border border-sand-200">
          <span className="text-xs font-semibold text-charcoal-800 block mb-1">
            Data points not found on this page:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {missingFields.map((field, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[11px] bg-sand-100 text-charcoal-600 border border-sand-200"
              >
                Missing {field.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-1.5 mb-4">
        {unverifiedAspects.map((aspect, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-xs text-charcoal-600 leading-normal"
          >
            <span className="text-charcoal-400 mt-0.5">•</span>
            <span>{aspect}</span>
          </li>
        ))}
      </ul>

      <div className="pt-3 border-t border-sand-200 flex items-start gap-2 text-xs text-charcoal-500 italic">
        <AlertCircle size={14} className="shrink-0 mt-0.5 text-charcoal-400" />
        <p>{disclaimer}</p>
      </div>
    </div>
  );
};
