// Renders a CV HTML file (from build_cv_print_html.js) to PDF via the
// pre-installed Playwright + Chromium (no LibreOffice dependency).
// Usage: node build_cv_pdf.js <input.html> <output.pdf>

const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/opt/node22/lib/node_modules/playwright");

const [, , htmlPath, pdfPath] = process.argv;
if (!htmlPath || !pdfPath) {
  console.error("Usage: node build_cv_pdf.js <input.html> <output.pdf>");
  process.exit(1);
}

const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  try {
    const page = await browser.newPage();
    await page.goto("file://" + path.resolve(htmlPath));
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    console.log(`Wrote ${pdfPath}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
