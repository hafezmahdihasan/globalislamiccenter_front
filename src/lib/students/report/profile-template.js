import { PROFILE_PAGE } from "@/lib/students/report/constants";
import { COLORS as C } from "@/lib/students/report/theme";
import { FONT_STACK } from "@/lib/students/report/fonts";
import { document as htmlDocument, esc } from "@/lib/students/report/html";
import { formatDateTime } from "@/lib/utils/format";

/**
 * One-page A4 information sheet for a single new student.
 * All blocks have fixed or capped heights, so long input is clipped inside its
 * own box and can never spill onto a second page.
 */
const dash = '<span class="na">Not provided</span>';
const val = (value) => (value ? esc(value) : dash);

function field(label, value, { wide = false, mono = false } = {}) {
  return `<div class="f${wide ? " wide" : ""}"><div class="k">${esc(label)}</div><div class="v${mono ? " mono" : ""}">${val(value)}</div></div>`;
}

function messageSize(length) {
  if (length > 1200) return 12;
  if (length > 600) return 13.5;
  return 15;
}

export function buildProfileHtml(record, { generatedAt = new Date() } = {}) {
  const guardian = record.isMinor;
  const submitted = record.createdAt ? formatDateTime(record.createdAt) : formatDateTime(generatedAt);

  const contactFields = guardian
    ? [
        field("Guardian / contact name", record.contactName),
        field("Guardian WhatsApp", record.phone, { mono: true }),
        field("Guardian email", record.email, { wide: true }),
        field("Guardian consent", record.consent ? "Yes — given" : "No"),
      ]
    : [
        field("Student WhatsApp", record.phone, { mono: true }),
        field("Student email", record.email, { wide: true }),
        field("Consent", record.consent ? "Yes — given" : "No"),
      ];

  const messageBlock = record.message
    ? `<div class="msg" style="font-size:${messageSize(record.message.length)}px">${esc(record.message)}</div>`
    : '<div class="msg empty">No message was left.</div>';

  const body = `<section class="sheet">
  <header class="top">
    <div class="orn a"></div><div class="orn b"></div>
    <div class="logo">GIC</div>
    <div class="ttl">
      <div class="org">GIC — Global Islamic Center</div>
      <div class="doc">New Student Information</div>
    </div>
    <div class="idbox"><div class="k2">Submission ID</div><div class="id">${esc(record.submissionId)}</div></div>
  </header>

  <div class="name">
    <div class="nm">${esc(record.name)}</div>
    <div class="chips">
      <span class="chip gold">${esc(record.topic || "Study topic not set")}</span>
      <span class="chip">${record.isMinor ? "Minor · guardian contact" : "Adult student"}</span>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Student</h3>
      <div class="fs">
        ${field("Age", record.age === null ? "" : `${record.age} years`)}
        ${field("Class / level", record.classLevel)}
        ${field("Country", record.country)}
        ${field("City", record.city)}
      </div>
    </div>
    <div class="card">
      <h3>${guardian ? "Guardian contact" : "Contact"}</h3>
      <div class="fs">${contactFields.join("")}</div>
    </div>
  </div>

  <div class="card msgcard">
    <h3>Message from the student</h3>
    ${messageBlock}
  </div>

  <div class="sys">
    <div><span>Submitted</span>${esc(submitted)}</div>
    <div><span>IP address</span>${val(record.ip)}</div>
  </div>

  <footer class="foot">Confidential — for GIC administrators only · Generated ${esc(formatDateTime(generatedAt))}</footer>
</section>`;

  const css = `
@media screen{html,body{background:#e9e4d4}.sheet{margin:16px auto;box-shadow:0 4px 30px rgba(0,0,0,.2)}}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${PROFILE_PAGE.widthMm}mm;background:${C.ivory}}
body{font-family:${FONT_STACK};color:${C.charcoal};-webkit-print-color-adjust:exact;print-color-adjust:exact;text-rendering:geometricPrecision}
.sheet{position:relative;width:${PROFILE_PAGE.widthMm}mm;height:${PROFILE_PAGE.sheetHeightMm}mm;overflow:hidden;padding:14mm 14mm 0;background:${C.ivory};page-break-after:avoid}
.top{position:relative;overflow:hidden;height:36mm;border-radius:6mm;padding:0 9mm;display:flex;align-items:center;gap:6mm;background:linear-gradient(120deg,${C.brand950},${C.brand800} 60%,${C.brand700});color:#fff}
.orn{position:absolute;width:40mm;height:40mm;right:34mm;top:-6mm;border:.4mm solid ${C.goldLight};opacity:.3}
.orn.a{transform:rotate(45deg)}.orn.b{border-radius:50%}
.logo{position:relative;flex:none;width:19mm;height:19mm;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:700;color:${C.brand900};background:linear-gradient(135deg,${C.goldLight},${C.gold});box-shadow:0 0 0 1.4mm rgba(224,196,136,.28)}
.ttl{position:relative;flex:1;min-width:0}
.org{font-size:12px;color:${C.goldLight}}
.doc{margin-top:1mm;font-size:25px;font-weight:700;line-height:1.15}
.idbox{position:relative;text-align:right}
.k2{font-size:9.5px;letter-spacing:.8px;text-transform:uppercase;color:${C.brand100}}
.id{margin-top:1mm;padding:1.4mm 3mm;border-radius:99px;font-size:12px;font-weight:700;background:rgba(224,196,136,.22)}
.name{margin-top:8mm;padding:7mm 8mm;border-radius:5mm;background:#fff;border:.3mm solid ${C.line};border-left:2.2mm solid ${C.gold};height:40mm;overflow:hidden}
.nm{font-size:30px;font-weight:700;line-height:1.2;color:${C.brand900};max-height:21mm;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow-wrap:anywhere}
.chips{margin-top:3mm;display:flex;gap:3mm;flex-wrap:wrap}
.chip{padding:1.2mm 4mm;border-radius:99px;font-size:12.5px;font-weight:700;background:${C.brand100};color:${C.brand800}}
.chip.gold{background:${C.goldLight};color:${C.brand950}}
.grid{margin-top:6mm;display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.card{border-radius:5mm;background:#fff;border:.3mm solid ${C.line};padding:6mm 7mm;overflow:hidden}
.grid .card{height:72mm}
h3{font-size:12px;letter-spacing:.9px;text-transform:uppercase;color:${C.goldDark};padding-bottom:2.5mm;margin-bottom:3.5mm;border-bottom:.3mm solid ${C.line}}
.fs{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm 4mm}
.f.wide{grid-column:1 / -1}
.k{font-size:9.5px;letter-spacing:.5px;text-transform:uppercase;color:${C.muted}}
.v{margin-top:.8mm;font-size:14.5px;font-weight:700;line-height:1.25;max-height:11mm;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}
.v.mono{letter-spacing:.2px}
.na{font-weight:400;color:#8a9690;font-size:12.5px}
.msgcard{margin-top:6mm;height:72mm}
.msg{line-height:1.55;height:49mm;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere;color:${C.charcoal}}
.msg.empty{color:#8a9690;font-style:italic;font-size:14px}
.sys{margin-top:6mm;height:18mm;border-radius:5mm;padding:0 7mm;display:flex;align-items:center;justify-content:space-between;gap:6mm;background:${C.brand50};border:.3mm solid ${C.brand100};font-size:12.5px;font-weight:700;color:${C.brand800};overflow:hidden}
.sys span{display:block;font-size:9.5px;font-weight:400;letter-spacing:.5px;text-transform:uppercase;color:${C.muted};margin-bottom:.6mm}
.foot{position:absolute;left:14mm;right:14mm;bottom:9mm;padding-top:3mm;border-top:.5mm solid ${C.gold};font-size:10px;color:${C.muted};text-align:center}
`;

  return htmlDocument({ title: `Student ${record.submissionId}`, css, body });
}
