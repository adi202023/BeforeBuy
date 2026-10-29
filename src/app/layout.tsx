import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeforeBuy — Check a Product Before Buying",
  description:
    "Paste a product link to check return policies, payment risks, and hidden red flags before you pay. Honest, evidence-based guidance for online shoppers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23111827'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/></svg>"
        />
        <meta name="theme-color" content="#faf8f5" />
      </head>
      <body className="bg-sand-50 text-charcoal-900 antialiased selection:bg-charcoal-900 selection:text-sand-50">
        {children}
      </body>
    </html>
  );
}
