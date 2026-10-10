/** Plain-text normalization for PDF templates. Never insert untrusted input as HTML. */
export function textValue(value, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).replace(/\u0000/g, "").replace(/\r\n?/g, "\n").trim();
  return text || fallback;
}

/** Unicode-aware truncation that won't split a surrogate pair. */
export function truncateText(value, limit = 120, suffix = "…") {
  const text = textValue(value, "");
  const chars = Array.from(text);
  if (chars.length <= limit) return text;
  return `${chars.slice(0, Math.max(0, limit - Array.from(suffix).length)).join("")}${suffix}`;
}

export function consentLabel(value) {
  if (value === true || value === "true" || value === 1) return "Yes";
  if (value === false || value === "false" || value === 0) return "No";
  return "Not recorded";
}

export function isMinor(record) {
  const age = Number(record?.age);
  return Number.isFinite(age) && age < 18;
}

export function getContactInfo(record) {
  if (isMinor(record)) {
    return {
      kind: "guardian",
      label: "Parent / guardian contact",
      name: textValue(record?.contactName, "Not provided"),
      whatsapp: textValue(record?.guardianWhatsapp, "Not provided"),
      email: textValue(record?.guardianEmail, "Not provided"),
      consent: consentLabel(record?.guardianConsent),
    };
  }

  return {
    kind: "student",
    label: "Student contact",
    name: textValue(record?.studentName, "Not provided"),
    whatsapp: textValue(record?.whatsapp, "Not provided"),
    email: textValue(record?.email, "Not provided"),
    consent: consentLabel(record?.consent),
  };
}

export function getAddress(record) {
  const parts = [record?.address, record?.city, record?.country]
    .map((part) => textValue(part, ""))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "Not provided";
}
