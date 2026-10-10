import test from "node:test";
import assert from "node:assert/strict";
process.env.PDF_USE_SYSTEM_FONT_FALLBACK = "1";

const { renderStudentListHtml } = await import("../src/lib/students/pdf/list-template.js");
const { renderStudentProfileHtml } = await import("../src/lib/students/pdf/profile-template.js");

const minor = {
  studentName: "আয়েশা রহমান",
  age: 12,
  whatsapp: "+8801700000000",
  email: "PRIVATE_STUDENT_EMAIL@example.test",
  guardianWhatsapp: "+8801800000000",
  guardianEmail: "guardian@example.test",
  contactName: "অভিভাবক",
  guardianConsent: true,
  consent: false,
  message: "SECRET_MESSAGE_SHOULD_NOT_APPEAR_IN_LIST",
  city: "কুমিল্লা",
  country: "বাংলাদেশ",
  ipAddress: "192.0.2.10",
  studyTopic: "কায়দা",
};

test("list report uses guardian contact data for minors and omits messages", () => {
  const html = renderStudentListHtml([minor], { kind: "new" });
  assert.match(html, /guardian@example\.test/);
  assert.match(html, /\+8801800000000/);
  assert.doesNotMatch(html, /PRIVATE_STUDENT_EMAIL/);
  assert.doesNotMatch(html, /\+8801700000000/);
  assert.doesNotMatch(html, /SECRET_MESSAGE_SHOULD_NOT_APPEAR_IN_LIST/);
});

test("single-student profile uses guardian contact details for a minor", () => {
  const html = renderStudentProfileHtml(minor);
  assert.match(html, /guardian@example\.test/);
  assert.doesNotMatch(html, /PRIVATE_STUDENT_EMAIL/);
  assert.doesNotMatch(html, /\+8801700000000/);
  assert.match(html, /SECRET_MESSAGE_SHOULD_NOT_APPEAR_IN_LIST/);
});

test("list report keeps messages out for adult records too", () => {
  const adult = { ...minor, age: 22, whatsapp: "+8801999999999", email: "adult@example.test" };
  const html = renderStudentListHtml([adult], { kind: "all" });
  assert.match(html, /adult@example\.test/);
  assert.match(html, /\+8801999999999/);
  assert.doesNotMatch(html, /SECRET_MESSAGE_SHOULD_NOT_APPEAR_IN_LIST/);
});
