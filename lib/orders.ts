import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Order = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  contact_email: string | null;
  shipping_address: Record<string, string | null> | null;
  order_items: {
    id: string;
    product_name: string;
    product_price: number;
    quantity: number;
    line_total: number;
  }[];
};

export async function orderClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/orders");
  return { supabase, user };
}

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value),
  );
export const statusLabel = (value: string) => value.replaceAll("_", " ");
