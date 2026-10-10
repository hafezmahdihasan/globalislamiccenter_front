import { existsSync } from "node:fs";
import { getPdfTimeoutMs } from "@/lib/students/pdf/constants";
import { logger } from "@/lib/utils/logger";

/**
 * Renders an HTML string to a PDF Buffer with headless Chromium.
 *
 *  - Serverless (Vercel/AWS): @sparticuz/chromium supplies the binary.
 *  - Local/VPS: PDF_CHROME_PATH, CHROME_PATH or a well-known install path.
 *
 * The page is locked down because the HTML contains user-supplied text: the
 * templates carry a strict CSP (no scripts) and every network request is blocked.
 * Only one render runs at a time per process (memory safety); extra callers
 * wait in line.
 */

const LOCAL_CHROME_PATHS = [
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

const BASE_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--font-render-hinting=none",
];

let queue = Promise.resolve();

async function launchOptions() {
  const configured = process.env.PDF_CHROME_PATH || process.env.CHROME_PATH;
  if (configured) return { executablePath: configured, args: BASE_ARGS };

  const serverless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
  if (!serverless) {
    const local = LOCAL_CHROME_PATHS.find((candidate) => existsSync(candidate));
    if (local) return { executablePath: local, args: BASE_ARGS };
  }

  // @sparticuz/chromium only unpacks its bundled system libraries (libnss3 etc.)
  // when it believes it runs on AWS Lambda. Vercel runs on the same base image
  // but does not always set this variable, which causes
  // "libnss3.so: cannot open shared object file". Set it BEFORE importing.
  if (!process.env.AWS_EXECUTION_ENV) {
    process.env.AWS_EXECUTION_ENV = `AWS_Lambda_nodejs${process.versions.node.split(".")[0]}.x`;
  }
  const { default: chromium } = await import("@sparticuz/chromium");
  return {
    executablePath: await chromium.executablePath(),
    args: [...chromium.args, ...BASE_ARGS],
  };
}

function abortError(signal) {
  const error = new Error("PDF generation was aborted");
  error.name = "AbortError";
  error.cause = signal.reason;
  return error;
}

async function renderNow(html, pdfOptions, signal) {
  const { default: puppeteer } = await import("puppeteer-core");
  const options = await launchOptions();
  const timeout = getPdfTimeoutMs();

  const browser = await puppeteer.launch({
    ...options,
    headless: true,
    timeout: 60_000,
  });
  const onAbort = () => browser.close().catch(() => {});
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    if (signal?.aborted) throw abortError(signal);

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      // Fonts and images are inlined as data: URIs; nothing may leave the box.
      if (request.url().startsWith("data:") || request.url() === "about:blank")
        request.continue();
      else request.abort();
    });

    await page.setContent(html, { waitUntil: "load", timeout });
    // Make sure every embedded font has been decoded before printing.
    await page
      .evaluate(() => document.fonts && document.fonts.ready)
      .catch(() => {});

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      timeout,
      ...pdfOptions,
    });
    return Buffer.from(pdf);
  } catch (error) {
    if (signal?.aborted) throw abortError(signal);
    throw error;
  } finally {
    signal?.removeEventListener("abort", onAbort);
    await browser.close().catch(() => {});
  }
}

export function renderPdf(html, { signal, ...pdfOptions } = {}) {
  const run = queue.then(() => renderNow(html, pdfOptions, signal));
  // Keep the queue alive after a failure, but surface the error to the caller.
  queue = run.catch((error) => {
    logger.warn("pdf render failed", { action: "pdf_render", error });
  });
  return run;
}
