import { z } from "zod";
import { ListingInput } from "./types";

const MAX_TITLE_LENGTH = 300;
const MAX_SELLER_LENGTH = 150;
const MAX_DESC_LENGTH = 15000;
const MAX_RETURN_POLICY_LENGTH = 4000;
const MAX_PAYMENT_METHODS_LENGTH = 2000;
const MAX_URL_LENGTH = 2048;

export function sanitizeInputText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\0/g, "")
    .replace(/[\u0001-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export const urlInputSchema = z.object({
  url: z
    .string({ required_error: "Please enter a product URL" })
    .transform(sanitizeInputText)
    .refine((val) => val.length > 0, {
      message: "Please paste a product page link to check",
    })
    .refine((val) => val.length <= MAX_URL_LENGTH, {
      message: `URL cannot exceed ${MAX_URL_LENGTH} characters`,
    })
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message:
          "Please enter a valid website address starting with http:// or https://",
      }
    ),
});

export const manualListingSchema = z.object({
  title: z
    .string({ required_error: "Product title or description is required" })
    .transform(sanitizeInputText)
    .refine((val) => val.length >= 2, {
      message: "Product title must be at least 2 characters",
    })
    .refine((val) => val.length <= MAX_TITLE_LENGTH, {
      message: `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
    }),
  seller: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeInputText(val) : "Unspecified Seller"))
    .refine((val) => val.length <= MAX_SELLER_LENGTH, {
      message: `Seller name must not exceed ${MAX_SELLER_LENGTH} characters`,
    }),
  price: z
    .number()
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || val >= 0, {
      message: "Price must be greater than zero",
    })
    .refine((val) => val === null || val === undefined || val <= 100_000_000, {
      message: "Price exceeds maximum threshold",
    }),
  currency: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeInputText(val).toUpperCase() : "USD"))
    .refine((val) => !val || /^[A-Z]{3}$/.test(val), {
      message: "Currency must be a 3-letter code (e.g. USD, EUR, GBP)",
    }),
  description: z
    .string({ required_error: "Product description or listing text is required" })
    .transform(sanitizeInputText)
    .refine((val) => val.length >= 5, {
      message: "Please provide product description or listing text",
    })
    .refine((val) => val.length <= MAX_DESC_LENGTH, {
      message: `Description must not exceed ${MAX_DESC_LENGTH} characters`,
    }),
  returnPolicy: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeInputText(val) : "")),
  paymentMethods: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeInputText(val) : "")),
  url: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeInputText(val) : ""))
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message: "URL must be a valid HTTP or HTTPS address",
      }
    ),
  image: z.string().nullable().optional(),
});

export function validateUrlInput(raw: unknown): {
  success: boolean;
  url?: string;
  error?: string;
} {
  const result = urlInputSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid URL",
    };
  }
  return { success: true, url: result.data.url };
}

export function validateManualListing(raw: unknown): {
  success: boolean;
  data?: ListingInput;
  errors?: Record<string, string>;
} {
  const result = manualListingSchema.safeParse(raw);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join(".") || "form";
      if (!errors[field]) errors[field] = issue.message;
    }
    return { success: false, errors };
  }
  return {
    success: true,
    data: {
      title: result.data.title,
      seller: result.data.seller || "Unspecified Seller",
      price: result.data.price ?? null,
      currency: result.data.currency || "USD",
      description: result.data.description,
      returnPolicy: result.data.returnPolicy,
      paymentMethods: result.data.paymentMethods,
      url: result.data.url,
      image: result.data.image,
    },
  };
}

export const validateListingInput = validateManualListing;
