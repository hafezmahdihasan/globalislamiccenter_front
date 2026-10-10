import { LIST_PAGE, ROWS_PER_PAGE } from "@/lib/students/report/constants";
import { COLORS as C } from "@/lib/students/report/theme";
import { FONT_STACK } from "@/lib/students/report/fonts";
import { document as htmlDocument, esc } from "@/lib/students/report/html";
import { formatDateTime } from "@/lib/utils/format";

/**
 * Student LIST report (HTML): 26in x 30in pages, exactly 20 students per page, table only.
 * The message field is never read here.
 *
 * Every measurement is fixed (no auto heights, fixed table layout, clamped
 * text) so a long name or address can never push a row onto another page.
 *
 * Vertical budget (px, page is 2880): margin 90 | hero 300 | table at 362
 * | header 84 | 20 rows x 110 = 2200 -> ends at 2646 | footer near the bottom.
 */
const MARGIN = 90;
const TABLE_WIDTH = LIST_PAGE.widthPx - MARGIN * 2; // 2316

const COLUMNS = [
  { key: "no", label: "#", width: 64, align: "center" },
  { key: "name", label: "Student name", width: 320 },
  { key: "age", label: "Age", width: 76, align: "center" },
  { key: "phone", label: "WhatsApp", width: 500 },
  { key: "email", label: "Email", width: 400 },
  { key: "consent", label: "Consent", width: 140, align: "center" },
  { key: "classLevel", label: "Class / level", width: 190 },
  { key: "ip", label: "IP address", width: 240 },
  { key: "address", label: "Address (city, country)", width: 380 },
  { key: "topic", label: "Study topic", width: 256 },
];

const widthSum = COLUMNS.reduce((sum, column) => sum + column.width, 0);
if (widthSum !== TABLE_WIDTH) {
  throw new Error(
    `Report list columns must add up to ${TABLE_WIDTH}px, got ${widthSum}px`,
  );
}

const dash = '<span class="na">&ndash;</span>';
const text = (value, lines = 1) =>
  value ? `<div class="clamp c${lines}">${esc(value)}</div>` : dash;

function cell(column, record, number) {
  switch (column.key) {
    case "no":
      return `<span class="num">${number}</span>`;
    case "name":
      return text(record.name, 2);
    case "age":
      return record.age === null
        ? dash
        : `<div class="age${record.isMinor ? " minor" : ""}">${record.age}</div>`;
    case "phone": {
      const who = record.isMinor
        ? `Guardian${record.contactName ? ` · ${record.contactName}` : ""}`
        : "Student";
      return `<div class="who clamp c1">${esc(who)}</div>${record.phone ? `<div class="mono clamp c1">${esc(record.phone)}</div>` : dash}`;
    }
    case "email":
      return text(record.email, 2);
    case "consent":
      return record.consent
        ? '<span class="pill yes">Yes</span>'
        : '<span class="pill no">No</span>';
    case "classLevel":
      return text(record.classLevel, 2);
    case "ip":
      return record.ip
        ? `<div class="mono clamp c2">${esc(record.ip)}</div>`
        : dash;
    case "address":
      return text(record.address, 2);
    case "topic":
      return text(record.topic, 2);
    default:
      return "";
  }
}

const colgroup = `<colgroup>${COLUMNS.map((c) => `<col style="width:${c.width}px">`).join("")}</colgroup>`;
const headRow = `<tr>${COLUMNS.map(
  (c) =>
    `<th class="${c.align === "center" ? "ctr" : ""}">${esc(c.label)}</th>`,
).join("")}</tr>`;

function pageHtml({
  title,
  subtitle,
  records,
  pageIndex,
  pageCount,
  total,
  startNumber,
  generatedAt,
}) {
  const rows = records
    .map((record, i) => {
      const cells = COLUMNS.map(
        (c) =>
          `<td class="${c.align === "center" ? "ctr" : ""}"><div class="in">${cell(c, record, startNumber + i)}</div></td>`,
      ).join("");
      return `<tr class="${i % 2 ? "alt" : ""}">${cells}</tr>`;
    })
    .join("");

  const first = startNumber;
  const last = startNumber + records.length - 1;

  return `<section class="sheet">
  <header class="hero">
    <div class="orn o1"></div><div class="orn o2"></div>
    <div class="brand">
      <div class="logo">GIC</div>
      <div>
        <div class="org">GIC — Global Islamic Center</div>
        <div class="doc">${esc(title)}</div>
        <div class="sub">${esc(subtitle)}</div>
      </div>
    </div>
    <div class="meta">
      <div class="big">${total}</div>
      <div class="lab">${total === 1 ? "student" : "students"} in this report</div>
      <div class="pg">Page ${pageIndex + 1} of ${pageCount}</div>
    </div>
  </header>
  <table class="tbl">${colgroup}<thead>${headRow}</thead><tbody>${rows}</tbody></table>
  <footer class="foot">
    <span>${records.length ? `Showing students ${first}–${last} of ${total}` : "No students"}</span>
    <span>Generated ${esc(generatedAt)}</span>
    <span>Confidential — for GIC administrators only</span>
  </footer>
</section>`;
}

const CSS = `
@media screen{html,body{background:#e9e4d4}body{zoom:.5}.sheet{margin:0 auto 24px;box-shadow:0 4px 30px rgba(0,0,0,.2)}}
@page{size:${LIST_PAGE.widthIn}in ${LIST_PAGE.heightIn}in;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${LIST_PAGE.widthPx}px;background:${C.ivory}}
body{font-family:${FONT_STACK};color:${C.charcoal};-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal;text-rendering:geometricPrecision}
.sheet{position:relative;width:${LIST_PAGE.widthPx}px;height:${LIST_PAGE.sheetHeightPx}px;overflow:hidden;padding:${MARGIN}px;background:${C.ivory};page-break-after:always;break-after:page}
.sheet:last-child{page-break-after:auto;break-after:auto}
.sheet::before{content:"";position:absolute;left:0;top:0;right:0;height:18px;background:linear-gradient(90deg,${C.brand700},${C.gold},${C.goldLight})}
.hero{position:relative;overflow:hidden;height:300px;border-radius:36px;padding:0 70px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(120deg,${C.brand950},${C.brand800} 60%,${C.brand700});color:#fff}
.orn{position:absolute;border:3px solid ${C.goldLight};opacity:.28}
.o1{width:300px;height:300px;right:300px;top:-60px;transform:rotate(45deg)}
.o2{width:300px;height:300px;right:300px;top:-60px;border-radius:50%}
.brand{position:relative;display:flex;align-items:center;gap:48px;min-width:0}
.logo{flex:none;width:150px;height:150px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:56px;font-weight:700;letter-spacing:2px;color:${C.brand900};background:linear-gradient(135deg,${C.goldLight},${C.gold});box-shadow:0 0 0 8px rgba(224,196,136,.25)}
.org{font-size:34px;color:${C.goldLight};letter-spacing:.5px}
.doc{margin-top:8px;font-size:76px;font-weight:700;line-height:1.1}
.sub{margin-top:10px;font-size:30px;color:${C.brand100}}
.meta{position:relative;text-align:right}
.big{font-size:130px;font-weight:700;line-height:1;color:${C.goldLight}}
.lab{margin-top:6px;font-size:30px;color:${C.brand100}}
.pg{display:inline-block;margin-top:14px;padding:6px 26px;border-radius:999px;font-size:28px;font-weight:700;background:rgba(224,196,136,.2);color:#fff}
.tbl{position:absolute;left:${MARGIN}px;top:362px;width:${TABLE_WIDTH}px;table-layout:fixed;border-collapse:separate;border-spacing:0;font-size:26px;line-height:1.25;background:#fff;border:2px solid ${C.line};border-radius:24px;overflow:hidden}
.tbl th{height:84px;padding:0 16px;text-align:left;font-size:25px;font-weight:700;letter-spacing:.3px;color:#fff;background:${C.brand800};border-right:1px solid ${C.brand700};white-space:nowrap;overflow:hidden}
.tbl th:last-child,.tbl td:last-child{border-right:0}
.tbl tr{height:110px}
.in{height:94px;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.ctr .in{align-items:center}
.in>*{max-width:100%}
.tbl td{height:110px;padding:8px 16px;vertical-align:middle;border-top:1px solid ${C.line};border-right:1px solid ${C.line};overflow:hidden;word-break:break-word;overflow-wrap:anywhere}
.tbl tr.alt td{background:${C.brand50}}
.ctr{text-align:center!important}
.clamp{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}
.c1{-webkit-line-clamp:1}.c2{-webkit-line-clamp:2}
.num{font-weight:700;color:${C.goldDark}}
.age{font-size:32px;font-weight:700;color:${C.brand800}}
.mono{font-size:26px;letter-spacing:.2px}
.who{font-size:19px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:${C.goldDark};margin-bottom:2px}
.na{color:#9aa6a0}
.age.minor{color:${C.goldDark}}
.pill{display:inline-block;min-width:76px;padding:4px 18px;border-radius:999px;font-size:24px;font-weight:700;text-align:center}
.pill.yes{background:${C.brand100};color:${C.brand800}}
.pill.no{background:#f6d9d9;color:${C.danger}}
.foot{position:absolute;left:${MARGIN}px;right:${MARGIN}px;bottom:70px;display:flex;justify-content:space-between;gap:40px;padding-top:22px;border-top:3px solid ${C.gold};font-size:26px;color:${C.muted}}
`;

/**
 * @param {object[]} records  output of toReportRecord(), newest first
 * @param {{ title: string, subtitle?: string, generatedAt?: Date }} meta
 * @returns {{ html: string, pageCount: number }}
 */
export function buildListHtml(
  records,
  { title, subtitle = "", generatedAt = new Date() },
) {
  const pageCount = Math.max(1, Math.ceil(records.length / ROWS_PER_PAGE));
  const stamp = formatDateTime(generatedAt);

  const pages = [];
  for (let index = 0; index < pageCount; index += 1) {
    pages.push(
      pageHtml({
        title,
        subtitle,
        records: records.slice(
          index * ROWS_PER_PAGE,
          (index + 1) * ROWS_PER_PAGE,
        ),
        pageIndex: index,
        pageCount,
        total: records.length,
        startNumber: index * ROWS_PER_PAGE + 1,
        generatedAt: stamp,
      }),
    );
  }

  return {
    pageCount,
    html: htmlDocument({
      title: `${title} — GIC`,
      css: CSS,
      body: pages.join(""),
    }),
  };
}
