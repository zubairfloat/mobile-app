import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { ProductDetail } from "./product-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { products } = await getCatalog();
  const p = products.find((product) => product.slug === slug);
  if (!p) notFound();
  return (
    <ProductDetail
      product={p}
      related={products
        .filter((x) => x.category === p.category && x.id !== p.id)
        .slice(0, 4)}
    />
  );
}
