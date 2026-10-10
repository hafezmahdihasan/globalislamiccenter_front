import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Anchor resolution at the project root so this also works if Next.js bundles
// the module into a server chunk rather than preserving its original file URL.
const require = createRequire(path.join(process.cwd(), "package.json"));
let embeddedCss;

/**
 * Self-embeds the Noto Sans Bengali variable WOFF2 subsets supplied by Fontsource.
 * This avoids relying on OS fonts, Google Fonts network access, or public URLs in Chromium.
 */
export function getEmbeddedFontCss() {
  if (embeddedCss) return embeddedCss;

  let cssPath;
  try {
    cssPath = require.resolve("@fontsource-variable/noto-sans-bengali/wght.css");
  } catch (error) {
    // Test-only fallback: it uses an installed OS font and must never be enabled in production.
    if (process.env.PDF_USE_SYSTEM_FONT_FALLBACK === "1" && process.env.NODE_ENV !== "production") {
      embeddedCss = `@font-face { font-family: "Noto Sans Bengali Variable"; src: local("FreeSerif"); font-weight: 100 900; font-style: normal; }`;
      return embeddedCss;
    }
    throw new Error("Missing @fontsource-variable/noto-sans-bengali. Install it so PDF Bengali text renders consistently.", { cause: error });
  }
  const sourceCss = readFileSync(cssPath, "utf8");
  const cssDir = path.dirname(cssPath);
  let replacedCount = 0;

  embeddedCss = sourceCss.replace(/url\((['"]?)([^)'\"]+\.woff2)\1\)/g, (match, _quote, relativePath) => {
    const fontPath = path.resolve(cssDir, relativePath);
    const base64 = readFileSync(fontPath).toString("base64");
    replacedCount += 1;
    return `url("data:font/woff2;base64,${base64}")`;
  });

  if (!replacedCount) {
    throw new Error("Could not embed Noto Sans Bengali WOFF2 subsets. Check @fontsource-variable/noto-sans-bengali installation.");
  }

  return embeddedCss;
}
