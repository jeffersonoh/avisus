#!/usr/bin/env node
/**
 * Controla o Vite em segundo plano: grava PID em .run/vite-dev.pid
 * Uso: node scripts/vite-ctl.mjs start|stop|restart [-- flags do vite]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const runDir = path.join(root, ".run");
const pidPath = path.join(runDir, "vite-dev.pid");
const logPath = path.join(runDir, "vite-dev.log");

const sub = process.argv[2];
const viteExtraArgs = process.argv.slice(3);

function readPid() {
  if (!fs.existsSync(pidPath)) return null;
  const raw = fs.readFileSync(pidPath, "utf8").trim();
  const pid = Number(raw);
  return Number.isFinite(pid) && pid > 0 ? pid : null;
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function start() {
  const existing = readPid();
  if (existing && isAlive(existing)) {
    console.error(`Servidor já em execução (PID ${existing}). Use: npm run stop ou npm run restart`);
    process.exit(1);
  }
  if (existing) fs.unlinkSync(pidPath);

  const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
  if (!fs.existsSync(viteBin)) {
    console.error("Vite não encontrado. Execute npm install na raiz do projeto.");
    process.exit(1);
  }

  fs.mkdirSync(runDir, { recursive: true });
  const logFd = fs.openSync(logPath, "a");
  fs.writeSync(logFd, `\n--- ${new Date().toISOString()} vite ---\n`);

  const child = spawn(process.execPath, [viteBin, ...viteExtraArgs], {
    cwd: root,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env },
  });

  fs.closeSync(logFd);
  child.unref();
  fs.writeFileSync(pidPath, String(child.pid), "utf8");
  console.log(`Vite iniciado em segundo plano (PID ${child.pid}).`);
  console.log("URL padrão: http://localhost:5173/");
  console.log(`Logs: ${path.relative(root, logPath) || logPath}`);
  console.log("Encerre com: npm run stop");
}

function stop() {
  const pid = readPid();
  if (!pid) {
    console.log("Nenhum servidor registrado (.run/vite-dev.pid ausente).");
    return;
  }
  if (!isAlive(pid)) {
    fs.unlinkSync(pidPath);
    console.log(`PID ${pid} não estava ativo; registro removido.`);
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
    console.log(`SIGTERM enviado ao PID ${pid}.`);
  } catch (e) {
    console.error(e.message);
    return;
  }
  fs.unlinkSync(pidPath);
}

async function restart() {
  stop();
  await delay(500);
  start();
}

async function main() {
  if (sub === "start") {
    start();
  } else if (sub === "stop") {
    stop();
  } else if (sub === "restart") {
    await restart();
  } else {
    console.error("Uso: node scripts/vite-ctl.mjs <start|stop|restart> [args extras do vite]");
    process.exit(1);
  }
}

main();
