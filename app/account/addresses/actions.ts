"use server";
import { createClient } from "@/lib/supabase/server";
import { addressFields, type Address } from "@/lib/addresses";

export async function fetchAddresses(): Promise<{
  addresses: Address[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return {
      addresses: [],
      error: "Please sign in to view your saved addresses.",
    };
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error)
    return {
      addresses: [],
      error: "Unable to load addresses. Please try again.",
    };
  return { addresses: data as Address[] };
}

export async function saveAddress(
  form: FormData,
): Promise<{ address?: Address; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return { error: "Please sign in to save an address." };
  const values: Record<string, string | null> = {};
  for (const [key, label, required] of addressFields) {
    const raw = form.get(key);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (required && !value) return { error: `${label} is required.` };
    if (value.length > 500) return { error: `${label} is too long.` };
    values[key] = value || null;
  }
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...values, user_id: user.id })
    .select()
    .single();
  if (error) return { error: "Unable to save this address. Please try again." };
  return { address: data as Address };
}
