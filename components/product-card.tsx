"use client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { Price, Rating } from "./ui";
import { useStore } from "./store-provider";
export function ProductCard({ product }: { product: Product }) {
  const { add, busy, loading } = useStore();
  return (
    <motion.article layout whileHover={{ y: -5 }} className="group">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#f4f5f7]">
        <Link href={`/products/${product.slug}`}>
          <Image
            unoptimized
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 50vw,25vw"
          />
        </Link>
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow">
            {product.badge}
          </span>
        )}
        <button
          onClick={() => add(product)}
          disabled={product.stock <= 0 || busy || loading}
          aria-label={`Add ${product.title} to cart`}
          className="absolute right-3 bottom-3 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-black text-white opacity-0 shadow transition group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBag size={18} />
        </button>
      </div>
      <div className="px-1 pt-4">
        <p className="eyebrow">{product.category}</p>
        <Link
          href={`/products/${product.slug}`}
          className="mt-1 block font-bold hover:text-blue-600"
        >
          {product.title}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <Price price={product.price} old={product.originalPrice} />
          {product.rating !== undefined && <Rating value={product.rating} />}
        </div>
      </div>
    </motion.article>
  );
}
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
