"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Product } from "@/lib/types";
type Store = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: Product, color?: string, q?: number) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  update: (id: string, q: number) => Promise<boolean>;
  clear: () => Promise<boolean>;
  refresh: () => Promise<void>;
  loading: boolean;
  busy: boolean;
  error: string | null;
  count: number;
  total: number;
};
type CartRow = {
  id: string;
  cart_items: {
    quantity: number;
    products: {
      id: string;
      slug: string;
      name: string;
      price: number;
      stock_quantity: number;
      image_url: string | null;
      description: string | null;
      categories: { name: string } | null;
    } | null;
  }[];
};
const C = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(createClient);
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const owner = useRef<string | null>(null);
  const generation = useRef(0);
  const locked = useRef(false);

  async function load(userId: string, version: number) {
    const { data, error } = await supabase
      .from("carts")
      .select(
        `id, cart_items(quantity, products(id, slug, name, price, stock_quantity, image_url, description, categories(name)))`,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle<CartRow>();
    if (error) throw error;
    if (version !== generation.current) return;
    setItems(
      (data?.cart_items ?? []).flatMap((row) => {
        const p = row.products;
        if (!p)
          throw new Error(
            "A product in your cart is unavailable. Please try again.",
          );
        return [
          {
            quantity: row.quantity,
            color: "",
            product: {
              id: p.id,
              slug: p.slug,
              title: p.name,
              price: Number(p.price),
              stock: p.stock_quantity,
              image: p.image_url || "/product-placeholder.svg",
              description: p.description ?? "",
              category: p.categories?.name ?? "Uncategorized",
              colors: [],
              features: [],
            },
          },
        ];
      }),
    );
  }
  async function refresh() {
    const version = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (version !== generation.current) return;
      if (error && error.name !== "AuthSessionMissingError") throw error;
      const userId = data.user?.id ?? null;
      if (owner.current !== userId) setItems([]);
      owner.current = userId;
      if (userId) await load(userId, version);
      else setItems([]);
    } catch (e) {
      if (version === generation.current)
        setError(
          e instanceof Error
            ? e.message
            : "Unable to load your cart. Please retry.",
        );
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      if (owner.current !== userId) {
        generation.current++;
        owner.current = userId;
        setItems([]);
        setLoading(true);
        // Run database requests outside the auth callback.
        setTimeout(() => void refresh(), 0);
      }
    });
    const focus = () => {
      if (!locked.current) void refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      generation.current++;
      subscription.unsubscribe();
      window.removeEventListener("focus", focus);
    };
  }, [supabase]);

  async function mutate(action: string, productId?: string, amount = 1) {
    if (locked.current || loading) return false;
    locked.current = true;
    setBusy(true);
    setError(null);
    const version = ++generation.current;
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user)
        throw new Error("Please sign in to use your cart.");
      if (version !== generation.current) return false;
      const { error } = await supabase.rpc("mutate_cart", {
        action,
        target_product: productId ?? null,
        amount,
      });
      if (error) throw new Error(error.message);
      await load(user.id, version);
      return version === generation.current;
    } catch (e) {
      if (version === generation.current) {
        setError(
          e instanceof Error
            ? e.message
            : "Unable to save your cart. Please retry.",
        );
        setOpen(true);
      }
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <C.Provider
      value={{
        items,
        open,
        setOpen,
        loading,
        busy,
        error,
        refresh,
        add: async (p, _color, q = 1) => {
          const saved = await mutate("add", p.id, q);
          if (saved) setOpen(true);
          return saved;
        },
        remove: (id) => mutate("remove", id),
        update: (id, q) => mutate("update", id, q),
        clear: () => mutate("clear"),
        count: items.reduce((s, i) => s + i.quantity, 0),
        total: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      }}
    >
      {children}
    </C.Provider>
  );
}
export const useStore = () => {
  const v = useContext(C);
  if (!v) throw new Error("Store missing");
  return v;
};
