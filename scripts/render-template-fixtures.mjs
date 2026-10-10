import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

process.env.PDF_USE_SYSTEM_FONT_FALLBACK = "1";
const { renderStudentListHtml } = await import("../src/lib/students/pdf/list-template.js");
const { renderStudentProfileHtml } = await import("../src/lib/students/pdf/profile-template.js");

const outDir = path.resolve(process.argv[2] || path.join(os.tmpdir(), "gic-pdf-html-fixtures"));
await mkdir(outDir, { recursive: true });

const makeRecord = (index) => {
  const minor = index % 2 === 0;
  return {
    submissionId: `GIC-TEST-${String(index + 1).padStart(4, "0")}`,
    studentName: index === 0 ? "মুহাম্মদ আবদুল্লাহ — দীর্ঘ নামের layout test" : `শিক্ষার্থী ${index + 1} · Student ${index + 1}`,
    age: minor ? 12 + (index % 5) : 18 + (index % 40),
    classLevel: "Class 8 / হিফজ",
    country: minor ? "বাংলাদেশ" : "United Kingdom",
    city: minor ? "কুমিল্লা" : "London",
    address: "Long address test, House 123, Road 456, এলাকার নাম এবং অতিরিক্ত ঠিকানা যাচাই",
    studyTopic: index % 3 === 0 ? "কায়দা" : index % 3 === 1 ? "আমপারা" : "কোরআন শরিফ",
    whatsapp: index === 0 ? "MINOR_STUDENT_PHONE_SHOULD_NOT_SHOW" : `PRIVATE_STUDENT_PHONE_${index + 1}`,
    email: index === 0 ? "MINOR_STUDENT_EMAIL_SHOULD_NOT_SHOW@example.test" : `PRIVATE_STUDENT_EMAIL_${index + 1}@example.test`,
    contactName: minor ? `অভিভাবক ${index + 1}` : "",
    guardianWhatsapp: minor ? `+880180000${String(index).padStart(4, "0")}` : "",
    guardianEmail: minor ? `guardian-${index + 1}@example.test` : "",
    guardianConsent: minor ? true : undefined,
    consent: !minor,
    ipAddress: index % 7 === 0 ? "2001:0db8:85a3:0000:0000:8a2e:0370:7334" : `192.0.2.${(index % 250) + 1}`,
    message: `THIS_MESSAGE_MUST_NOT_APPEAR_IN_LIST_${index + 1}. বাংলা বার্তা। `.repeat(8),
    createdAt: new Date(Date.now() - index * 60_000),
    source: "website",
  };
};

for (const count of [1, 20, 21, 100]) {
  const html = renderStudentListHtml(Array.from({ length: count }, (_, index) => makeRecord(index)), { kind: "all" });
  if (html.includes("THIS_MESSAGE_MUST_NOT_APPEAR_IN_LIST")) throw new Error("List HTML unexpectedly includes a message field.");
  if (html.includes("MINOR_STUDENT_PHONE_SHOULD_NOT_SHOW") || html.includes("MINOR_STUDENT_EMAIL_SHOULD_NOT_SHOW")) throw new Error("Minor student contact leaked into list HTML.");
  const file = path.join(outDir, `list-${count}.html`);
  await writeFile(file, html);
  console.log(file);
}

for (const [label, record] of [["minor", makeRecord(0)], ["adult", makeRecord(1)]]) {
  const html = renderStudentProfileHtml(record);
  const file = path.join(outDir, `profile-${label}.html`);
  await writeFile(file, html);
  console.log(file);
}
console.log(`Fixture HTML written to ${outDir}`);
