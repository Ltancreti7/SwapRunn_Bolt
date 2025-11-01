import { chromium } from "playwright";
import fs from "fs";
import path from "path";

(async () => {
  const url = process.env.APP_URL || "http://localhost:8082/";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Opening driver dashboard...");
  await page.goto(url + "driver/dashboard", { waitUntil: "networkidle" });

  // Wait for the header to load
  await page.waitForSelector("header", { timeout: 5000 }).catch(() => {});

  // Screenshot before
  const cwd = process.cwd();
  const beforePath = path.join(cwd, "sim-before.png");
  await page.screenshot({ path: beforePath, fullPage: false });
  console.log("Saved before screenshot to", beforePath);

  // Dispatch the newJobAvailable event in page context
  const fakeJob = {
    id: "mock_job_123",
    year: 2020,
    make: "TestMake",
    model: "TestModel",
    pickup_address: "100 Test St",
    delivery_address: "200 Demo Ave",
    distance_miles: 12,
    requires_two: false,
    customer_name: "ACME",
  };

  console.log("Dispatching newJobAvailable event...");
  await page.evaluate((job) => {
    window.dispatchEvent(new CustomEvent("newJobAvailable", { detail: job }));
  }, fakeJob);

  // Wait a short moment for UI to update
  await page.waitForTimeout(1200);

  // Screenshot after
  const afterPath = path.join(cwd, "sim-after.png");
  await page.screenshot({ path: afterPath, fullPage: false });
  console.log("Saved after screenshot to", afterPath);

  // Also capture badge text if present
  const badgeText = await page.evaluate(() => {
    const badge = document.querySelector(
      'header .badge, header [class*="bg-white"]',
    );
    if (badge) return badge.textContent?.trim();
    // Try other selectors used in AppHeader
    const el =
      document.querySelector("header .absolute .badge") ||
      document.querySelector('header [class*="-right-1"]');
    return el ? el.textContent?.trim() : null;
  });

  console.log("Badge text captured:", badgeText);

  await browser.close();
  // write a small report
  const report = { before: beforePath, after: afterPath, badgeText };
  const reportPath = path.join(cwd, "sim-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log("Wrote sim-report.json to", reportPath);
})();
