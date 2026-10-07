import { siteConfig } from "@/config/site";

export default function sitemap() {
  const baseUrl = new URL(siteConfig.url);

  return [
    {
      url: `${baseUrl.origin}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
