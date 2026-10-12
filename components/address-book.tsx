"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAddresses, saveAddress } from "@/app/account/addresses/actions";
import { addressFields, type Address } from "@/lib/addresses";

export function AddressBook({
  onSelect,
}: {
  onSelect?: (address: Address) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAddresses();
      setAddresses(result.addresses);
      setError(result.error ?? null);
    } catch {
      setError("Unable to load addresses. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    setSaving(true);
    setError(null);
    setMessage("");
    try {
      const result = await saveAddress(new FormData(form));
      if (result.error) setError(result.error);
      else if (result.address) {
        setAddresses((current) => [...current, result.address!]);
        form.reset();
        setMessage("Address saved.");
      }
    } catch {
      setError("Unable to save this address. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="card mt-6 p-6" aria-labelledby="addresses-heading">
      <h2 id="addresses-heading" className="text-xl font-bold">
        Saved addresses
      </h2>
      {loading && (
        <p role="status" className="mt-4">
          Loading addresses…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}{" "}
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void load()}
            className="underline"
          >
            Retry loading
          </button>
        </p>
      )}
      <p role="status" className="mt-2 text-green-700">
        {message}
      </p>
      {!loading && !error && !addresses.length && (
        <p className="muted mt-4">You have no saved addresses.</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <div key={address.id} className="rounded-xl border p-4">
            <p className="font-bold">
              {address.full_name}
              {address.is_default ? " · Default" : ""}
            </p>
            <p>{address.address_line_1}</p>
            {address.address_line_2 && <p>{address.address_line_2}</p>}
            <p>
              {[address.city, address.state, address.postal_code]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p>{address.country}</p>
            <p>{address.phone}</p>
            {onSelect && (
              <button
                type="button"
                className="btn btn-secondary mt-3"
                onClick={() => {
                  onSelect(address);
                  setMessage("Shipping address selected.");
                }}
              >
                Use this address
              </button>
            )}
          </div>
        ))}
      </div>
      {onSelect ? (
        <Link
          href="/account#addresses"
          className="mt-4 inline-block font-bold text-blue-600"
        >
          Add an address in your account
        </Link>
      ) : (
        <form onSubmit={save} className="mt-6">
          <h3 className="font-bold">Add an address</h3>
          <fieldset
            disabled={saving}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            {addressFields.map(([key, label, required]) => (
              <label key={key} className="grid gap-2 text-sm font-bold">
                {label}
                {!required && " (optional)"}
                <input
                  className="input font-normal"
                  name={key}
                  type={key === "phone" ? "tel" : "text"}
                  required={required}
                  maxLength={500}
                  defaultValue={key === "country" ? "Pakistan" : ""}
                />
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            disabled={saving || loading}
            className="btn btn-primary mt-4"
          >
            {saving ? "Saving…" : "Save address"}
          </button>
        </form>
      )}
    </section>
  );
}
