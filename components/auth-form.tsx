"use client";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function AuthForm({
  mode,
  initialError = "",
}: {
  mode: "login" | "signup" | "forgot";
  initialError?: string;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";
  return (
    <div className="grid min-h-[calc(100vh-72px)] bg-slate-50 lg:grid-cols-2">
      <div className="hidden bg-[#0a0b0d] p-16 text-white lg:flex lg:flex-col lg:justify-end">
        <p className="eyebrow">PULSE MEMBERS</p>
        <h2 className="mt-4 text-6xl leading-none font-black">
          More power.
          <br />
          More perks.
        </h2>
        <p className="mt-5 max-w-md text-white/55">
          Track every order, save favorites, and get early access to new
          essentials.
        </p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading || googleLoading) return;
            const formElement = e.currentTarget;
            setError("");
            setSuccess("");
            const form = new FormData(formElement);
            const email = String(form.get("email") ?? "").trim();
            const password = String(form.get("password") ?? "");

            if (mode === "forgot") {
              setSuccess("Password reset is not configured yet.");
              return;
            }

            if (password.length < 8) {
              setError("Password must be at least 8 characters.");
              return;
            }

            if (mode === "signup") {
              const confirmation = String(form.get("confirmPassword") ?? "");
              if (password !== confirmation) {
                setError("Passwords do not match.");
                return;
              }
            }

            setLoading(true);
            try {
              const supabase = createClient();
              if (mode === "login") {
                const { error: authError } =
                  await supabase.auth.signInWithPassword({ email, password });
                if (authError) throw authError;
                router.push("/account");
                router.refresh();
              } else {
                const { data, error: authError } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                if (authError) throw authError;

                if (data.session) {
                  router.push("/account");
                  router.refresh();
                  return;
                }

                setSuccess(
                  "Check your email for a confirmation link before signing in.",
                );
                formElement.reset();
              }
            } catch (authError) {
              setError(
                authError instanceof Error
                  ? authError.message
                  : "Something went wrong. Please try again.",
              );
            } finally {
              setLoading(false);
            }
          }}
          className="card w-full max-w-md p-8"
        >
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="muted mt-2 text-sm">
            {mode === "forgot"
              ? "We’ll email you a secure reset link."
              : "Your everyday tech, all in one place."}
          </p>
          {success && (
            <p className="mt-5 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
              {success}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
            >
              {error}
            </p>
          )}
          <div className="mt-7 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Email
              <input
                required
                name="email"
                type="email"
                className="input font-normal"
                placeholder="you@example.com"
              />
            </label>
            {mode !== "forgot" && (
              <label className="grid gap-2 text-sm font-bold">
                Password
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    name="password"
                    type={show ? "text" : "password"}
                    className="input pr-12 font-normal"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShow(!show)}
                    className="absolute top-3 right-3"
                  >
                    {show ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </label>
            )}
            {mode === "signup" && (
              <label className="grid gap-2 text-sm font-bold">
                Confirm password
                <input
                  required
                  minLength={8}
                  name="confirmPassword"
                  type={show ? "text" : "password"}
                  className="input font-normal"
                />
              </label>
            )}
          </div>
          {mode === "login" && (
            <Link
              href="/forgot-password"
              className="mt-3 block text-right text-sm font-bold text-blue-600"
            >
              Forgot password?
            </Link>
          )}
          <button
            disabled={loading || googleLoading}
            className="btn btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : mode === "login"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>
          {mode !== "forgot" && (
            <>
              <div className="muted my-5 flex items-center gap-3 text-xs">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                type="button"
                disabled={loading || googleLoading}
                className="btn w-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={async () => {
                  if (loading || googleLoading) return;
                  setError("");
                  setSuccess("");
                  setGoogleLoading(true);
                  try {
                    const supabase = createClient();
                    const { error: authError } =
                      await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                        },
                      });
                    if (authError) throw authError;
                  } catch (authError) {
                    setError(
                      authError instanceof Error
                        ? authError.message
                        : "Google sign-in failed. Please try again.",
                    );
                    setGoogleLoading(false);
                  }
                }}
              >
                {googleLoading
                  ? "Connecting to Google…"
                  : "Continue with Google"}
              </button>
            </>
          )}
          <p className="muted mt-6 text-center text-sm">
            {mode === "login" ? (
              <>
                New to Pulse?{" "}
                <Link className="font-bold text-black" href="/signup">
                  Create account
                </Link>
              </>
            ) : mode === "signup" ? (
              <>
                Already a member?{" "}
                <Link className="font-bold text-black" href="/login">
                  Sign in
                </Link>
              </>
            ) : (
              <Link className="font-bold text-black" href="/login">
                Back to sign in
              </Link>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
