export const COLORS = Object.freeze({
  green: "#0d3526",
  greenDeep: "#08241a",
  greenMid: "#17573d",
  greenSoft: "#eaf3ed",
  ivory: "#faf6ec",
  gold: "#b8924a",
  goldLight: "#e0c488",
  charcoal: "#1c2421",
  muted: "#64736b",
  border: "#dbe5dd",
  white: "#ffffff",
  minor: "#fff6e5",
  minorLine: "#e7bd70",
});

export const COMMON_CSS = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: "Noto Sans Bengali Variable", "Noto Sans Bengali", "FreeSerif", sans-serif; color: ${COLORS.charcoal}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;
