import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5173";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ui_admin@test.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ui_pass_123";

const results = [];

function record(id, status, details = "") {
  results.push({ id, status, details });
}

async function login(page) {
  await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: "networkidle" });
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForURL("**/dashboard/settings", { timeout: 15000 });
  await page.waitForSelector(".dashboard-main", { timeout: 15000 });
}

async function runDesktopChecks(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const hasForm =
      (await page.locator("#name").count()) === 1 &&
      (await page.locator("#contact").count()) === 1 &&
      (await page.locator("#text").count()) === 1 &&
      (await page.locator("button.submit").count()) === 1;
    record("A-01", hasForm ? "PASS" : "FAIL", hasForm ? "" : "feedback form elements not found");

    const submitDisabled = await page.locator("button.submit").isDisabled();
    record("A-04", submitDisabled ? "PASS" : "FAIL", submitDisabled ? "" : "submit should be disabled for empty form");

    await login(page);

    await page.click("a[href='/dashboard']");
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    const dashActive = await page.locator("a[href='/dashboard'].active").count();

    await page.click("a[href='/dashboard/reviews']");
    await page.waitForURL("**/dashboard/reviews", { timeout: 10000 });
    const reviewsActive = await page.locator("a[href='/dashboard/reviews'].active").count();

    await page.click("a[href='/dashboard/analytics']");
    await page.waitForURL("**/dashboard/analytics", { timeout: 10000 });
    const analyticsActive = await page.locator("a[href='/dashboard/analytics'].active").count();

    await page.click("a[href='/dashboard/settings']");
    await page.waitForURL("**/dashboard/settings", { timeout: 10000 });
    const settingsActive = await page.locator("a[href='/dashboard/settings'].active").count();
    record(
      "E-01",
      dashActive === 1 && reviewsActive === 1 && analyticsActive === 1 && settingsActive === 1 ? "PASS" : "FAIL",
      ""
    );

    const errorsCount = await page.locator(".dashboard-error").count();
    record("E-02", errorsCount === 0 ? "PASS" : "FAIL", errorsCount === 0 ? "" : "dashboard error message visible");

    await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: "networkidle" });
    const trendBars = await page.locator(".analytics-trend-bar").count();
    record("F-02", trendBars > 0 ? "PASS" : "FAIL", trendBars > 0 ? "" : "analytics trend bars not rendered");

    await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    const stillLoggedIn = (await page.locator(".dashboard-main").count()) === 1 && (await page.locator("#email").count()) === 0;
    record("F-03", stillLoggedIn ? "PASS" : "FAIL", stillLoggedIn ? "" : "session not preserved after reload");

    await page.click("button.dashboard-logout-btn");
    await page.waitForSelector("#email", { timeout: 10000 });
    const loggedOut = (await page.locator("#email").count()) === 1;
    record("B-04", loggedOut ? "PASS" : "FAIL", "");
  } finally {
    await context.close();
  }
}

async function runMobileCheck(browser) {
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: "networkidle" });
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.click("button[type='submit']");
    await page.waitForSelector(".dashboard-main", { timeout: 15000 });
    const isUsable = await page.evaluate(() => {
      const over = document.documentElement.scrollWidth > window.innerWidth + 1;
      const nav = document.querySelector(".dashboard-nav");
      const main = document.querySelector(".dashboard-main");
      return !over && Boolean(nav) && Boolean(main);
    });
    record("E-03", isUsable ? "PASS" : "FAIL", isUsable ? "" : "mobile layout overflow or missing sections");
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    await runDesktopChecks(browser);
    await runMobileCheck(browser);
  } finally {
    await browser.close();
  }

  const summary = {
    timestamp: new Date().toISOString(),
    base_url: BASE_URL,
    total: results.length,
    pass: results.filter((x) => x.status === "PASS").length,
    fail: results.filter((x) => x.status === "FAIL").length,
    results,
  };

  const outDir = path.resolve(process.cwd(), "../docs/reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "UI_QA_RUN_2026-02-10.json");
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
