import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { createStudentListPdf, createStudentProfilePdf } from "../src/lib/students/export.js";

const outDir = path.resolve(process.argv[2] || path.join(os.tmpdir(), "gic-pdf-test-output"));
await mkdir(outDir, { recursive: true });

const samples = Array.from({ length: 100 }, (_, index) => {
  const minor = index % 2 === 0;
  return {
    _id: `sample-${index + 1}`,
    submissionId: `GIC-TEST-${String(index + 1).padStart(4, "0")}`,
    studentName: index === 0 ? "মুহাম্মদ আবদুল্লাহ - A very long student name for wrapping verification" : `শিক্ষার্থী ${index + 1} · Student ${index + 1}`,
    age: minor ? 12 + (index % 5) : 18 + (index % 40),
    classLevel: index % 3 === 0 ? "Class 8 / হিফজ" : "Not specified",
    country: index % 2 === 0 ? "বাংলাদেশ" : "United Kingdom",
    city: index % 2 === 0 ? "কুমিল্লা" : "London",
    address: "Long address test, House 123, Road 456, এলাকার নাম এবং অতিরিক্ত ঠিকানা যাচাই",
    studyTopic: index % 3 === 0 ? "কায়দা" : index % 3 === 1 ? "আমপারা" : "কোরআন শরিফ",
    whatsapp: `+880170000${String(index).padStart(4, "0")}`,
    email: `student-${index + 1}@example.test`,
    contactName: minor ? `অভিভাবক ${index + 1}` : "",
    guardianWhatsapp: minor ? `+880180000${String(index).padStart(4, "0")}` : "",
    guardianEmail: minor ? `guardian-${index + 1}@example.test` : "",
    guardianConsent: minor ? true : undefined,
    consent: !minor,
    ipAddress: index % 7 === 0 ? "2001:0db8:85a3:0000:0000:8a2e:0370:7334" : `192.0.2.${(index % 250) + 1}`,
    message: `This message must never appear in list exports. SECRET_LIST_MESSAGE_${index + 1}. বাংলা বার্তা। `.repeat(8),
    createdAt: new Date(Date.now() - index * 60_000),
    source: "website",
  };
});

function getPdfInfo(pdfPath) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const pagesMatch = output.match(/^Pages:\s+(\d+)/m);
  const sizeMatch = output.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);
  if (!pagesMatch || !sizeMatch) throw new Error(`pdfinfo could not read page metadata for ${pdfPath}`);
  return { pages: Number(pagesMatch[1]), widthPt: Number(sizeMatch[1]), heightPt: Number(sizeMatch[2]) };
}

function assertListPageSize(info, label) {
  if (Math.abs(info.widthPt - 1872) > 2 || Math.abs(info.heightPt - 2160) > 2) {
    throw new Error(`${label} should be 26 x 30 inches (1872 x 2160 pt); received ${info.widthPt} x ${info.heightPt} pt.`);
  }
}

function assertA4PageSize(info, label) {
  // Chromium's CSS-mm conversion may differ from nominal A4 by a fraction of a point.
  if (Math.abs(info.widthPt - 595.28) > 2 || Math.abs(info.heightPt - 841.89) > 2) {
    throw new Error(`${label} should be A4; received ${info.widthPt} x ${info.heightPt} pt.`);
  }
}

const cases = [
  { count: 1, expectedPages: 1 },
  { count: 20, expectedPages: 1 },
  { count: 21, expectedPages: 2 },
  { count: 100, expectedPages: 5 },
];

for (const testCase of cases) {
  const rows = samples.slice(0, testCase.count);
  const pdf = await createStudentListPdf(rows, { kind: "all" });
  const outputPath = path.join(outDir, `gic-list-${testCase.count}.pdf`);
  await writeFile(outputPath, pdf);
  const info = getPdfInfo(outputPath);
  if (info.pages !== testCase.expectedPages) {
    throw new Error(`${testCase.count} records should make ${testCase.expectedPages} pages; got ${info.pages}.`);
  }
  assertListPageSize(info, `List PDF with ${testCase.count} records`);
  console.log(`PASS list ${testCase.count}: ${info.pages} page(s), 26 x 30 in -> ${outputPath}`);
}

const profilePdf = await createStudentProfilePdf(samples[0]);
const profilePath = path.join(outDir, "gic-profile-minor.pdf");
await writeFile(profilePath, profilePdf);
const minorInfo = getPdfInfo(profilePath);
if (minorInfo.pages !== 1) throw new Error("Minor profile must be exactly one A4 page.");
assertA4PageSize(minorInfo, "Minor profile PDF");
console.log(`PASS minor profile: one A4 page -> ${profilePath}`);

const adultPdf = await createStudentProfilePdf(samples[1]);
const adultPath = path.join(outDir, "gic-profile-adult.pdf");
await writeFile(adultPath, adultPdf);
const adultInfo = getPdfInfo(adultPath);
if (adultInfo.pages !== 1) throw new Error("Adult profile must be exactly one A4 page.");
assertA4PageSize(adultInfo, "Adult profile PDF");
console.log(`PASS adult profile: one A4 page -> ${adultPath}`);

console.log(`\nAll PDF tests passed. Output directory: ${outDir}`);
console.log("Optional visual render: pdftoppm -f 1 -l 1 -png -r 80 gic-list-20.pdf preview-list");
