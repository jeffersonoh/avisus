/**
 * Limpa dados do pipeline do scanner para reprocessamento.
 * Deleta opportunities (cascata para alerts, channel_margins, user_opportunity_status),
 * products (cascata para price_history) e zera last_scanned_at dos interests ativos.
 *
 * Uso:
 *   npm run scan:reset
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: oppError, count: oppCount } = await supabase
  .from("opportunities")
  .delete({ count: "exact" })
  .gt("detected_at", "1900-01-01");
if (oppError) {
  console.error("Falha ao limpar opportunities:", oppError.message);
  process.exit(1);
}

const { error: prodError, count: prodCount } = await supabase
  .from("products")
  .delete({ count: "exact" })
  .gt("created_at", "1900-01-01");
if (prodError) {
  console.error("Falha ao limpar products:", prodError.message);
  process.exit(1);
}

const { error: resetError, count: interestCount } = await supabase
  .from("interests")
  .update({ last_scanned_at: null }, { count: "exact" })
  .eq("active", true);
if (resetError) {
  console.error("Falha ao zerar last_scanned_at:", resetError.message);
  process.exit(1);
}

console.log(
  `Limpeza concluída: ${oppCount} opportunities, ${prodCount} products, ${interestCount} interests resetados.`,
);
console.log("Próximo passo: npm run scan:run");
