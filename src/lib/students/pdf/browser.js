import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

let sharedBrowserPromise;

async function launchBrowser() {
  const executablePath = process.env.PDF_CHROMIUM_PATH || await chromium.executablePath();
  return puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    executablePath,
    headless: true,
    defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
  });
}

async function getBrowser() {
  if (sharedBrowserPromise) {
    try {
      const browser = await sharedBrowserPromise;
      if (browser.isConnected()) return browser;
    } catch {
      // A stale promise is reset below and the browser is launched again.
    }
    sharedBrowserPromise = undefined;
  }

  sharedBrowserPromise = launchBrowser();
  try {
    return await sharedBrowserPromise;
  } catch (error) {
    sharedBrowserPromise = undefined;
    throw error;
  }
}

function abortError() {
  const error = new Error("PDF generation was cancelled or timed out.");
  error.name = "AbortError";
  return error;
}

/** Render fully self-contained HTML to vector PDF, with remote requests blocked. */
export async function renderHtmlToPdf(html, { timeoutMs = 240_000, signal, format } = {}) {
  if (signal?.aborted) throw signal.reason || abortError();

  const browser = await getBrowser();
  const page = await browser.newPage();
  const remaining = Math.max(1_000, timeoutMs);
  let abortListener;

  try {
    page.setDefaultTimeout(remaining);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      if (url.startsWith("data:") || url.startsWith("about:")) {
        request.continue().catch(() => {});
      } else {
        request.abort("blockedbyclient").catch(() => {});
      }
    });

    abortListener = () => {
      void page.close().catch(() => {});
    };
    signal?.addEventListener("abort", abortListener, { once: true });

    if (signal?.aborted) throw signal.reason || abortError();

    await page.setContent(html, {
      waitUntil: "load",
      timeout: Math.min(30_000, remaining),
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
      return true;
    });

    if (signal?.aborted) throw signal.reason || abortError();

    const pdfOptions = {
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      timeout: remaining,
    };
    if (format) pdfOptions.format = format;

    const bytes = await page.pdf(pdfOptions);
    return Buffer.from(bytes);
  } catch (error) {
    if (signal?.aborted) throw signal.reason || abortError();
    throw error;
  } finally {
    if (abortListener) signal?.removeEventListener("abort", abortListener);
    await page.close().catch(() => {});
  }
}
