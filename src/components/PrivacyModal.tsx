import React from "react";
import { X, Check, ShieldCheck } from "lucide-react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm animate-fade-up"
    >
      <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-white border border-sand-200 shadow-modal text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-sand-100 transition"
          aria-label="Close privacy notice"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-sand-100 text-charcoal-800">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 id="privacy-modal-title" className="text-base font-bold text-charcoal-900">
              Privacy & Data Notice
            </h2>
            <p className="text-xs text-charcoal-500">
              How BeforeBuy handles submitted links and listings
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-charcoal-600">
          <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80 flex items-start gap-2.5">
            <Check size={16} className="text-mint-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-charcoal-900 block mb-0.5">No Account or Card Required</strong>
              <span>You do not need to register, provide an email, or enter payment details to check products.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80 flex items-start gap-2.5">
            <Check size={16} className="text-mint-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-charcoal-900 block mb-0.5">Public HTML Reading Only</strong>
              <span>BeforeBuy retrieves only the publicly accessible HTML page. We never access private user accounts or bypass login walls.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80 flex items-start gap-2.5">
            <Check size={16} className="text-mint-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-charcoal-900 block mb-0.5">Local Browser Storage</strong>
              <span>Your recent check history is saved strictly on your own device in localStorage. You can clear it at any time.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80 flex items-start gap-2.5">
            <Check size={16} className="text-mint-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-charcoal-900 block mb-0.5">Zero Tracking Cookies</strong>
              <span>We do not set third-party tracking pixels or monetize your browsing history.</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white font-semibold text-xs transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
