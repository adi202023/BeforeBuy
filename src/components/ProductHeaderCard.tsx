import React from "react";
import { ListingInput } from "@/lib/types";
import { ExternalLink, Edit3, Image as ImageIcon, Store, Star, Tag, ShoppingBag } from "lucide-react";

interface ProductHeaderCardProps {
  input: ListingInput;
  isDemo?: boolean;
  onEditDetails: () => void;
}

export const ProductHeaderCard: React.FC<ProductHeaderCardProps> = ({
  input,
  isDemo,
  onEditDetails,
}) => {
  const displayUrl = input.canonicalUrl || input.url;

  return (
    <div className="p-5 sm:p-6 bg-white border border-sand-200 rounded-2xl shadow-card transition-all">
      <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
        {/* Product Image */}
        <div className="w-full sm:w-44 h-48 sm:h-44 rounded-xl bg-sand-50 border border-sand-200/80 overflow-hidden flex items-center justify-center shrink-0">
          {input.image ? (
            <img
              src={input.image}
              alt={input.title}
              className="w-full h-full object-contain p-2.5 transition-transform duration-200 hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-charcoal-400 gap-1.5 p-3 text-center">
              <ImageIcon size={26} className="text-charcoal-400" />
              <span className="text-[11px] leading-tight font-medium">Image not found</span>
            </div>
          )}
        </div>

        {/* Product Metadata Details */}
        <div className="flex-1 min-w-0 w-full space-y-2.5">
          {/* Top Bar: Retailer & Edit Button */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sand-100 text-charcoal-800 border border-sand-200">
                <Store size={13} className="text-charcoal-600" />
                <span>{input.retailer || "Retailer Store"}</span>
              </span>

              {isDemo && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sand-100 text-charcoal-600 border border-sand-200">
                  Demo Sample
                </span>
              )}
            </div>

            <button
              onClick={onEditDetails}
              className="inline-flex items-center gap-1.5 text-xs text-charcoal-700 hover:text-charcoal-900 font-medium px-2.5 py-1 rounded-lg border border-sand-200 bg-sand-50 hover:bg-sand-100 transition"
              title="Edit extracted product information"
            >
              <Edit3 size={12} />
              <span>Edit details</span>
            </button>
          </div>

          {/* Full Product Title */}
          <h2 className="text-lg sm:text-xl font-semibold text-charcoal-900 leading-snug">
            {input.title || "Untitled Product"}
          </h2>

          {/* Pricing & MRP Discount */}
          <div className="flex flex-wrap items-baseline gap-2.5">
            {input.price !== null && input.price !== undefined ? (
              <span className="text-2xl sm:text-3xl font-bold text-charcoal-900 font-mono tracking-tight">
                {input.currency === "INR" ? "₹" : input.currency + " "}
                {input.price.toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="text-sm italic text-charcoal-500">
                Price not available in extracted data
              </span>
            )}

            {input.mrp && input.price && input.mrp > input.price && (
              <div className="flex items-center gap-1.5 text-xs text-charcoal-500 font-mono">
                <span className="line-through">
                  M.R.P.: {input.currency === "INR" ? "₹" : input.currency}{" "}
                  {input.mrp.toLocaleString("en-IN")}
                </span>
                <span className="text-coral-700 font-semibold bg-coral-50 px-1.5 py-0.2 rounded border border-coral-200/60">
                  -{Math.round(((input.mrp - input.price) / input.mrp) * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Rating, Reviews & Purchase Count */}
          {(input.rating || input.boughtPastMonth) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-600 pt-0.5">
              {input.rating && (
                <span className="inline-flex items-center gap-1 font-semibold text-charcoal-800">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>{input.rating}</span>
                  {input.reviewCount !== null && input.reviewCount !== undefined && (
                    <span className="text-charcoal-500 font-normal">
                      ({input.reviewCount.toLocaleString()} ratings)
                    </span>
                  )}
                </span>
              )}

              {input.boughtPastMonth && (
                <span className="inline-flex items-center gap-1 text-charcoal-600 bg-sand-100/70 px-2 py-0.5 rounded text-[11px]">
                  <ShoppingBag size={12} className="text-charcoal-500" />
                  <span>{input.boughtPastMonth}</span>
                </span>
              )}
            </div>
          )}

          {/* Seller / Brand Info Strip */}
          <div className="pt-2 text-xs text-charcoal-600 flex flex-wrap items-center gap-x-4 gap-y-1">
            {input.brand && (
              <span>
                <strong className="text-charcoal-800">Brand:</strong> {input.brand}
              </span>
            )}

            {input.brandStore && input.brandStore !== input.brand && (
              <span>
                <strong className="text-charcoal-800">Storefront:</strong>{" "}
                {input.brandStore}
              </span>
            )}

            {input.seller ? (
              <span>
                <strong className="text-charcoal-800">Sold by:</strong> {input.seller}
              </span>
            ) : (
              <span className="text-charcoal-400">
                <strong className="text-charcoal-600">Merchant seller:</strong> Not specified on page
              </span>
            )}
          </div>

          {/* Canonical Link */}
          {displayUrl && (
            <div className="pt-2.5 border-t border-sand-100 flex items-center justify-between text-xs text-charcoal-500">
              <span className="truncate max-w-sm sm:max-w-md font-mono text-[11px]">
                {displayUrl.replace(/^https?:\/\//, "")}
              </span>
              <a
                href={displayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-charcoal-900 shrink-0 text-charcoal-700 font-medium ml-2"
              >
                <span>Open store page</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
