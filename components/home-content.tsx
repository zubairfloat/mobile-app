"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Truck,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import type { CatalogCategory, Product } from "@/lib/types";
import { EmptyState } from "@/components/ui";
import { ProductGrid } from "@/components/product-card";
const benefits = [
  { Icon: Truck, title: "Fast delivery", detail: "Free over $75" },
  { Icon: ShieldCheck, title: "Premium quality", detail: "Built to last" },
  { Icon: CreditCard, title: "Secure payments", detail: "Protected checkout" },
  { Icon: RotateCcw, title: "Easy returns", detail: "30-day returns" },
];
export function HomeContent({
  categories,
  products,
}: {
  categories: CatalogCategory[];
  products: Product[];
}) {
  return (
    <>
      <section className="relative min-h-[680px] overflow-hidden bg-[#edf2f8]">
        <Image
          unoptimized
          src="/hero-accessories.png"
          alt="Premium mobile accessories"
          fill
          priority
          className="object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#edf2f8] via-[#edf2f8]/80 to-transparent" />
        <div className="relative container flex min-h-[680px] items-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl"
          >
            <p className="eyebrow">Designed to keep up</p>
            <h1 className="mt-4 text-6xl leading-[.96] font-black tracking-[-.06em] sm:text-8xl">
              Power Your
              <br />
              Everyday.
            </h1>
            <p className="muted mt-6 max-w-md text-lg leading-relaxed">
              Elevated essentials engineered to charge faster, protect better,
              and sound incredible.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn btn-primary" href="/products">
                Shop Now <ArrowRight size={18} />
              </Link>
              <a className="btn btn-secondary" href="#categories">
                Explore Categories
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      <section id="categories" className="section">
        <div className="container">
          <p className="eyebrow">Find your essential</p>
          <h2 className="mt-2 mb-8 text-4xl font-black tracking-tight">
            Shop by category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((c) => (
              <motion.div key={c.name} whileHover={{ y: -6 }}>
                <Link
                  href={`/products?category=${encodeURIComponent(c.slug)}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-slate-100"
                >
                  <Image
                    unoptimized
                    src={c.image}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                  <p className="absolute bottom-5 left-5 font-bold text-white">
                    {c.name}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="section bg-[#f7f8fa]">
        <div className="container">
          <p className="eyebrow">Customer favorites</p>
          <h2 className="mt-2 mb-9 text-4xl font-black">Featured products</h2>
          {products.length ? (
            <ProductGrid products={products.slice(0, 8)} />
          ) : (
            <EmptyState
              title="No products available yet"
              text="Please check back soon."
            />
          )}
          <div className="mt-10 text-center">
            <Link href="/products" className="btn btn-secondary">
              View all products <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="overflow-hidden rounded-[36px] bg-blue-600 px-8 py-14 text-white md:px-16">
            <p className="text-sm font-bold tracking-widest text-blue-200 uppercase">
              One cable. Every device.
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-black md:text-5xl">
              Less waiting. More doing.
            </h2>
            <p className="mt-4 text-blue-100">
              Save 20% on our charging collection this week.
            </p>
            <Link
              href="/products?category=Chargers"
              className="btn mt-7 bg-white text-black"
            >
              Shop power
            </Link>
          </div>
        </div>
      </section>
      <section className="section pt-0">
        <div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ Icon, title, detail }) => (
            <div className="card p-6" key={title}>
              <Icon className="text-blue-600" />
              <p className="mt-4 font-bold">{title}</p>
              <p className="muted mt-1 text-sm">{detail}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section bg-[#f1f4f8]">
        <div className="container text-center">
          <p className="eyebrow">Stay in the loop</p>
          <h2 className="mt-2 text-4xl font-black">
            Better tech, straight to your inbox.
          </h2>
          <p className="muted mx-auto mt-3 max-w-lg">
            New drops, useful tips and members-only offers. No clutter.
          </p>
          <form
            className="mx-auto mt-7 flex max-w-lg gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              className="input"
              type="email"
              required
              placeholder="you@example.com"
              aria-label="Email address"
            />
            <button className="btn btn-primary">Subscribe</button>
          </form>
        </div>
      </section>
    </>
  );
}
