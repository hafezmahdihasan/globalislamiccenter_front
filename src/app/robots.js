import { siteConfig } from "@/config/site";

export default function robots() {
  const baseUrl = new URL(siteConfig.url);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
        ],
      },
    ],

    sitemap: `${baseUrl.origin}/sitemap.xml`,

    host: baseUrl.origin,
  };
}