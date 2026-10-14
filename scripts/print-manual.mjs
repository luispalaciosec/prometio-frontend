#!/usr/bin/env node
/** Genera Manual-PrometIO.pdf desde docs/manual-prometio-print.html vía Playwright. */

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "docs/manual-prometio-print.html");
const outPath = path.join(root, "docs/Manual-PrometIO.pdf");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.pdf({
  path: outPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
});
await browser.close();

const { size } = await import("fs/promises").then((fs) => fs.stat(outPath));
console.log(`Generado: ${outPath} (${Math.round(size / 1024)} KB)`);
