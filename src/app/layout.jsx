import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bn",
  display: "swap",
  preload: true,
});

const siteUrl = new URL(siteConfig.url);
const ogImage = "/gicog.png";
const logoPath = "/GIC.svg";

const title = "GIC — Global Islamic Center | অনলাইনে কুরআন ও ইসলামী শিক্ষা";

const description =
  siteConfig.description ||
  "Global Islamic Center (GIC) — শিশু থেকে প্রাপ্তবয়স্কদের জন্য বাংলা ও ইংরেজি মাধ্যমে অনলাইন কুরআন ও ইসলামী শিক্ষা। শুদ্ধ কুরআন তিলাওয়াত, তাজবিদ, মাখরাজ ও ইসলামী আদব-আখলাক শিক্ষার একটি অনলাইন শিক্ষাকেন্দ্র।";

const socialProfiles = [siteConfig.facebookUrl].filter(Boolean);

export const metadata = {
  metadataBase: siteUrl,

  title: {
    default: title,
    template: "%s | GIC — Global Islamic Center",
  },

  description,

  applicationName: "Global Islamic Center",

  generator: "Next.js",

  category: "education",

  classification: "Online Quran and Islamic Education",

  authors: [
    {
      name: "Global Islamic Center",
      url: siteConfig.url,
    },
  ],

  creator: "Global Islamic Center",

  publisher: "Global Islamic Center",

  keywords: [
    "Global Islamic Center",
    "GIC",
    "online Quran education",
    "online Islamic education",
    "Quran learning",
    "Quran teacher online",
    "Tajweed",
    "Tajweed online",
    "Makhraj",
    "Quran recitation",
    "Islamic studies online",
    "Bangla Quran education",
    "English Quran education",
    "অনলাইন কুরআন শিক্ষা",
    "অনলাইন ইসলামিক শিক্ষা",
    "কুরআন শিক্ষা",
    "তাজবিদ শিক্ষা",
    "মাখরাজ",
    "কুরআন তিলাওয়াত",
    "ইসলামী শিক্ষা",
    "কায়দা",
    "আমপারা",
  ],

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      {
        url: logoPath,
        type: "image/svg+xml",
      },
    ],
    shortcut: logoPath,
  },

  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: "/",
    siteName: "Global Islamic Center",
    title: "GIC — Global Islamic Center",
    description,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "GIC — Global Islamic Center | Online Quran & Islamic Education",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "GIC — Global Islamic Center",
    description,
    images: [
      {
        url: ogImage,
        alt: "GIC — Global Islamic Center | Online Quran & Islamic Education",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,

    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  referrer: "strict-origin-when-cross-origin",

  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },

  ...(siteConfig.googleSiteVerification
    ? {
        verification: {
          google: siteConfig.googleSiteVerification,
        },
      }
    : {}),
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${siteUrl.origin}/#organization`,
  name: "Global Islamic Center",
  alternateName: "GIC",
  url: siteUrl.origin,
  logo: `${siteUrl.origin}${logoPath}`,
  image: `${siteUrl.origin}${ogImage}`,
  description,
  email: siteConfig.email || undefined,
  sameAs: socialProfiles,
  areaServed: {
    "@type": "Place",
    name: "Worldwide",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl.origin}/#website`,
  url: siteUrl.origin,
  name: "Global Islamic Center",
  alternateName: "GIC",
  description,
  publisher: {
    "@id": `${siteUrl.origin}/#organization`,
  },
  inLanguage: ["bn-BD", "en"],
};

const webpageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${siteUrl.origin}/#webpage`,
  url: siteUrl.origin,
  name: title,
  description,
  isPartOf: {
    "@id": `${siteUrl.origin}/#website`,
  },
  about: {
    "@id": `${siteUrl.origin}/#organization`,
  },
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: `${siteUrl.origin}${ogImage}`,
    width: 1200,
    height: 630,
  },
  inLanguage: ["bn-BD", "en"],
};

export default function RootLayout({ children }) {
  const structuredData = [organizationSchema, websiteSchema, webpageSchema];

  return (
    <html lang="bn-BD" className={notoBengali.variable}>
      <head>
        <meta name="theme-color" content="#0d3526" />
        <meta name="color-scheme" content="light" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>

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
