import { chromium } from "playwright";
const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto("http://localhost:3001", { waitUntil: "networkidle", timeout: 20000 });
await p.waitForTimeout(4000);
await p.screenshot({ path: "preview.png", fullPage: true });
await b.close();
