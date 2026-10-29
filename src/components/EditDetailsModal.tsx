import React, { useState } from "react";
import { ListingInput } from "@/lib/types";
import { X, Check } from "lucide-react";

interface EditDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInput: ListingInput;
  onSaveAndReanalyze: (updatedInput: ListingInput) => Promise<void>;
}

export const EditDetailsModal: React.FC<EditDetailsModalProps> = ({
  isOpen,
  onClose,
  initialInput,
  onSaveAndReanalyze,
}) => {
  const [formData, setFormData] = useState<ListingInput>({ ...initialInput });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "mrp"
          ? value === ""
            ? null
            : parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveAndReanalyze(formData);
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
          <div>
            <h2 className="text-lg font-bold text-charcoal-900">
              Edit Product Details
            </h2>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Supplement or correct information extracted from the listing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-sand-100 transition"
            aria-label="Close edit modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Product Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Storefront / Retailer
              </label>
              <input
                type="text"
                name="retailer"
                value={formData.retailer || ""}
                onChange={handleChange}
                placeholder="e.g. Amazon India"
                className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Transaction Merchant (Sold By)
              </label>
              <input
                type="text"
                name="seller"
                value={formData.seller || ""}
                onChange={handleChange}
                placeholder="e.g. Appario Retail"
                className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Selling Price ({formData.currency || "INR"})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="price"
                value={formData.price ?? ""}
                onChange={handleChange}
                placeholder="52990"
                className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Original M.R.P. (Optional)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="mrp"
                value={formData.mrp ?? ""}
                onChange={handleChange}
                placeholder="84990"
                className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Product Description / Specs
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Return / Replacement Policy
            </label>
            <input
              type="text"
              name="returnPolicy"
              value={formData.returnPolicy || ""}
              onChange={handleChange}
              placeholder="e.g. 10 days Service Centre Replacement"
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={14} />
              <span>Update & Re-assess</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
