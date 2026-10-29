import React, { useState } from "react";
import { ListingInput } from "@/lib/types";
import { X, ArrowRight, FileText } from "lucide-react";

interface ManualPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitManual: (input: ListingInput) => Promise<void>;
}

export const ManualPasteModal: React.FC<ManualPasteModalProps> = ({
  isOpen,
  onClose,
  onSubmitManual,
}) => {
  const [title, setTitle] = useState("");
  const [seller, setSeller] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !description) return;

    setIsSubmitting(true);
    try {
      await onSubmitManual({
        title: title || "Product Listing",
        seller: seller || "Unspecified Seller",
        price,
        currency,
        description: description || title,
        returnPolicy,
        paymentMethods,
        url,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm animate-fade-up"
    >
      <div className="relative w-full max-w-xl p-6 sm:p-7 rounded-2xl bg-white border border-sand-200 shadow-modal max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-sand-100 mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-charcoal-700" />
            <h2 className="text-base font-bold text-charcoal-900">
              Check Pasted Listing Text
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-sand-100 transition"
            aria-label="Close manual paste modal"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-charcoal-500 mb-4 leading-relaxed">
          Useful if a merchant site is behind a login wall, blocks automated access, or if you copied text from a private message.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Product Title <span className="text-coral-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vintage Leather Jacket"
              className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Store or Seller
              </label>
              <input
                type="text"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="e.g. Apex Vintage"
                className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Price (Optional)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={price ?? ""}
                onChange={(e) =>
                  setPrice(e.target.value === "" ? null : parseFloat(e.target.value))
                }
                placeholder="49.99"
                className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Listing text / Product description <span className="text-coral-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste item description, conditions, specifications, or urgency claims..."
              className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Return policy (if stated)
            </label>
            <input
              type="text"
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              placeholder="e.g. 14 days returns, or All sales final"
              className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Accepted payment methods (if stated)
            </label>
            <input
              type="text"
              value={paymentMethods}
              onChange={(e) => setPaymentMethods(e.target.value)}
              placeholder="e.g. Credit cards, Wire, Zelle, Bitcoin"
              className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
            />
          </div>

          <div className="pt-3 border-t border-sand-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-charcoal-600 hover:text-charcoal-900 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (!title && !description)}
              className="px-5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Check Listing</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

