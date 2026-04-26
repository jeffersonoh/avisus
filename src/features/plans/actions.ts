"use server";

import Stripe from "stripe";
import { z } from "zod";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { createServerClient } from "@/lib/supabase/server";

const checkoutPlanSchema = z.enum(["starter", "pro"]);

export type CheckoutActionResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }

  return new Stripe(key);
}

function getPriceIdByPlan(plan: "starter" | "pro"): string | null {
  if (plan === "starter") {
    return process.env.STRIPE_PRICE_STARTER_MONTHLY ?? null;
  }
  return process.env.STRIPE_PRICE_PRO_MONTHLY ?? null;
}

export async function createCheckoutSession(rawPlan: string): Promise<CheckoutActionResult> {
  try {
    const parsedPlan = checkoutPlanSchema.safeParse(rawPlan);
    if (!parsedPlan.success) {
      return { ok: false, error: "Plano inválido para checkout." };
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return { ok: false, error: "Stripe não configurado no ambiente." };
    }

    const priceId = getPriceIdByPlan(parsedPlan.data);
    if (!priceId) {
      return { ok: false, error: "Price ID do plano não configurado." };
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Faça login para iniciar o checkout." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, plan")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return { ok: false, error: "Perfil de usuário não encontrado." };
    }

    if (profile.plan === "pro") {
      return { ok: false, error: "Você já está no plano PRO." };
    }

    const { data: latestSubscription } = await supabase
      .from("subscriptions")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let stripeCustomerId = latestSubscription?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.name?.trim() || undefined,
        metadata: {
          user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await supabase.from("subscriptions").insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        plan: profile.plan,
        status: "pending_checkout",
      });
    }

    const origin = await getAppOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/planos?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        target_plan: parsedPlan.data,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          target_plan: parsedPlan.data,
        },
      },
    });

    if (!session.url) {
      return { ok: false, error: "Não foi possível iniciar o checkout do Stripe." };
    }

    return { ok: true, checkoutUrl: session.url };
  } catch {
    return { ok: false, error: "Não foi possível iniciar o checkout do Stripe." };
  }
}
