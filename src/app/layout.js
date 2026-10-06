import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bn",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "GIC — Global Islamic Center | অনলাইনে কুরআন ও ইসলামী শিক্ষা",
    template: "%s | GIC — Global Islamic Center",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  keywords: [
    "Quran online",
    "Tajweed",
    "Islamic education",
    "অনলাইন কুরআন শিক্ষা",
    "তাজবীদ",
    "কায়দা",
    "আমপারা",
    "GIC",
    "Global Islamic Center",
  ],
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: "/",
    siteName: siteConfig.name,
    title: "GIC — Global Islamic Center",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "GIC — Global Islamic Center",
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d3526",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={notoBengali.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-ivory"
        >
          মূল অংশে যান
        </a>
        {children}
      </body>
    </html>
  );
}
