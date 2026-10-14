import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "আদ-দাওয়া ফুড শপ | ঘরোয়া খাবারের প্রি-অর্ডার",
  description:
    "ব্যাচেলর, শিক্ষার্থী ও চাকরিজীবীদের জন্য সহজ খাবার সাবস্ক্রিপশন ব্যবস্থা",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="bg-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
