/**
 * Dump do HTML da listagem ML para inspeção da estrutura atual.
 * Uso: npm run ml:dump -- "iphone 15"
 */

import { writeFileSync } from "node:fs";

import { fetchScrapingBeeHtml } from "../src/lib/scanner/scraping-bee.ts";

const term = process.argv.slice(2).join(" ").trim() || "iphone 15";
const slug = term
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const html = await fetchScrapingBeeHtml(`https://lista.mercadolivre.com.br/${slug}`, {
  timeoutMs: 20000,
  renderJs: false,
  premiumProxy: true,
  countryCode: "br",
});

const outPath = `/tmp/ml-${slug}.html`;
writeFileSync(outPath, html);
console.log(`HTML salvo em ${outPath} (${html.length} bytes)`);
