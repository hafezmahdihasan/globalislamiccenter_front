import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Bengali + Latin web fonts, embedded as data URIs so the PDF never depends
 * on fonts installed on the server (serverless images have almost none).
 * Source: the `@fontsource/noto-sans-bengali` package (OFL licence).
 * If the package is missing we return "" and CSS falls back to system fonts.
 */
const WEIGHTS = [400, 700];
const SUBSETS = [
  { name: "bengali", range: "U+0951-0952,U+0964-0965,U+0980-09FE,U+1CD0,U+1CD2,U+1CD5-1CD6,U+1CD8,U+1CE1,U+1CEA,U+1CED,U+1CF2,U+1CF5-1CF7,U+200C-200D,U+25CC,U+20B9" },
  { name: "latin", range: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" },
];

let cache;

async function findFontsDir() {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  try {
    const pkg = require.resolve("@fontsource/noto-sans-bengali/package.json");
    return path.join(path.dirname(pkg), "files");
  } catch {
    return null;
  }
}

export async function getFontCss() {
  if (cache !== undefined) return cache;

  const dir = await findFontsDir();
  const faces = [];

  if (dir) {
    for (const weight of WEIGHTS) {
      for (const subset of SUBSETS) {
        const file = path.join(dir, `noto-sans-bengali-${subset.name}-${weight}-normal.woff2`);
        try {
          const data = await readFile(file);
          faces.push(
            `@font-face{font-family:"GICSans";font-style:normal;font-weight:${weight};` +
              `src:url(data:font/woff2;base64,${data.toString("base64")}) format("woff2");` +
              `unicode-range:${subset.range};}`,
          );
        } catch {
          // This subset/weight is missing: system fonts cover it.
        }
      }
    }
  }

  cache = faces.join("\n");
  return cache;
}

/** Embedded font first; common system Bengali/Latin fonts as a safety net. */
export const FONT_STACK =
  '"GICSans","Noto Sans Bengali","Noto Sans","FreeSans","Segoe UI",Arial,sans-serif';
