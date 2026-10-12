import { Suspense } from "react";
import { ProductCatalog } from "@/components/product-catalog";
import { getCatalog } from "@/lib/catalog";
import { Skeletons } from "@/components/ui";

export default async function ProductsPage() {
  const catalog = await getCatalog();
  return (
    <Suspense fallback={<Skeletons />}>
      <ProductCatalog {...catalog} />
    </Suspense>
  );
}
