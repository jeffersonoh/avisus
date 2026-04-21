/**
 * Valida o badge de alertas não lidos na AppHeader:
 *  1. Login + /dashboard
 *  2. Zera via markAlertsAsRead (visita /alertas) pra baseline previsível
 *  3. Volta pra /dashboard, insere alerta com service role
 *  4. Espera badge aparecer com count = 1 via Realtime
 *  5. Visita /alertas → mark-as-read → volta, confirma badge sumiu
 *  6. Cleanup das linhas inseridas
 */

import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const email = "dev@avisus.local";
const password = "AvisusDev2026!";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey);

const { data: auth } = await admin.auth.admin.listUsers();
const devUser = auth.users.find((u) => u.email === email);
if (!devUser) {
  console.error("Usuário dev@avisus.local não encontrado.");
  process.exit(1);
}

const { data: opps } = await admin
  .from("opportunities")
  .select("id, name, marketplace, buy_url")
  .limit(50);

const { data: existing } = await admin
  .from("alerts")
  .select("opportunity_id")
  .eq("user_id", devUser.id);
const takenIds = new Set((existing ?? []).map((a) => a.opportunity_id));
const freeOpp = opps?.find((o) => !takenIds.has(o.id));
if (!freeOpp) {
  console.error("Sem oportunidade livre para criar novo alerta.");
  process.exit(1);
}

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = chromeCandidates.find((p) => fs.existsSync(p));

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

let exitCode = 1;
let insertedAlertId = null;

function readBadgeCount(page) {
  return page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find(
      (a) => a.getAttribute("href") === "/alertas",
    );
    if (!link) return { found: false };
    const badge = link.querySelector("span[aria-label*='não lido']");
    return {
      found: true,
      hasBadge: !!badge,
      badgeText: badge?.textContent ?? null,
      ariaLabel: badge?.getAttribute("aria-label") ?? null,
    };
  });
}

async function waitForBadge(page, predicate, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await readBadgeCount(page);
    if (predicate(last)) return last;
    await new Promise((r) => setTimeout(r, 250));
  }
  return last;
}

try {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(baseUrl, ["notifications"]);

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  page.setDefaultTimeout(30_000);

  page.on("pageerror", (err) => console.log("  [pageerror]", err.message));
  page.on("console", (msg) => {
    if (/Failed to load resource/.test(msg.text())) return;
    if (msg.type() === "error") console.log("  [browser:error]", msg.text());
  });

  // --- Login ---
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', email, { delay: 5 });
  await page.type('input[name="password"]', password, { delay: 5 });
  await page.evaluate(() => {
    const btn = document
      .querySelector("#login-email")
      ?.closest("form")
      ?.querySelector('button[type="submit"]');
    btn?.click();
  });

  const loginDeadline = Date.now() + 20_000;
  while (Date.now() < loginDeadline) {
    const p = new URL(page.url()).pathname;
    if (/\/(dashboard|onboarding|alertas)(\/|$)/.test(p)) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log("Login OK em", page.url());

  // Baseline: visita /alertas pra zerar, depois /dashboard pra observar o badge
  await page.goto(`${baseUrl}/alertas`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500)); // espera markAlertsAsRead completar
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 3000)); // espera subscription realtime conectar

  const beforeInsert = await waitForBadge(page, (s) => s.found && !s.hasBadge, 5000);
  console.log("Badge antes do insert:", beforeInsert);

  // --- Insere alerta ---
  const { data: inserted, error: insertError } = await admin
    .from("alerts")
    .insert({
      user_id: devUser.id,
      opportunity_id: freeOpp.id,
      channel: "web",
      status: "pending",
    })
    .select()
    .single();
  if (insertError) throw insertError;
  insertedAlertId = inserted.id;
  console.log("Alerta inserido:", inserted.id);

  // Espera o badge aparecer com count=1
  const afterInsert = await waitForBadge(
    page,
    (s) => s.found && s.hasBadge && s.badgeText === "1",
    10_000,
  );
  console.log("Badge após insert:", afterInsert);

  // Visita /alertas → deve disparar markAlertsAsRead
  await page.goto(`${baseUrl}/alertas`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 2000));

  // Volta pra /dashboard e confirma que o badge sumiu
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle0" });
  const afterRead = await waitForBadge(page, (s) => s.found && !s.hasBadge, 8000);
  console.log("Badge após marcar como lido:", afterRead);

  const ok =
    beforeInsert?.found &&
    !beforeInsert.hasBadge &&
    afterInsert?.hasBadge &&
    afterInsert.badgeText === "1" &&
    afterRead?.found &&
    !afterRead.hasBadge;

  if (ok) {
    console.log("\n✅ Badge de alertas funcionando end-to-end.");
    exitCode = 0;
  } else {
    console.error("\n❌ Falha no fluxo do badge.");
  }

  const shot = path.join("tmp", `alerts-badge-${Date.now()}.png`);
  fs.mkdirSync("tmp", { recursive: true });
  await page.screenshot({ path: shot, fullPage: true });
  console.log("Screenshot:", shot);
} catch (err) {
  console.error("Falha:", err instanceof Error ? err.stack : err);
} finally {
  if (insertedAlertId) {
    await admin.from("alerts").delete().eq("id", insertedAlertId);
  }
  await browser.close();
}

process.exit(exitCode);
