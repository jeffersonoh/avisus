/**
 * Teste de login no navegador (headless) contra o app em execução.
 *
 * Variáveis de ambiente:
 *   BASE_URL (default http://127.0.0.1:3000)
 *   E2E_EMAIL (default dev@avisus.local)
 *   E2E_PASSWORD (default AvisusDev2026!)
 *   CHROME_PATH (caminho do Chrome/Chromium)
 *
 * Uso:
 *   npm run dev   # em outro terminal
 *   npm run test:browser:login
 */

import fs from "node:fs";

import puppeteer from "puppeteer-core";

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const email = process.env.E2E_EMAIL ?? "dev@avisus.local";
const password = process.env.E2E_PASSWORD ?? "AvisusDev2026!";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
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
  console.error(
    "Chrome/Chromium não encontrado. Defina CHROME_PATH ou instale google-chrome-stable.",
  );
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
  page.setDefaultTimeout(25_000);

  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });

  await page.waitForSelector('input[name="email"]', { timeout: 60_000 });
  await page.type('input[name="email"]', email, { delay: 5 });
  await page.type('input[name="password"]', password, { delay: 5 });

  await page.evaluate(() => {
    const emailEl = document.querySelector("#login-email");
    const form = emailEl?.closest("form");
    const btn = form?.querySelector('button[type="submit"]');
    if (!btn) {
      throw new Error('Botão submit do formulário de e-mail não encontrado.');
    }
    btn.click();
  });

  const deadline = Date.now() + 25_000;
  let finalUrl = page.url();
  let outcome = null;

  while (Date.now() < deadline) {
    finalUrl = page.url();
    const path = new URL(finalUrl).pathname;
    if (/\/(dashboard|onboarding)(\/|$)/.test(path)) {
      outcome = "success";
      break;
    }

    const alerts = await page.evaluate(() =>
      [...document.querySelectorAll('[role="alert"]')]
        .map((el) => el.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" | "),
    );

    if (alerts.includes("Configuração incompleta")) {
      outcome = "config";
      break;
    }

    if (alerts.includes("Não foi possível entrar")) {
      outcome = "auth";
      break;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  if (outcome === "success") {
    console.log("Login OK no navegador (headless).");
    console.log("  URL final:", finalUrl);
    exitCode = 0;
  } else if (outcome === "config") {
    console.error("Falha: Supabase não configurado no servidor Next (.env.local).");
    console.error(
      "  Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY e reinicie `npm run dev`.",
    );
    exitCode = 1;
  } else if (outcome === "auth") {
    console.error("Falha: credenciais inválidas ou Supabase recusou o login.");
    console.error("  Crie o usuário com `npm run create:dev-user` ou use /registro.");
    exitCode = 1;
  } else {
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 1200) ?? "");
    console.error("Timeout aguardando /dashboard ou /onboarding.");
    console.error("  URL atual:", finalUrl);
    console.error("  Conteúdo (trecho):", bodyText.replace(/\s+/g, " ").trim());
    exitCode = 1;
  }
} catch (err) {
  console.error("Falha no teste de login:", err instanceof Error ? err.message : err);
  exitCode = 1;
} finally {
  await browser.close();
}

process.exit(exitCode);
