"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { CreditCard } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { AddressBook } from "@/components/address-book";
import type { Address } from "@/lib/addresses";
const Field = ({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) => (
  <label className="grid gap-2 text-sm font-bold">
    {label}
    <input
      className="input font-normal"
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
    />
  </label>
);
export default function Checkout() {
  const formRef = useRef<HTMLFormElement>(null);
  function selectAddress(address: Address) {
    const values = {
      first: address.full_name.split(" ")[0],
      last: address.full_name.split(" ").slice(1).join(" "),
      phone: address.phone,
      address: address.address_line_1,
      address2: address.address_line_2 ?? "",
      city: address.city,
      state: address.state ?? "",
      zip: address.postal_code,
      country: address.country,
    };
    for (const [name, value] of Object.entries(values)) {
      const input = formRef.current?.elements.namedItem(name);
      if (input instanceof HTMLInputElement) input.value = value;
    }
  }
  const s = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked.current || s.busy || s.loading || !s.items.length) return;
    locked.current = true;
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const checkout: Record<string, string> = {};
      for (const field of [
        "email",
        "phone",
        "first",
        "last",
        "address",
        "address2",
        "city",
        "state",
        "country",
        "zip",
      ]) {
        checkout[field] = String(form.get(field) ?? "").trim();
      }
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkout),
      });
      const result = await response.json();
      if (!response.ok || !result.url)
        throw new Error(result.error || "Unable to start payment.");
      window.location.assign(result.url);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to place your order. Please retry.",
      );
    } finally {
      locked.current = false;
      setSubmitting(false);
    }
  }
  return (
    <div className="section container">
      <h1 className="text-5xl font-black">Checkout</h1>
      <form
        ref={formRef}
        onSubmit={submit}
        className="mt-9 grid gap-10 lg:grid-cols-[1fr_400px]"
      >
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-xl font-bold">1. Contact information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="you@example.com"
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                placeholder="+1 555 000 0000"
              />
            </div>
          </section>
          <section className="card p-6">
            <h2 className="text-xl font-bold">2. Shipping address</h2>
            <AddressBook onSelect={selectAddress} />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="First name" name="first" />
              <Field label="Last name" name="last" required={false} />
              <div className="sm:col-span-2">
                <Field label="Address" name="address" />
              </div>
              <Field label="Address line 2" name="address2" required={false} />
              <Field label="City" name="city" />
              <Field label="State / Province" name="state" required={false} />
              <Field label="Country" name="country" />
              <Field label="Postal code" name="zip" />
            </div>
          </section>
          <section className="card p-6">
            <h2 className="text-xl font-bold">3. Delivery method</h2>
            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border-2 border-blue-600 p-4">
              <span>
                <b>Express delivery</b>
                <span className="muted block text-sm">2–4 business days</span>
              </span>
              <b>{s.total >= 75 ? "Free" : "$8"}</b>
            </label>
          </section>
          <section className="card p-6">
            <h2 className="text-xl font-bold">4. Payment method</h2>
            <p className="muted mt-4 text-sm">
              <CreditCard className="mr-2 inline" size={18} />
              Pay securely with Stripe. Enter your card details on the next
              page. Your order is confirmed after payment succeeds.
            </p>
          </section>
        </div>
        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold">Your order</h2>
          <div className="mt-5 space-y-4">
            {s.items.map((i) => (
              <div className="flex items-center gap-3" key={i.product.id}>
                <Image
                  src={i.product.image}
                  alt=""
                  width={54}
                  height={54}
                  className="rounded-xl object-cover"
                />
                <p className="flex-1 text-sm font-bold">
                  {i.product.title} <span className="muted">×{i.quantity}</span>
                </p>
                <b className="text-sm">
                  ${(i.product.price * i.quantity).toFixed(2)}
                </b>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between border-t pt-5 text-lg">
            <b>Total</b>
            <b>${(s.total + (s.total >= 75 ? 0 : 8)).toFixed(2)}</b>
          </div>
          {(error || s.error) && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error || s.error}
            </p>
          )}
          <button
            className="btn btn-primary mt-6 w-full"
            disabled={
              !s.items.length || s.busy || s.loading || !!s.error || submitting
            }
          >
            {submitting ? "Opening Stripe…" : "Pay with Stripe"}
          </button>
        </aside>
      </form>
    </div>
  );
}
