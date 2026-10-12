"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2 } from "lucide-react";
import { useStore } from "./store-provider";
import { QuantitySelector } from "./ui";
export function CartDrawer() {
  const s = useStore();
  return (
    <AnimatePresence>
      {s.open && (
        <>
          <motion.button
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => s.setOpen(false)}
            className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28 }}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Your cart ({s.count})</h2>
              <button onClick={() => s.setOpen(false)} className="p-2">
                <X />
              </button>
            </div>
            {s.error && (
              <p role="alert" className="mt-4 text-red-600">
                {s.error}{" "}
                <Link href="/login" onClick={() => s.setOpen(false)}>
                  Sign in
                </Link>{" "}
                <button
                  disabled={s.busy || s.loading}
                  onClick={() => void s.refresh()}
                >
                  Retry
                </button>
              </p>
            )}
            <div className="mt-6 flex-1 space-y-5 overflow-auto">
              {s.loading ? (
                <p role="status">Loading your cart…</p>
              ) : s.items.length === 0 ? (
                <p className="muted mt-20 text-center">
                  Your cart is waiting for something great.
                </p>
              ) : (
                s.items.map((i) => (
                  <div key={i.product.id} className="flex gap-4">
                    <Image
                      src={i.product.image}
                      alt=""
                      width={80}
                      height={80}
                      className="rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-bold">{i.product.title}</p>
                      <p className="muted text-sm">{i.color}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <QuantitySelector
                          disabled={s.busy || s.loading}
                          max={i.product.stock}
                          value={i.quantity}
                          onChange={(q) => s.update(i.product.id, q)}
                        />
                        <button
                          disabled={s.busy || s.loading}
                          aria-label="Remove"
                          onClick={() => s.remove(i.product.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t pt-5">
              <div className="mb-4 flex justify-between text-lg font-bold">
                <span>Subtotal</span>
                <span>${s.total.toFixed(2)}</span>
              </div>
              <Link
                href="/cart"
                onClick={() => s.setOpen(false)}
                className="btn btn-primary w-full"
              >
                View cart & checkout
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
