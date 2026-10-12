import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && !url.searchParams.has("error")) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/account", url.origin));
    } catch {
      // Return to login with a safe, actionable message.
    }
  }
  return NextResponse.redirect(
    new URL("/login?error=google_signin_failed", url.origin),
  );
}
