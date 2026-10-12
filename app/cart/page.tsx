"use client";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { EmptyState, QuantitySelector } from "@/components/ui";
export default function Cart() {
  const s = useStore();
  if (s.loading)
    return (
      <div className="section container" role="status">
        Loading your cart…
      </div>
    );
  if (s.error)
    return (
      <div className="section container" role="alert">
        {s.error} <button onClick={() => void s.refresh()}>Retry</button>{" "}
        <Link href="/login">Sign in</Link>
      </div>
    );
  if (!s.items.length)
    return (
      <div className="section container">
        <EmptyState
          title="Your cart is empty"
          text="Explore our latest accessories and find your new everyday essential."
          action={
            <Link className="btn btn-primary" href="/products">
              Browse products
            </Link>
          }
        />
      </div>
    );
  return (
    <div className="section container">
      <h1 className="text-5xl font-black">Your cart</h1>
      <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {s.items.map((i) => (
            <article key={i.product.id} className="card flex gap-5 p-4 sm:p-6">
              <Image
                src={i.product.image}
                alt={i.product.title}
                width={130}
                height={130}
                className="h-28 w-28 rounded-2xl object-cover sm:h-32 sm:w-32"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-bold sm:text-lg">{i.product.title}</h2>
                    {i.color && (
                      <p className="muted mt-1 text-sm">Color: {i.color}</p>
                    )}
                  </div>
                  <button
                    disabled={s.busy || s.loading}
                    aria-label="Remove item"
                    onClick={() => s.remove(i.product.id)}
                  >
                    <Trash2 size={19} />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between">
                  <QuantitySelector
                    disabled={s.busy || s.loading}
                    max={i.product.stock}
                    value={i.quantity}
                    onChange={(q) => s.update(i.product.id, q)}
                  />
                  <b>${(i.product.price * i.quantity).toFixed(2)}</b>
                </div>
              </div>
            </article>
          ))}
        </div>
        <aside className="card h-fit p-7">
          <h2 className="text-xl font-bold">Order summary</h2>
          <div className="mt-6 grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="muted">Subtotal</span>
              <b>${s.total.toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span className="muted">Delivery estimate</span>
              <b>{s.total >= 75 ? "Free" : "$8.00"}</b>
            </div>
            <div className="flex justify-between">
              <span className="muted">Discount</span>
              <span>—</span>
            </div>
            <div className="flex justify-between border-t pt-4 text-lg">
              <b>Order total</b>
              <b>${(s.total + (s.total >= 75 ? 0 : 8)).toFixed(2)}</b>
            </div>
          </div>
          <Link href="/checkout" className="btn btn-primary mt-6 w-full">
            Proceed to Checkout
          </Link>
          <Link href="/products" className="btn btn-secondary mt-3 w-full">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
