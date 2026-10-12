import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { orderClient, money, statusLabel, type Order } from "@/lib/orders";

export default async function Orders() {
  const { supabase, user } = await orderClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, created_at, status, payment_status, total_amount",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load your orders. Please try again.");
  const orders = data as Pick<
    Order,
    | "id"
    | "order_number"
    | "created_at"
    | "status"
    | "payment_status"
    | "total_amount"
  >[];
  return (
    <AccountShell active="Orders" email={user.email}>
      <div>
        <p className="eyebrow">Order history</p>
        <h1 className="mt-2 text-4xl font-black">Your orders</h1>
        <div className="mt-8 space-y-4">
          {orders.length === 0 && (
            <div className="card p-6">
              <p>You haven’t placed any orders yet.</p>
              <Link className="btn btn-primary mt-4" href="/products">
                Start shopping
              </Link>
            </div>
          )}
          {orders.map((order) => (
            <article
              className="card flex flex-wrap items-center justify-between gap-5 p-6"
              key={order.id}
            >
              <div>
                <b className="break-all">#{order.order_number}</b>
                <p className="muted text-sm">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })}
                </p>
              </div>
              <span className="pill bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 capitalize">
                {statusLabel(order.status)}
              </span>
              <b>{money(order.total_amount)}</b>
              <Link
                className="btn btn-secondary py-2 text-sm"
                href={`/order-confirmation?order=${order.id}`}
              >
                View details
              </Link>
            </article>
          ))}
        </div>
      </div>
    </AccountShell>
  );
}
