// Merge these properties into the existing nextConfig object in next.config.mjs.
// Do not replace unrelated configuration already present in your project.
const pdfRuntimeConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/student-inquiries": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/puppeteer-core/**/*",
      "./node_modules/@fontsource-variable/noto-sans-bengali/**/*",
      "./public/GIC.svg",
    ],
    "/api/telegram/webhook": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/puppeteer-core/**/*",
      "./node_modules/@fontsource-variable/noto-sans-bengali/**/*",
    ],
  },
};

export default pdfRuntimeConfig;
