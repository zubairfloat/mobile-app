import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CatalogCategory, Product } from "@/lib/types";

export const getCatalog = cache(
  async (): Promise<{ products: Product[]; categories: CatalogCategory[] }> => {
    const supabase = await createClient();
    const [productResult, categoryResult] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, category_id, name, slug, description, price, stock_quantity, image_url, created_at",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .order("id"),
      supabase.from("categories").select("id, name, slug").order("name"),
    ]);
    if (productResult.error || categoryResult.error) {
      console.error(
        "Catalog fetch failed",
        productResult.error ?? categoryResult.error,
      );
      throw new Error("Unable to load the catalog. Please try again.");
    }

    console.log("categoryResult", categoryResult);
    const rows = categoryResult.data ?? [];
    const products: Product[] = (productResult.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.name,
      categoryId: row.category_id ?? undefined,
      category:
        rows.find((c) => c.id === row.category_id)?.name ?? "Uncategorized",
      price: Number(row.price),
      stock: row.stock_quantity,
      image: row.image_url || "/product-placeholder.svg",
      description: row.description ?? "",
      colors: [],
      features: [],
      createdAt: row.created_at ?? undefined,
    }));
    return {
      products,
      categories: rows.map((c) => ({
        ...c,
        image:
          products.find((p) => p.categoryId === c.id)?.image ??
          "/product-placeholder.svg",
      })),
    };
  },
);
