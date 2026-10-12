import "server-only";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("Stripe is not configured.");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
export function paymentDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Payment database is not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function hasCheckoutSnapshot(session: Stripe.Checkout.Session) {
  return (
    ["pulse-orders", "ecom-shipping-checkout"].includes(
      session.metadata?.integration ?? "",
    ) && Boolean(session.metadata?.checkout_id)
  );
}
export async function completePayment(session: Stripe.Checkout.Session) {
  if (
    session.mode !== "payment" ||
    session.status !== "complete" ||
    session.payment_status !== "paid" ||
    !hasCheckoutSnapshot(session) ||
    !session.metadata?.checkout_id ||
    !session.client_reference_id
  ) {
    throw new Error("Payment has not been verified.");
  }
  const { data, error } = await paymentDatabase().rpc(
    "complete_paid_checkout",
    {
      checkout_id: session.metadata.checkout_id,
      customer_id: session.client_reference_id,
      session_id: session.id,
      amount_cents: session.amount_total,
      currency_code: session.currency,
      intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    },
  );
  if (error || typeof data !== "string") {
    console.error("Paid order settlement failed", {
      sessionId: session.id,
      code: error?.code,
      message: error?.message,
    });
    throw new Error("Unable to save the paid order.");
  }
  return data;
}
