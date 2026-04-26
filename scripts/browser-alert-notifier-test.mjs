/**
 * Valida ponta a ponta o AlertNotifier:
 *  1. Login headless como dev@avisus.local
 *  2. Concede permissão de Notification programaticamente
 *  3. Abre /alertas e aguarda canal realtime conectar
 *  4. Via service role, insere uma row em `alerts` para o dev user
 *  5. Intercepta new Notification() no browser e confirma o disparo
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
  console.error("Sem oportunidade livre para criar novo alerta (uq_alert_user_opp).");
  process.exit(1);
}
console.log("Oportunidade escolhida:", freeOpp.id, "-", freeOpp.name);

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

try {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(baseUrl, ["notifications"]);

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  page.setDefaultTimeout(30_000);

  const notifications = [];
  const consoleErrors = [];
  const failedRequests = [];

  await page.exposeFunction("__captureNotification__", (payload) => {
    notifications.push(payload);
  });

  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText ?? "?"}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      failedRequests.push(`${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") consoleErrors.push(text);
    if (!/Failed to load resource/.test(text)) {
      console.log(`  [browser:${msg.type()}]`, text);
    }
  });

  // Hook no construtor Notification SEM trocar a classe (preserva protótipo) —
  // evita quebrar hidratação React por mutação pré-hidratação.
  await page.evaluateOnNewDocument(() => {
    const OriginalNotification = window.Notification;
    if (!OriginalNotification) return;
    const wrapped = new Proxy(OriginalNotification, {
      construct(target, args) {
        try {
          window.__captureNotification__({
            title: args[0],
            body: args[1]?.body ?? null,
            tag: args[1]?.tag ?? null,
          });
        } catch {}
        return Reflect.construct(target, args);
      },
    });
    Object.defineProperty(window, "Notification", { value: wrapped, configurable: true });
  });

  // --- Login ---
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', email, { delay: 5 });
  await page.type('input[name="password"]', password, { delay: 5 });
  await page.evaluate(() => {
    const btn = document.querySelector("#login-email")?.closest("form")?.querySelector('button[type="submit"]');
    btn?.click();
  });

  const loginDeadline = Date.now() + 20_000;
  while (Date.now() < loginDeadline) {
    const p = new URL(page.url()).pathname;
    if (/\/(dashboard|onboarding|alertas)(\/|$)/.test(p)) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log("Login OK em", page.url());

  // --- Abre /alertas e espera subscription ---
  await page.goto(`${baseUrl}/alertas`, { waitUntil: "networkidle0" });
  console.log("Carregado /alertas");

  // dá tempo pra realtime channel assinar (handshake WS)
  await new Promise((r) => setTimeout(r, 8000));

  const domCheck = await page.evaluate(() => {
    const marker = document.querySelector("[data-testid=alert-notifier-mounted]");
    return {
      notificationType: typeof Notification,
      notificationPermission: typeof Notification !== "undefined" ? Notification.permission : null,
      bodyIncludesAtivar: document.body.innerText.includes("Ativar"),
      markerPresent: !!marker,
      markerPermission: marker?.getAttribute("data-permission") ?? null,
      scripts: [...document.querySelectorAll("script[src]")].length,
    };
  });
  console.log("DOM check:", domCheck);
  console.log("document.title =", await page.title());

  // Controle: outro client component (AlertList) hidrata normalmente?
  const hydrationProbe = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.innerText.trim() === "Apenas não lidos",
    );
    if (!btn) return { filterButtonFound: false };
    const before = btn.getAttribute("aria-pressed") ?? btn.style.background;
    btn.click();
    const after = btn.getAttribute("aria-pressed") ?? btn.style.background;
    return { filterButtonFound: true, changed: before !== after, before, after };
  });
  console.log("Hydration probe (AlertList):", hydrationProbe);

  // --- Insere alerta como service role ---
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

  if (insertError) {
    console.error("Falha ao inserir alerta:", insertError);
    throw insertError;
  }
  console.log("Alerta inserido:", inserted.id);

  // aguarda até 10s pelo Notification no cliente
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline && notifications.length === 0) {
    await new Promise((r) => setTimeout(r, 250));
  }

  // cleanup (remove o alerta recém-criado pra não poluir o estado)
  await admin.from("alerts").delete().eq("id", inserted.id);

  if (notifications.length > 0) {
    console.log("\n✅ Notification disparada:");
    for (const n of notifications) console.log("   •", n);
    exitCode = 0;
  } else {
    console.error("\n❌ Nenhuma Notification capturada em 10s.");
  }

  if (consoleErrors.length > 0) {
    console.log("\nErros no console:");
    for (const e of consoleErrors) console.log(" -", e);
  }

  if (failedRequests.length > 0) {
    console.log("\nRequests >=400 / falhas:");
    for (const r of failedRequests) console.log(" -", r);
  }

  const shot = path.join("tmp", `alert-notifier-${Date.now()}.png`);
  fs.mkdirSync("tmp", { recursive: true });
  await page.screenshot({ path: shot, fullPage: true });
  console.log("\nScreenshot:", shot);
} catch (err) {
  console.error("Falha:", err instanceof Error ? err.stack : err);
} finally {
  await browser.close();
}

process.exit(exitCode);
