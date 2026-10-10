import { LIST_PAGE, ROWS_PER_PAGE } from "./constants.js";
import { COLORS as C, COMMON_CSS } from "./theme.js";
import { esc, makeDocument } from "./html.js";
import { getEmbeddedFontCss } from "./fonts.js";
import { consentLabel, getAddress, getContactInfo, isMinor, textValue, truncateText } from "./text.js";

const MARGIN = 90;
const TABLE_WIDTH = LIST_PAGE.widthPx - MARGIN * 2;
const ROW_HEIGHT = 110;

// Every column is fixed-width; widths deliberately sum to the printable table width.
const COLUMNS = [
  { key: "number", label: "#", width: 64, align: "center" },
  { key: "name", label: "Student / guardian", width: 320 },
  { key: "age", label: "Age", width: 76, align: "center" },
  { key: "phone", label: "Contact WhatsApp", width: 250 },
  { key: "email", label: "Contact email", width: 400 },
  { key: "consent", label: "Consent", width: 140, align: "center" },
  { key: "classLevel", label: "Class / level", width: 190 },
  { key: "ipAddress", label: "IP address", width: 240 },
  { key: "address", label: "Address", width: 380 },
  { key: "studyTopic", label: "Study topic", width: 256 },
];

const totalWidth = COLUMNS.reduce((sum, column) => sum + column.width, 0);
if (totalWidth !== TABLE_WIDTH) {
  throw new Error(`PDF list columns must add up to ${TABLE_WIDTH}px; received ${totalWidth}px.`);
}

function printDate(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date) + " (Dhaka)";
}

function rowValues(record, number) {
  const minor = isMinor(record);
  const contact = getContactInfo(record);
  return {
    number: String(number),
    name: `<div class="student-name">${esc(truncateText(record?.studentName, 44))}</div>${minor ? `<div class="guardian-name">Guardian: ${esc(truncateText(record?.contactName, 38))}</div>` : ""}`,
    age: `<span class="age-pill ${minor ? "minor-age" : "adult-age"}">${esc(textValue(record?.age))}</span>`,
    // For minors these must be guardian fields only; never render student WhatsApp/email.
    phone: esc(truncateText(minor ? record?.guardianWhatsapp : record?.whatsapp, 31)),
    email: esc(truncateText(minor ? record?.guardianEmail : record?.email, 48)),
    consent: `<span class="consent ${contact.consent === "Yes" ? "yes" : "other"}">${esc(consentLabel(minor ? record?.guardianConsent : record?.consent))}</span>`,
    classLevel: esc(truncateText(record?.classLevel, 26)),
    ipAddress: esc(truncateText(record?.ipAddress, 42)),
    address: esc(truncateText(getAddress(record), 45)),
    studyTopic: esc(truncateText(record?.studyTopic, 28)),
    rowClass: minor ? "minor-row" : "adult-row",
  };
}

function cellMarkup(column, values) {
  const alignment = column.align ? ` align-${column.align}` : "";
  return `<td class="cell${alignment}" style="width:${column.width}px;max-width:${column.width}px">${values[column.key] ?? "—"}</td>`;
}

function oneSheet(rows, { kind, pageIndex, pageCount, totalRecords, generatedAt }) {
  const heading = kind === "new" ? "New Student Inquiries" : "All Student Inquiries";
  const firstNumber = pageIndex * ROWS_PER_PAGE;
  const rowMarkup = rows.map((record, index) => {
    const values = rowValues(record, firstNumber + index + 1);
    return `<tr class="${values.rowClass}" style="height:${ROW_HEIGHT}px">${COLUMNS.map((column) => cellMarkup(column, values)).join("")}</tr>`;
  }).join("");

  const header = COLUMNS.map((column) => `<th class="head-cell${column.align ? ` align-${column.align}` : ""}" style="width:${column.width}px;max-width:${column.width}px">${esc(column.label)}</th>`).join("");
  const emptyRow = `<tr style="height:${ROW_HEIGHT}px"><td colspan="${COLUMNS.length}" class="empty-cell">No student inquiries on this page.</td></tr>`;

  return `<section class="sheet">
    <header class="hero">
      <div class="eyebrow"><span class="eyebrow-dot"></span> GLOBAL ISLAMIC CENTER <span class="eyebrow-separator">/</span> ADMINISTRATIVE RECORDS</div>
      <div class="hero-row">
        <div>
          <h1>${heading}</h1>
          <p class="subtitle">Confidential student inquiry register · Contact details are age-appropriate</p>
        </div>
        <div class="brand-mark"><span>GIC</span><small>Quran · Knowledge · Character</small></div>
      </div>
      <div class="meta-strip">
        <div><span class="meta-label">TOTAL RECORDS</span><strong>${totalRecords.toLocaleString("en-US")}</strong></div>
        <div><span class="meta-label">PAGE</span><strong>${pageIndex + 1} <i>of</i> ${pageCount}</strong></div>
        <div><span class="meta-label">GENERATED</span><strong>${esc(generatedAt)}</strong></div>
      </div>
    </header>

    <main class="table-area">
      <table class="records-table">
        <colgroup>${COLUMNS.map((column) => `<col style="width:${column.width}px">`).join("")}</colgroup>
        <thead><tr style="height:78px">${header}</tr></thead>
        <tbody>${rowMarkup || emptyRow}</tbody>
      </table>
      <p class="privacy-note">Privacy note: students under 18 are represented with guardian contact details and guardian consent only. Message content is intentionally excluded from list exports.</p>
    </main>

    <footer class="page-footer">
      <span><b>GIC</b> · Global Islamic Center · Confidential administrative document</span>
      <span>Page ${pageIndex + 1} / ${pageCount}</span>
    </footer>
  </section>`;
}

export function renderStudentListHtml(records, { kind = "all", generatedAt = printDate(new Date()) } = {}) {
  if (!Array.isArray(records)) throw new TypeError("Student list PDF expects an array of records.");
  const pages = [];
  for (let index = 0; index < records.length; index += ROWS_PER_PAGE) {
    pages.push(records.slice(index, index + ROWS_PER_PAGE));
  }
  if (!pages.length) pages.push([]);

  const sheets = pages.map((rows, pageIndex) => oneSheet(rows, {
    kind,
    pageIndex,
    pageCount: pages.length,
    totalRecords: records.length,
    generatedAt,
  })).join("");

  const css = `${getEmbeddedFontCss()}
${COMMON_CSS}
@page { size: ${LIST_PAGE.widthIn}in ${LIST_PAGE.heightIn}in; margin: 0; }
html, body { width: ${LIST_PAGE.widthPx}px; margin: 0; padding: 0; background: #fff; }
.sheet { position: relative; width: ${LIST_PAGE.widthPx}px; height: ${LIST_PAGE.heightPx}px; overflow: hidden; padding: ${MARGIN}px; background: #fff; page-break-after: always; break-after: page; }
.sheet:last-child { page-break-after: auto; break-after: auto; }
.hero { height: 270px; }
.eyebrow { display:flex; align-items:center; gap:13px; color:${C.greenMid}; font-size:18px; font-weight:800; letter-spacing:3px; }
.eyebrow-dot { width:12px; height:12px; border-radius:50%; background:${C.gold}; display:inline-block; }
.eyebrow-separator { color:${C.gold}; }
.hero-row { display:flex; justify-content:space-between; align-items:flex-start; margin-top:22px; }
h1 { margin:0; color:${C.green}; font-size:56px; line-height:1.12; font-weight:850; letter-spacing:-1.2px; }
.subtitle { margin:18px 0 0; font-size:21px; color:${C.muted}; }
.brand-mark { display:flex; flex-direction:column; align-items:flex-end; padding-left:24px; }
.brand-mark span { color:${C.green}; font-size:52px; font-weight:900; letter-spacing:2px; line-height:1; }
.brand-mark small { margin-top:12px; color:${C.gold}; font-size:13px; letter-spacing:1px; }
.meta-strip { display:flex; align-items:center; gap:0; margin-top:22px; height:72px; padding:0 24px; background:${C.green}; border-radius:14px; color:white; }
.meta-strip > div { display:flex; flex-direction:column; gap:4px; flex:1; }
.meta-label { font-size:12px; color:#c7dbce; font-weight:800; letter-spacing:1.8px; }
.meta-strip strong { font-size:21px; font-weight:750; }
.meta-strip i { font-size:15px; color:#c7dbce; font-style:normal; font-weight:500; }
.table-area { margin-top:0; }
.records-table { width:${TABLE_WIDTH}px; table-layout:fixed; border-collapse:separate; border-spacing:0; border:1px solid ${C.border}; border-radius:12px; overflow:hidden; }
.records-table thead { display:table-header-group; }
.head-cell { height:78px; padding:14px 12px; background:${C.green}; color:#fff; text-align:left; font-size:16px; line-height:1.2; font-weight:800; vertical-align:middle; border-right:1px solid rgba(255,255,255,.12); overflow:hidden; }
.head-cell:last-child { border-right:0; }
.cell { height:${ROW_HEIGHT}px; padding:12px; vertical-align:middle; text-align:left; border-right:1px solid #e7eee9; border-bottom:1px solid #e7eee9; color:${C.charcoal}; font-size:15px; line-height:1.35; overflow:hidden; overflow-wrap:anywhere; word-break:break-word; }
.cell:last-child { border-right:0; }
.align-center { text-align:center; }
.adult-row:nth-child(odd) { background:#fff; }
.adult-row:nth-child(even) { background:#f5f8f5; }
.minor-row { background:${C.minor}; }
.minor-row .cell:first-child { border-left:6px solid ${C.minorLine}; }
.student-name { color:${C.green}; font-size:17px; font-weight:800; line-height:1.35; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.guardian-name { margin-top:6px; color:#805d26; font-size:13px; line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.age-pill { display:inline-block; min-width:44px; padding:8px 10px; border-radius:99px; font-size:16px; font-weight:800; }
.minor-age { background:#f7dfad; color:#6b4915; }
.adult-age { background:${C.greenSoft}; color:${C.green}; }
.consent { display:inline-block; border-radius:999px; padding:7px 9px; font-size:13px; font-weight:800; }
.consent.yes { background:#dcefe2; color:#17573d; }
.consent.other { background:#eef0ee; color:#5c665f; }
.empty-cell { height:180px; text-align:center; color:${C.muted}; font-size:26px; }
.privacy-note { margin:18px 2px 0; color:${C.muted}; font-size:14px; line-height:1.5; }
.page-footer { position:absolute; left:${MARGIN}px; right:${MARGIN}px; bottom:42px; display:flex; justify-content:space-between; align-items:center; padding-top:20px; border-top:2px solid ${C.border}; color:${C.muted}; font-size:15px; }
.page-footer b { color:${C.green}; letter-spacing:1px; }
`;

  return makeDocument({
    title: kind === "new" ? "GIC New Student Inquiries" : "GIC All Student Inquiries",
    css,
    body: sheets,
  });
}
