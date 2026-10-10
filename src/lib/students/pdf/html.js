const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** The document is self-contained: no scripts or remote requests are permitted. */
export function makeDocument({ title, css, body, language = "bn-BD" }) {
  return `<!doctype html>
<html lang="${esc(language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:;">
<title>${esc(title)}</title>
<style>${css}</style>
</head>
<body>${body}</body>
</html>`;
}
