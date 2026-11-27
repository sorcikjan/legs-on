import type { Metadata, Viewport } from "next";
import { Anton, Poppins } from "next/font/google";
import { PODCAST_RSS_URL, SITE_DESCRIPTION, SITE_NAME, SITE_PUBLIC, SITE_URL } from "@/lib/site";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LEGS:ON – cyklistický podcast Petra a Honzy",
    template: "%s | LEGS:ON",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  ...(!SITE_PUBLIC && { robots: { index: false, follow: false } }),
  // Canonical si nastavuje každá stránka sama.
  ...(PODCAST_RSS_URL && {
    alternates: {
      types: { "application/rss+xml": [{ url: PODCAST_RSS_URL, title: "LEGS:ON podcast" }] },
    },
  }),
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: SITE_NAME,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#EEE7DA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${anton.variable} ${poppins.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
