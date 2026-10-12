"use client";
import Image from "next/image";
import { Check, Heart, RotateCcw, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { Price, QuantitySelector, Rating } from "@/components/ui";
import { ProductGrid } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [q, setQ] = useState(1);
  const [wish, setWish] = useState(false);
  const [added, setAdded] = useState(false);
  const s = useStore();
  const add = async () => {
    if (product.stock <= 0) return;
    if (!(await s.add(product, color, Math.min(q, product.stock))))
      return false;
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    return true;
  };
  return (
    <>
      <div className="section container">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-[36px] bg-slate-100">
              <Image
                unoptimized
                src={product.image}
                alt={product.title}
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((x) => (
                <div
                  key={x}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100"
                >
                  <Image
                    unoptimized
                    src={product.image}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:py-8">
            <p className="eyebrow">{product.category}</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight">
              {product.title}
            </h1>
            <div className="mt-4 flex gap-3">
              {product.rating !== undefined && (
                <Rating value={product.rating} reviews={product.reviews} />
              )}
              <span className="text-sm">
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : "Out of stock"}
              </span>
            </div>
            <div className="mt-6">
              <Price price={product.price} old={product.originalPrice} />
            </div>
            <p className="muted mt-7 leading-relaxed">{product.description}</p>
            <ul className="mt-6 grid gap-3">
              {product.features.map((f) => (
                <li className="flex items-center gap-2 text-sm" key={f}>
                  <Check size={17} className="text-blue-600" />
                  {f}
                </li>
              ))}
            </ul>
            {product.colors.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-sm font-bold">Color — {color}</p>
                <div className="flex gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`pill border px-4 py-2 text-sm ${color === c ? "border-black bg-black text-white" : "border-[var(--line)]"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <QuantitySelector
                value={q}
                onChange={(value) =>
                  setQ(Math.min(value, Math.max(1, product.stock)))
                }
              />
              <button
                disabled={product.stock <= 0 || s.busy || s.loading}
                onClick={add}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                Add to Cart
              </button>
              <button
                disabled={product.stock <= 0 || s.busy || s.loading}
                onClick={async () => {
                  if (await add()) {
                    s.setOpen(false);
                    location.href = "/checkout";
                  }
                }}
                className="btn flex-1 bg-blue-600 text-white"
              >
                Buy Now
              </button>
              <button
                onClick={() => setWish(!wish)}
                aria-label="Toggle wishlist"
                className={`grid h-12 w-12 place-items-center rounded-full border ${wish ? "bg-red-50 text-red-500" : ""}`}
              >
                <Heart fill={wish ? "currentColor" : "none"} />
              </button>
            </div>
            <AnimatePresence>
              {added && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-sm font-bold text-green-700"
                >
                  ✓ Added to your cart
                </motion.p>
              )}
            </AnimatePresence>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="card flex gap-3 p-5">
                <Truck />
                <div>
                  <b>Free delivery</b>
                  <p className="muted text-sm">Arrives in 2–4 days</p>
                </div>
              </div>
              <div className="card flex gap-3 p-5">
                <RotateCcw />
                <div>
                  <b>Easy returns</b>
                  <p className="muted text-sm">30 days, no stress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section bg-slate-50">
          <div className="container">
            <h2 className="mb-8 text-3xl font-black">You may also like</h2>
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </>
  );
}
