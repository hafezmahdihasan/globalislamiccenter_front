import { siteConfig } from "@/config/site";

/**
 * Structured data built only from facts present on the site and in config.
 * No accreditation, ratings, addresses or counts are claimed.
 */
export default function JsonLd() {
  const sameAs = [siteConfig.facebookUrl].filter(Boolean);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["EducationalOrganization", "Organization"],
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        alternateName: "GIC",
        url: siteConfig.url,
        description: siteConfig.description,
        ...(siteConfig.email ? { email: siteConfig.email } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        inLanguage: ["bn", "en"],
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  };

  // Static, first-party JSON only (no user content). "<" is escaped so the
  // payload can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
