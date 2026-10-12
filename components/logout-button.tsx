"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={
        compact
          ? "text-sm font-semibold text-red-600 disabled:opacity-60"
          : "flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-60"
      }
    >
      {!compact && <LogOut size={18} />}
      {loading ? "Signing out…" : "Logout"}
    </button>
  );
}
