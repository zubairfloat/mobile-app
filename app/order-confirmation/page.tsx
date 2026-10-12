import Link from "next/link";
import { notFound } from "next/navigation";
import { orderClient, money, statusLabel, type Order } from "@/lib/orders";

export default async function Confirmation({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: id } = await searchParams;
  if (!id)
    return (
      <div className="section container max-w-3xl">
        <h1 className="text-4xl font-black">No order to confirm</h1>
        <p role="alert" className="muted mt-4">
          This page was opened without an order reference. Check your order
          history before submitting again. If no order appears, refresh checkout
          and submit your order.
        </p>
        <div className="mt-6 flex gap-4">
          <Link className="btn btn-primary" href="/orders">
            Your orders
          </Link>
          <Link className="btn btn-secondary" href="/checkout">
            Return to checkout
          </Link>
        </div>
      </div>
    );
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  const { supabase, user } = await orderClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, created_at, status, payment_status, subtotal, delivery_fee, total_amount, contact_email, shipping_address, order_items(id, product_name, product_price, quantity, line_total)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<Order>();
  if (error) throw new Error("Unable to load this order. Please try again.");
  if (!data) notFound();
  const address = data.shipping_address;
  return (
    <div className="section container max-w-3xl">
      <p className="eyebrow break-all">Order #{data.order_number}</p>
      <h1 className="mt-3 text-4xl font-black">Your order details</h1>
      <div className="card mt-8 space-y-4 p-6">
        <div className="flex justify-between">
          <span>Status</span>
          <b className="capitalize">{statusLabel(data.status)}</b>
        </div>
        <div className="flex justify-between">
          <span>Payment</span>
          <b className="capitalize">{statusLabel(data.payment_status)}</b>
        </div>
        {data.contact_email && <p className="muted">{data.contact_email}</p>}
        {address && (
          <div>
            <h2 className="font-bold">Shipping address</h2>
            {[
              "full_name",
              "address_line_1",
              "address_line_2",
              "city",
              "state",
              "postal_code",
              "country",
              "phone",
            ].map((key) =>
              address[key] ? (
                <p key={key} className="muted">
                  {address[key]}
                </p>
              ) : null,
            )}
          </div>
        )}
      </div>
      <div className="card mt-5 space-y-4 p-6">
        <h2 className="text-xl font-bold">Items</h2>
        {data.order_items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4">
            <span>
              {item.product_name} × {item.quantity}
              <span className="muted block text-sm">
                {money(item.product_price)} each
              </span>
            </span>
            <b>{money(item.line_total)}</b>
          </div>
        ))}
        <div className="flex justify-between border-t pt-4">
          <span>Subtotal</span>
          <b>{money(data.subtotal)}</b>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <b>{money(data.delivery_fee)}</b>
        </div>
        <div className="flex justify-between text-lg">
          <span>Total</span>
          <b>{money(data.total_amount)}</b>
        </div>
      </div>
      <div className="mt-8 flex gap-4">
        <Link className="btn btn-primary" href="/orders">
          Your orders
        </Link>
        <Link className="btn btn-secondary" href="/products">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
