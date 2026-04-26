/**
 * Roda o pipeline completo do scanner contra o Supabase local.
 * Mesma lógica do cron `/api/cron/scan`, mas sem a camada HTTP/autenticação.
 *
 * Requisitos no .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SCRAPINGBEE_API_KEY
 *
 * Uso:
 *   npm run scan:run
 */

import { createClient } from "@supabase/supabase-js";

import { runOpportunityMatcher } from "../src/lib/scanner/opportunity-matcher.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("→ Disparando runOpportunityMatcher()…\n");

const startMs = Date.now();
const result = await runOpportunityMatcher({ supabase });
const elapsedMs = Date.now() - startMs;

console.log(`✓ Concluído em ${elapsedMs}ms.\n`);
console.log(result);

const { data: opportunities, error } = await supabase
  .from("opportunities")
  .select(
    "id, marketplace, name, price, original_price, discount_pct, margin_best, margin_best_channel, quality, buy_url, detected_at",
  )
  .eq("status", "active")
  .order("detected_at", { ascending: false })
  .limit(10);

if (error) {
  console.error("\nFalha ao ler oportunidades:", error.message);
  process.exit(1);
}

if (!opportunities || opportunities.length === 0) {
  console.log("\nNenhuma oportunidade ativa persistida.");
  console.log(
    "Confira se há interest ativo (npm run seed:dev-interest), SCRAPINGBEE_API_KEY válida e discount_pct >= min do profile.",
  );
  process.exit(0);
}

console.log(`\nÚltimas ${opportunities.length} oportunidades ativas:`);
console.table(
  opportunities.map((row) => ({
    marketplace: row.marketplace,
    nome: row.name.length > 40 ? `${row.name.slice(0, 37)}…` : row.name,
    preco: `R$ ${Number(row.price).toFixed(2)}`,
    desc: `${Number(row.discount_pct).toFixed(1)}%`,
    margem: row.margin_best !== null ? `${Number(row.margin_best).toFixed(1)}%` : "-",
    canal: row.margin_best_channel ?? "-",
    quality: row.quality ?? "-",
  })),
);
