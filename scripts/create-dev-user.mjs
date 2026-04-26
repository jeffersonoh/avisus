/**
 * Cria um usuário de desenvolvimento com e-mail já confirmado.
 *
 * Requisitos no .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (nunca exponha no cliente; só scripts locais/CI)
 *
 * Uso:
 *   npm run create:dev-user
 *
 * Variáveis opcionais:
 *   DEV_USER_EMAIL, DEV_USER_PASSWORD, DEV_USER_NAME
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEV_USER_EMAIL ?? "dev@avisus.local";
const password = process.env.DEV_USER_PASSWORD ?? "AvisusDev2026!";
const name = process.env.DEV_USER_NAME ?? "Desenvolvedor";

if (!url || !serviceKey) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local (copie de .env.local.example).",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("DEV_USER_PASSWORD deve ter pelo menos 8 caracteres (mesmo limite do cadastro).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name },
});

if (error) {
  if (error.message?.toLowerCase().includes("already") || error.code === "email_exists") {
    console.log(`Usuário já existe: ${email}`);
    console.log("Acesse http://localhost:3000/login e entre com essa conta.");
    process.exit(0);
  }
  console.error("Falha ao criar usuário:", error.message);
  process.exit(1);
}

console.log("Usuário criado com sucesso.");
console.log(`  E-mail: ${data.user?.email ?? email}`);
if (process.env.DEV_USER_PASSWORD) {
  console.log("  Senha: a que você definiu em DEV_USER_PASSWORD.");
} else {
  console.log("  Senha padrão: AvisusDev2026! (defina DEV_USER_PASSWORD para outra)");
}
console.log("Acesse http://localhost:3000/login para entrar.");
