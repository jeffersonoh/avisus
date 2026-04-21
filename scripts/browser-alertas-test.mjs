/**
 * Teste manual headless da tela /alertas.
 *
 * Faz login como dev@avisus.local, navega até /alertas e captura:
 *  - URL final e status HTTP
 *  - Trechos de texto de cada seção (UpgradeCTA, AlertList, ChannelConfig)
 *  - Screenshot completo em tmp/alertas-{timestamp}.png
 *
 * Vars:
 *   BASE_URL (default http://127.0.0.1:3001)
 *   E2E_EMAIL (default dev@avisus.local)
 *   E2E_PASSWORD (default AvisusDev2026!)
 *   CHROME_PATH
 */

import fs from "node:fs";
import path from "node:path";

import puppeteer from "puppeteer-core";

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const email = process.env.E2E_EMAIL ?? "dev@avisus.local";
const password = process.env.E2E_PASSWORD ?? "AvisusDev2026!";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((p) => typeof p === "string" && p.length > 0);

function firstExisting(paths) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

const executablePath = firstExisting(chromeCandidates);
if (!executablePath) {
  console.error("Chrome/Chromium não encontrado. Defina CHROME_PATH.");
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

let exitCode = 1;

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  page.setDefaultTimeout(30_000);

  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });

  // --- Login ---
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="email"]', { timeout: 30_000 });
  await page.type('input[name="email"]', email, { delay: 5 });
  await page.type('input[name="password"]', password, { delay: 5 });

  await page.evaluate(() => {
    const emailEl = document.querySelector("#login-email");
    const form = emailEl?.closest("form");
    const btn = form?.querySelector('button[type="submit"]');
    if (!btn) throw new Error("submit não encontrado");
    btn.click();
  });

  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    const path = new URL(page.url()).pathname;
    if (/\/(dashboard|onboarding|alertas)(\/|$)/.test(path)) break;
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("Login OK. URL após login:", page.url());

  // --- Navegação para /alertas ---
  const resp = await page.goto(`${baseUrl}/alertas`, { waitUntil: "networkidle0", timeout: 30_000 });
  console.log("GET /alertas →", resp?.status());
  console.log("URL final:", page.url());

  if (!/\/alertas(\/|$)/.test(new URL(page.url()).pathname)) {
    console.error("⚠  Não permaneceu em /alertas. Provável redirect de auth.");
  }

  const sections = await page.evaluate(() => {
    const body = document.body.innerText;
    const has = (s) => body.includes(s);
    return {
      title: document.title,
      markers: {
        tabsNovos: has("NOVOS"),
        tabsEnviados: has("ENVIADOS"),
        tabsSilenciados: has("SILENCIADOS"),
        alertListHeader: has("Alertas recentes"),
        emptyState: /sem alertas|nenhum alerta|ainda não/i.test(body),
        channelConfigHeader: has("Canais de alerta"),
        telegramToggle: has("Telegram"),
        whatsappGate: has("WhatsApp"),
        webAppToggle: has("Web App") || has("Web"),
        silenceMode: has("Modo silêncio") || has("silêncio"),
        upgradeCta: has("limite diario") || has("limite diário") || has("Upgrade"),
      },
      buttons: [...document.querySelectorAll("button")].map((b) => b.innerText.trim()).filter(Boolean).slice(0, 30),
      bodyPreview: body.replace(/\s+/g, " ").trim().slice(0, 2500),
    };
  });

  console.log("\n--- Seções detectadas ---");
  console.log("Title:", sections.title);
  console.log("Markers:", sections.markers);
  console.log("Buttons:", sections.buttons);
  console.log("\nBody preview:\n", sections.bodyPreview);

  console.log("\n--- Requests com falha (>=400) ---");
  for (const r of failedRequests) console.log(" •", r);

  if (consoleErrors.length > 0) {
    console.log("\n--- Erros no console ---");
    for (const e of consoleErrors) console.log(" •", e);
  } else {
    console.log("\nSem erros no console.");
  }

  // Screenshot inicial
  const tmpDir = path.resolve("tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const shot = path.join(tmpDir, `alertas-${Date.now()}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  console.log("\nScreenshot:", shot);

  // --- Interação 1: filtro "Apenas não lidos" ---
  console.log("\n--- Interação: filtrar apenas não lidos ---");
  const filterClicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.innerText.trim() === "Apenas não lidos",
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  console.log("Filtro clicado:", filterClicked);
  await new Promise((r) => setTimeout(r, 400));

  // --- Interação 2: toggle Telegram e salvar ---
  console.log("\n--- Interação: toggle Telegram + salvar ---");
  const toggled = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /^Telegram/.test(b.innerText.trim()),
    );
    if (!btn) return { clicked: false };
    btn.click();
    return { clicked: true, text: btn.innerText.trim() };
  });
  console.log("Telegram:", toggled);
  await new Promise((r) => setTimeout(r, 300));

  const saveResult = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /Salvar prefer/.test(b.innerText.trim()),
    );
    if (!btn) return { found: false };
    btn.click();
    return { found: true, disabled: btn.disabled };
  });
  console.log("Salvar:", saveResult);
  await new Promise((r) => setTimeout(r, 2000));

  const postSave = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      success: /sucesso|salvo|atualizado/i.test(body),
      error: /erro|falha/i.test(body),
      bodyTail: body.slice(-500),
    };
  });
  console.log("Pós-save:", postSave);

  const shot2 = path.join(tmpDir, `alertas-after-${Date.now()}.png`);
  await page.screenshot({ path: shot2, fullPage: true });
  console.log("Screenshot pós-interação:", shot2);

  exitCode = 0;
} catch (err) {
  console.error("Falha:", err instanceof Error ? err.stack : err);
} finally {
  await browser.close();
}

process.exit(exitCode);
