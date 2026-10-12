"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { CatalogCategory, Product } from "@/lib/types";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/ui";
export function ProductCatalog({
  categories,
  products,
}: {
  categories: CatalogCategory[];
  products: Product[];
}) {
  const priceLimit = Math.max(1, ...products.map((p) => Math.ceil(p.price)));
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [selectedCategory, setCat] = useState<string | null>(null);
  const cat = selectedCategory ?? sp.get("category") ?? "All";
  const [max, setMax] = useState(priceLimit);
  const [sort, setSort] = useState("Featured");
  const shown = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (cat === "All" ||
              p.category === cat ||
              categories.some(
                (c) => c.slug === cat && c.id === p.categoryId,
              )) &&
            p.price <= max &&
            p.title.toLowerCase().includes(q.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "Price Low to High"
            ? a.price - b.price
            : sort === "Price High to Low"
              ? b.price - a.price
              : sort === "Newest"
                ? (b.createdAt || "").localeCompare(a.createdAt || "")
                : 0,
        ),
    [q, cat, max, sort, products, categories],
  );
  return (
    <div className="section container">
      <p className="eyebrow">Curated essentials</p>
      <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tight">All products</h1>
          <p className="muted mt-2">{shown.length} products</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute top-3.5 left-4" size={19} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-11"
            placeholder="Search products..."
          />
        </div>
      </div>
      <div className="my-8 flex flex-wrap items-center gap-3 border-y border-[var(--line)] py-5">
        <SlidersHorizontal size={18} />
        <button
          onClick={() => setCat("All")}
          className={`pill px-4 py-2 text-sm font-bold ${cat === "All" ? "bg-black text-white" : "bg-slate-100"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => setCat(c.slug)}
            className={`pill px-4 py-2 text-sm font-bold ${cat === c.slug || cat === c.name ? "bg-black text-white" : "bg-slate-100"}`}
          >
            {c.name}
          </button>
        ))}
        <label className="ml-auto text-sm">
          Up to ${max}{" "}
          <input
            className="ml-2 accent-blue-600"
            type="range"
            min="0"
            max={priceLimit}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
          />
        </label>
        <select
          className="input w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>Featured</option>
          <option>Price Low to High</option>
          <option>Price High to Low</option>
          <option>Newest</option>
        </select>
      </div>
      {shown.length ? (
        <ProductGrid products={shown} />
      ) : (
        <EmptyState
          title="No products found"
          text="Try changing your search or filters."
          action={
            <button
              className="btn btn-primary"
              onClick={() => {
                setQ("");
                setCat("All");
                setMax(priceLimit);
              }}
            >
              Clear filters
            </button>
          }
        />
      )}
    </div>
  );
}
