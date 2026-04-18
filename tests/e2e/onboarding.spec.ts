import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  process.env.E2E_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@avisus.test`;
}

async function deleteUserByEmail(email: string) {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await admin.auth.admin.listUsers();
  const user = data?.users.find((u) => u.email === email);
  if (user) {
    await admin.auth.admin.deleteUser(user.id);
  }
}

test.describe("smoke: cadastro → onboarding → dashboard", () => {
  let testEmail: string;
  const testPassword = "AvisusE2E2026!";

  test.beforeEach(() => {
    testEmail = uniqueEmail();
  });

  test.afterEach(async () => {
    await deleteUserByEmail(testEmail);
  });

  test("happy path completes in under 2 minutes", async ({ page }) => {
    // Mock IBGE API so the test doesn't depend on an external service
    await page.route("**/servicodados.ibge.gov.br/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { nome: "São Paulo" },
          { nome: "Campinas" },
          { nome: "Guarulhos" },
        ]),
      });
    });

    // ── 1. Register ──────────────────────────────────────────────
    await page.goto("/registro");
    await page.fill("#register-email", testEmail);
    await page.fill("#register-password", testPassword);
    await page.click('button[type="submit"]:has-text("Criar conta")');

    await page.waitForURL("**/onboarding**", { timeout: 15_000 });

    // ── 2. Onboarding Step 1: interests ──────────────────────────
    await page.fill('input[placeholder*="Parafusadeira"]', "Furadeira Bosch");
    await page.press('input[placeholder*="Parafusadeira"]', "Enter");

    // Wait for "X/N selecionados: ..." confirmation box to appear
    await expect(page.getByText(/selecionados?:/)).toBeVisible({ timeout: 10_000 });

    await page.click('button:has-text("Próximo")');

    // ── 3. Onboarding Step 2: region ─────────────────────────────
    await page.waitForFunction(() => {
      const selects = document.querySelectorAll("select");
      return selects.length >= 2;
    });

    await page.selectOption('select', { label: "SP" });

    // Wait for city select to be populated (IBGE mock fires)
    await page.waitForFunction(() => {
      const selects = Array.from(document.querySelectorAll("select"));
      return selects.some((s) => s.options.length > 1 && s !== selects[0]);
    }, undefined, { timeout: 5_000 });

    const citySelect = page.locator("select").nth(1);
    await citySelect.selectOption({ label: "São Paulo" });

    await page.click('button:has-text("Próximo")');

    // ── 4. Onboarding Step 3: channels + LGPD ────────────────────
    await page.check('input[type="checkbox"]');
    await expect(page.locator('input[type="checkbox"]')).toBeChecked();

    await page.click('button:has-text("Começar a monitorar")');

    // ── 5. Dashboard ─────────────────────────────────────────────
    await page.waitForURL("**/dashboard**", { timeout: 15_000 });

    await expect(page).toHaveURL(/\/dashboard/);
    // Dashboard renders: either the empty-state box or the opportunity grid (with at least one card)
    const emptyState = page.getByText("Nenhuma oportunidade", { exact: false });
    const opportunityGrid = page.locator(".grid").filter({ hasText: /[A-Z]/ }).first();
    await expect(emptyState.or(opportunityGrid)).toBeVisible({ timeout: 10_000 });
  });
});
