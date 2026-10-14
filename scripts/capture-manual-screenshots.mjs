#!/usr/bin/env node
/** Captura pantallas de prod para el manual (requiere sesión activa en Chrome o login manual). */

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../docs/manual-screenshots");

const shots = [
  { name: "02-bienvenida", url: "https://prometio.vercel.app/", wait: 4000 },
  { name: "03-pipeline", url: "https://prometio.vercel.app/pipeline", wait: 5000 },
  { name: "04-contactos", url: "https://prometio.vercel.app/contactos", wait: 5000 },
  { name: "05-cotizaciones", url: "https://prometio.vercel.app/cotizaciones", wait: 5000 },
  { name: "06-dashboard", url: "https://prometio.vercel.app/dashboard", wait: 5000 },
  { name: "08-actividades", url: "https://prometio.vercel.app/actividades", wait: 5000 },
  {
    name: "07-formulario-demo",
    url: "https://prometio.vercel.app/formulario-demo",
    wait: 8000,
    fullPage: true,
  },
];

const browser = await chromium.launch({ channel: "chrome", headless: false });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

for (const shot of shots) {
  console.log(`→ ${shot.name}`);
  await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(shot.wait);
  await page.screenshot({
    path: path.join(outDir, `${shot.name}.png`),
    fullPage: shot.fullPage ?? false,
  });
}

await browser.close();
console.log(`Listo: ${outDir}`);
