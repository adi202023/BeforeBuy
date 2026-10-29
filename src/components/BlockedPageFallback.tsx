import React, { useState } from "react";
import { ListingInput } from "@/lib/types";
import { AlertCircle, FileText, ArrowRight } from "lucide-react";

interface BlockedPageFallbackProps {
  attemptedUrl: string;
  errorMessage: string;
  onAnalyzeManual: (input: ListingInput) => Promise<void>;
  onCancel: () => void;
}

export const BlockedPageFallback: React.FC<BlockedPageFallbackProps> = ({
  attemptedUrl,
  errorMessage,
  onAnalyzeManual,
  onCancel,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !description) return;

    setIsSubmitting(true);
    try {
      await onAnalyzeManual({
        title: title || "Product Listing",
        seller: "Store at " + new URL(attemptedUrl).hostname,
        price: null,
        currency: "USD",
        description: description || title,
        returnPolicy,
        paymentMethods,
        url: attemptedUrl,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 bg-white border border-sand-200 rounded-2xl shadow-card animate-fade-up">
      {/* Alert Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 mb-6">
        <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Could not retrieve this product page automatically
          </h3>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            {errorMessage}
          </p>
          <p className="text-xs text-amber-700 mt-2 font-mono break-all">
            Target: {attemptedUrl}
          </p>
        </div>
      </div>

      <div className="mb-5">
        <h4 className="text-base font-semibold text-charcoal-900 flex items-center gap-2">
          <FileText size={18} className="text-charcoal-700" />
          Paste the listing text instead
        </h4>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Copy and paste the product description and return terms from your browser so BeforeBuy can assess them for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
            Product Title <span className="text-coral-600">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Wireless Noise Canceling Headphones"
            className="w-full px-3.5 py-2.5 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
            Listing text or product description <span className="text-coral-600">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste description, specifications, or promotional text from the page..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Return policy (if stated)
            </label>
            <input
              type="text"
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              placeholder="e.g. 30-day money back, or no returns"
              className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Payment options (if stated)
            </label>
            <input
              type="text"
              value={paymentMethods}
              onChange={(e) => setPaymentMethods(e.target.value)}
              placeholder="e.g. Credit cards, Wire, Zelle, Crypto"
              className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-sand-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-charcoal-500 hover:text-charcoal-800 transition"
          >
            ← Try a different link
          </button>

          <button
            type="submit"
            disabled={isSubmitting || (!title && !description)}
            className="px-5 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>Analyze Pasted Listing</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};

