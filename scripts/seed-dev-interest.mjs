/**
 * Garante um `interest` ativo para o dev user, para que o scanner tenha algo a processar.
 *
 * Requisitos no .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   npm run seed:dev-interest -- "iphone 15"
 *
 * Variáveis opcionais:
 *   DEV_USER_EMAIL (default: dev@avisus.local)
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEV_USER_EMAIL ?? "dev@avisus.local";
const term = process.argv.slice(2).join(" ").trim() || "iphone 15";

if (!url || !serviceKey) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});

if (listError) {
  console.error("Falha ao listar usuários:", listError.message);
  process.exit(1);
}

const user = usersPage.users.find((candidate) => candidate.email === email);
if (!user) {
  console.error(
    `Usuário "${email}" não encontrado. Rode "npm run create:dev-user" primeiro.`,
  );
  process.exit(1);
}

// Profile é criado pelo trigger on_auth_user_created; apenas confirma.
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, plan, min_discount_pct")
  .eq("id", user.id)
  .maybeSingle();

if (profileError) {
  console.error("Falha ao carregar profile:", profileError.message);
  process.exit(1);
}

if (!profile) {
  console.error(
    `Profile não encontrado para ${email}. Verifique o trigger on_auth_user_created.`,
  );
  process.exit(1);
}

// Upsert via insert + onConflict (uq_interest_user_term ignora casing).
const { data: existing, error: existingError } = await supabase
  .from("interests")
  .select("id, term, active, last_scanned_at")
  .eq("user_id", user.id)
  .ilike("term", term)
  .maybeSingle();

if (existingError) {
  console.error("Falha ao verificar interest existente:", existingError.message);
  process.exit(1);
}

if (existing) {
  const { error: updateError } = await supabase
    .from("interests")
    .update({ active: true, last_scanned_at: null })
    .eq("id", existing.id);

  if (updateError) {
    console.error("Falha ao reativar interest:", updateError.message);
    process.exit(1);
  }

  console.log(`Interest já existia — reativado e last_scanned_at zerado.`);
} else {
  const { error: insertError } = await supabase.from("interests").insert({
    user_id: user.id,
    term,
    active: true,
  });

  if (insertError) {
    console.error("Falha ao inserir interest:", insertError.message);
    process.exit(1);
  }

  console.log("Interest criado.");
}

console.log(`  user:  ${email} (plan=${profile.plan}, min_discount=${profile.min_discount_pct}%)`);
console.log(`  term:  "${term}"`);
console.log("Próximo passo: npm run scan:run");
