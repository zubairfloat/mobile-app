import { NextResponse } from "next/server";
import {
  stripeClient,
  completePayment,
  hasCheckoutSnapshot,
} from "@/lib/stripe";
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  let event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") || "",
      secret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (hasCheckoutSnapshot(session) && session.payment_status === "paid") {
      try {
        await completePayment(session);
      } catch {
        return NextResponse.json(
          { error: "Order confirmation failed" },
          { status: 500 },
        );
      }
    }
  }
  return NextResponse.json({ received: true });
}
