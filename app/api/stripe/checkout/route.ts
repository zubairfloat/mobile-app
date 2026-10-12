import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { paymentDatabase, stripeClient } from "@/lib/stripe";

type Product = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
};
export async function POST(request: Request) {
  try {
    const origin = new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
    ).origin;
    if (request.headers.get("origin") !== origin)
      return NextResponse.json(
        { error: "Invalid checkout origin." },
        { status: 403 },
      );
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "Please sign in to pay." },
        { status: 401 },
      );
    const body = await request.json();
    const checkout: Record<string, string> = {};
    for (const key of [
      "email",
      "phone",
      "first",
      "last",
      "address",
      "address2",
      "city",
      "state",
      "zip",
      "country",
    ]) {
      const value = body[key];
      if (
        typeof value !== "string" ||
        value.length > 500 ||
        (!["last", "address2", "state"].includes(key) && !value.trim())
      ) {
        return NextResponse.json(
          { error: "Please complete your contact and shipping information." },
          { status: 400 },
        );
      }
      checkout[key] = value.trim();
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkout.email))
      return NextResponse.json(
        { error: "Enter a valid email." },
        { status: 400 },
      );
    const { data: cart, error } = await supabase
      .from("carts")
      .select(
        "cart_items(quantity, products(id, name, price, stock_quantity, is_active))",
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle<{
        cart_items: { quantity: number; products: Product | null }[];
      }>();
    if (error) throw error;
    if (!cart?.cart_items.length || cart.cart_items.length > 99)
      return NextResponse.json(
        { error: "Please review your cart before paying." },
        { status: 400 },
      );
    const items = cart.cart_items.map(({ quantity, products: p }) => {
      if (
        !p?.is_active ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > p.stock_quantity ||
        !Number.isFinite(Number(p.price)) ||
        Number(p.price) <= 0
      )
        throw new Error("An item is unavailable. Please review your cart.");
      const cents = Math.round(Number(p.price) * 100);
      return {
        product_id: p.id,
        product_name: p.name,
        product_price: cents / 100,
        quantity,
        line_total: (cents * quantity) / 100,
      };
    });
    const subtotal = items.reduce(
      (sum, item) => sum + Math.round(item.line_total * 100),
      0,
    );
    const shipping = subtotal >= 7500 ? 0 : 800;
    const id = crypto.randomUUID();
    const { error: saveError } = await paymentDatabase()
      .from("checkout_drafts")
      .insert({
        id,
        user_id: user.id,
        contact_email: checkout.email,
        items,
        subtotal: subtotal / 100,
        delivery_fee: shipping / 100,
        total_amount: (subtotal + shipping) / 100,
        shipping_address: {
          full_name: `${checkout.first} ${checkout.last}`.trim(),
          phone: checkout.phone,
          address_line_1: checkout.address,
          address_line_2: checkout.address2,
          city: checkout.city,
          state: checkout.state,
          postal_code: checkout.zip,
          country: checkout.country,
        },
      });
    if (saveError) throw saveError;
    const session = await stripeClient().checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        client_reference_id: user.id,
        customer_email: checkout.email,
        metadata: { checkout_id: id, integration: "pulse-orders" },
        line_items: [
          ...items.map((item) => ({
            quantity: item.quantity,
            price_data: {
              currency: "usd",
              unit_amount: Math.round(item.product_price * 100),
              product_data: { name: item.product_name },
            },
          })),
          ...(shipping
            ? [
                {
                  quantity: 1,
                  price_data: {
                    currency: "usd",
                    unit_amount: shipping,
                    product_data: { name: "Express delivery" },
                  },
                },
              ]
            : []),
        ],
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout?cancelled=1`,
      },
      { idempotencyKey: id },
    );
    if (!session.url) throw new Error("No payment URL returned.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(
      "Stripe checkout failed",
      error instanceof Error ? error.message : "Database error",
    );
    return NextResponse.json(
      {
        error:
          "Unable to start payment. Your cart is unchanged. Please try again.",
      },
      { status: 500 },
    );
  }
}
