import { HomeContent } from "@/components/home-content";
import { getCatalog } from "@/lib/catalog";

export default async function Home() {
  const catalog = await getCatalog();
  return <HomeContent {...catalog} />;
}
