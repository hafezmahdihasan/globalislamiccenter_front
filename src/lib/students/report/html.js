/** Small HTML helpers shared by both templates. */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char]);

/** No scripts, no network: the only things allowed are inline CSS and data: URIs. */
export const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:";

export function document({ title, css, body }) {
  return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>${esc(title)}</title>
<style>${css}</style>
</head>
<body>${body}</body>
</html>`;
}
