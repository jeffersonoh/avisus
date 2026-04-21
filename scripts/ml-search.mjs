/**
 * Smoke test do scanner Mercado Livre via ScrapingBee.
 *
 * Usa o mesmo caminho que `runOpportunityMatcher` usa em produção:
 *   - fetchScrapingBeeHtml(lista.mercadolivre.com.br/<termo>)
 *   - parseMercadoLivreSearchHtml(html) → Product[]
 *
 * Uso:
 *   npm run ml:search -- "fone bluetooth"
 */

import { searchByTerm } from "../src/lib/scanner/mercado-livre.ts";

const term = process.argv.slice(2).join(" ").trim();
if (!term) {
  console.error('Uso: npm run ml:search -- "<termo de busca>"');
  process.exit(1);
}

console.log(`→ Buscando "${term}" no ML via ScrapingBee…\n`);

const startMs = Date.now();
const products = await searchByTerm(term);
const elapsedMs = Date.now() - startMs;

console.log(`✓ ${products.length} produtos em ${elapsedMs}ms.\n`);

if (products.length === 0) {
  console.log(
    "Nenhum resultado. Verifique SCRAPINGBEE_API_KEY e se o layout da listagem ML não mudou.",
  );
  process.exit(0);
}

console.table(
  products.slice(0, 5).map((p) => ({
    id: p.externalId,
    nome: p.name.length > 50 ? `${p.name.slice(0, 47)}…` : p.name,
    preco: `R$ ${p.price.toFixed(2)}`,
    de: p.originalPrice > p.price ? `R$ ${p.originalPrice.toFixed(2)}` : "-",
    desc: `${p.discountPct.toFixed(1)}%`,
    frete: p.freightFree ? "GRÁTIS" : "-",
    vendidos: p.unitsSold ?? "-",
  })),
);
