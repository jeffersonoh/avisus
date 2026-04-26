// Lista alertas do usuário dev@avisus.local direto do Supabase local.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local.");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: auth } = await supabase.auth.admin.listUsers();
const match = auth.users.find((u) => u.email === "dev@avisus.local");
if (!match) {
  console.error("Usuário dev@avisus.local não encontrado.");
  process.exit(1);
}

const { data: profile } = await supabase
  .from("profiles")
  .select("id, plan, alert_channels, silence_start, silence_end")
  .eq("id", match.id)
  .maybeSingle();

const user = { id: match.id, ...profile };

const { data: alerts, count } = await supabase
  .from("alerts")
  .select("id, channel, status, created_at, sent_at, opportunity_id", { count: "exact" })
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(5);

console.log("User:", user);
console.log("Total alerts:", count);
console.log("Sample:", alerts);

const byStatus = await supabase
  .from("alerts")
  .select("status", { count: "exact", head: false })
  .eq("user_id", user.id);

const stats = {};
for (const row of byStatus.data ?? []) {
  stats[row.status] = (stats[row.status] ?? 0) + 1;
}
console.log("Por status:", stats);
