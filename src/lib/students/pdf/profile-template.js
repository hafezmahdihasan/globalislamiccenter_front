import { PROFILE_PAGE } from "./constants.js";
import { COLORS as C, COMMON_CSS } from "./theme.js";
import { esc, makeDocument } from "./html.js";
import { getEmbeddedFontCss } from "./fonts.js";
import { consentLabel, getAddress, getContactInfo, isMinor, textValue, truncateText } from "./text.js";

function printDate(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date) + " (Dhaka)";
}

function field(label, value, className = "") {
  return `<div class="field ${className}"><span class="field-label">${esc(label)}</span><span class="field-value">${esc(textValue(value))}</span></div>`;
}

export function renderStudentProfileHtml(record, { logoDataUri = "", generatedAt = printDate(new Date()) } = {}) {
  if (!record || typeof record !== "object") throw new TypeError("Student profile PDF expects one inquiry record.");

  const minor = isMinor(record);
  const contact = getContactInfo(record);
  const studentName = truncateText(record.studentName, 90);
  const submissionId = truncateText(record.submissionId, 80);
  const age = textValue(record.age);
  const topic = textValue(record.studyTopic);
  const message = truncateText(record.message, 420, "… [truncated]");
  const showMessage = Boolean(textValue(record.message, ""));
  const logo = logoDataUri
    ? `<img class="logo" src="${esc(logoDataUri)}" alt="GIC logo">`
    : `<div class="logo-fallback">GIC</div>`;

  const css = `${getEmbeddedFontCss()}
${COMMON_CSS}
@page { size: A4; margin: 0; }
html, body { width: 210mm; height: 297mm; margin:0; padding:0; background:#fff; }
.sheet { width:210mm; height:297mm; padding:12mm 13mm 10mm; overflow:hidden; position:relative; background:#fff; }
.top-accent { position:absolute; left:0; top:0; right:0; height:5mm; background:linear-gradient(90deg,${C.green},${C.greenMid},${C.gold}); }
.header { display:flex; justify-content:space-between; align-items:center; gap:16px; padding-bottom:16px; border-bottom:1px solid ${C.border}; }
.brand { display:flex; align-items:center; gap:12px; min-width:0; }
.logo { display:block; width:48px; height:48px; object-fit:contain; }
.logo-fallback { width:48px; height:48px; display:flex; align-items:center; justify-content:center; background:${C.green}; color:${C.goldLight}; font-size:20px; font-weight:900; border-radius:12px; }
.brand-copy { min-width:0; }
.brand-title { font-size:17px; line-height:1.3; font-weight:900; letter-spacing:.7px; color:${C.green}; }
.brand-subtitle { margin-top:4px; font-size:10px; color:${C.muted}; letter-spacing:1.4px; text-transform:uppercase; }
.document-label { text-align:right; flex-shrink:0; }
.document-label strong { display:block; font-size:11px; color:${C.gold}; letter-spacing:1.3px; }
.document-label span { display:block; margin-top:6px; color:${C.muted}; font-size:9px; }
.hero { margin-top:22px; padding:22px 22px 23px; border-radius:13px; background:${C.green}; color:#fff; position:relative; overflow:hidden; }
.hero:after { content:""; position:absolute; width:135px; height:135px; right:-43px; top:-52px; border:1px solid rgba(224,196,136,.35); border-radius:50%; box-shadow:0 0 0 18px rgba(224,196,136,.04),0 0 0 36px rgba(224,196,136,.03); }
.hero-kicker { font-size:10px; letter-spacing:1.6px; font-weight:800; color:${C.goldLight}; text-transform:uppercase; }
h1 { position:relative; z-index:1; max-width:148mm; margin:10px 0 0; font-size:26px; line-height:1.22; overflow-wrap:anywhere; font-weight:850; }
.hero-meta { margin-top:13px; display:flex; flex-wrap:wrap; gap:8px; }
.pill { border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.08); border-radius:99px; padding:6px 10px; color:#fff; font-size:10px; }
.pill.minor { background:rgba(224,196,136,.16); border-color:rgba(224,196,136,.45); color:#ffedc8; }
.section-title { margin:22px 0 11px; display:flex; align-items:center; gap:8px; color:${C.green}; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:1.15px; }
.section-title:before { content:""; display:block; width:4px; height:15px; border-radius:3px; background:${C.gold}; }
.details-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:9px; }
.field { min-width:0; min-height:58px; border:1px solid ${C.border}; border-radius:8px; padding:10px 12px; background:#fff; }
.field-label { display:block; color:${C.muted}; font-size:9px; line-height:1.3; font-weight:800; text-transform:uppercase; letter-spacing:.6px; }
.field-value { display:block; margin-top:6px; color:${C.charcoal}; font-size:12px; line-height:1.4; font-weight:650; overflow-wrap:anywhere; word-break:break-word; }
.contact-card { border:1px solid ${minor ? C.minorLine : C.border}; border-radius:10px; padding:14px; background:${minor ? C.minor : "#f5f8f5"}; }
.contact-top { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:9px; }
.contact-title { color:${C.green}; font-size:12px; font-weight:900; }
.contact-badge { padding:5px 8px; border-radius:99px; color:${minor ? "#79551b" : C.green}; background:${minor ? "#f7e5bf" : "#deeee3"}; font-size:9px; font-weight:900; letter-spacing:.4px; }
.contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
.contact-grid .field { min-height:50px; padding:9px 10px; background:rgba(255,255,255,.78); }
.consent-row { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:10px; padding-top:9px; border-top:1px solid ${minor ? "#ead8b4" : C.border}; font-size:9px; }
.consent-row strong { color:${C.green}; }
.message-card { border:1px solid ${C.border}; border-radius:9px; padding:11px 12px; background:#fffdf8; }
.message-label { color:${C.muted}; font-size:9px; font-weight:900; letter-spacing:.8px; text-transform:uppercase; }
.message-body { margin-top:7px; color:${C.charcoal}; font-size:11px; line-height:1.55; white-space:pre-wrap; overflow-wrap:anywhere; max-height:54px; overflow:hidden; }
.no-message { color:${C.muted}; font-style:italic; }
.footer { position:absolute; bottom:8mm; left:13mm; right:13mm; display:flex; justify-content:space-between; align-items:flex-end; gap:10px; padding-top:9px; border-top:1px solid ${C.border}; color:${C.muted}; font-size:8.5px; }
.footer strong { color:${C.green}; letter-spacing:.8px; }
.footer-right { text-align:right; }
`;

  const body = `<section class="sheet">
    <div class="top-accent"></div>
    <header class="header">
      <div class="brand">${logo}<div class="brand-copy"><div class="brand-title">GLOBAL ISLAMIC CENTER</div><div class="brand-subtitle">Online Quran & Islamic Education</div></div></div>
      <div class="document-label"><strong>STUDENT INQUIRY</strong><span>Private administrative record</span></div>
    </header>

    <section class="hero">
      <div class="hero-kicker">New admission inquiry</div>
      <h1>${esc(studentName)}</h1>
      <div class="hero-meta"><span class="pill">${esc(submissionId)}</span><span class="pill">Age: ${esc(age)}</span><span class="pill">Topic: ${esc(topic)}</span>${minor ? `<span class="pill minor">MINOR · GUARDIAN CONTACT ONLY</span>` : `<span class="pill">ADULT STUDENT</span>`}</div>
    </section>

    <div class="section-title">Student information</div>
    <div class="details-grid">
      ${field("Student name", studentName)}
      ${field("Age", age)}
      ${field("Class / level", record.classLevel)}
      ${field("Study topic", topic)}
      ${field("Country", record.country)}
      ${field("City / address", getAddress(record))}
      ${field("IP address", record.ipAddress)}
      ${field("Submitted at", printDate(record.createdAt))}
      ${field("Source", record.source || "Website")}
    </div>

    <div class="section-title">${minor ? "Parent / guardian contact" : "Student contact"}</div>
    <section class="contact-card">
      <div class="contact-top"><div class="contact-title">${esc(contact.label)}</div><span class="contact-badge">${minor ? "MINOR RECORD" : "ADULT RECORD"}</span></div>
      <div class="contact-grid">
        ${field(minor ? "Guardian / contact name" : "Student name", contact.name)}
        ${field("WhatsApp", contact.whatsapp)}
        ${field("Email", contact.email)}
        ${field("Contact role", minor ? "Parent / guardian" : "Student")}
      </div>
      <div class="consent-row"><span>${minor ? "Guardian consent to contact" : "Student consent to contact"}</span><strong>${esc(consentLabel(minor ? record.guardianConsent : record.consent))}</strong></div>
    </section>

    ${showMessage ? `<div class="section-title">Additional message</div><section class="message-card"><div class="message-label">Message from form</div><div class="message-body">${esc(message)}</div></section>` : ""}

    <footer class="footer"><div><strong>GIC</strong> · Quran education, knowledge and character<br>Confidential: for authorized GIC administration only.</div><div class="footer-right">Generated ${esc(generatedAt)}<br>কুরআনের আলোয় জীবন গঠন</div></footer>
  </section>`;

  return makeDocument({
    title: `GIC Student Inquiry - ${studentName}`,
    css,
    body,
  });
}
