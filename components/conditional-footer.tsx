"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";

const routesWithoutFooter = new Set(["/login", "/signup"]);

export function ConditionalFooter() {
  const pathname = usePathname();

  if (routesWithoutFooter.has(pathname)) {
    return null;
  }

  return <Footer />;
}
