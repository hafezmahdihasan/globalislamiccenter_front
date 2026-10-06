/**
 * Public site configuration. Safe for both server and client code: it only
 * reads NEXT_PUBLIC_* variables. Empty values simply hide the related UI.
 */

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const siteConfig = {
  name: "GIC — Global Islamic Center",
  shortName: "GIC",
  tagline: "কুরআনের আলোয় জীবন গঠন",
  description:
    "GIC — Global Islamic Center: অনলাইনে শুদ্ধ কুরআন তিলাওয়াত, তাজবীদ, মাখরাজ ও ইসলামী আদব শেখার কেন্দ্র। Online Quran and Islamic education in Bangla and English.",
  url: siteUrl,
  whatsappUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || "",
  facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
  email: process.env.NEXT_PUBLIC_GIC_EMAIL || "",
};
