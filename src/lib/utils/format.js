const dhakaFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  dateStyle: "medium",
  timeStyle: "short",
});

/** Human-readable timestamp for admin messages (Asia/Dhaka). */
export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${dhakaFormatter.format(date)} (Dhaka)`;
}
