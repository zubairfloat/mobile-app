import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
import { Header } from "@/components/header";
import { ConditionalFooter } from "@/components/conditional-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = {
  title: "Pulse — Mobile Accessories",
  description: "Premium mobile accessories for everyday life.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isAuthenticated = false;
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims);
  }

  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Header isAuthenticated={isAuthenticated} />
          <main>{children}</main>
          <ConditionalFooter />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
