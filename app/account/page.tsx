import { AddressBook } from "@/components/address-book";
import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const text = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;
  const name =
    text(user.user_metadata.full_name) ?? text(user.user_metadata.name);
  const avatarUrl =
    text(user.user_metadata.avatar_url) ?? text(user.user_metadata.picture);
  const email = user.email || "Not provided";
  const details = [
    ["Full name", name ?? "Not provided"],
    ["Email", email],
    ["Phone", user.phone || "Not provided"],
    [
      "Member since",
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(user.created_at)),
    ],
  ];

  return (
    <AccountShell
      active="Profile"
      email={email}
      name={name}
      avatarUrl={avatarUrl}
    >
      <div>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-2 text-4xl font-black">
          {name ? `Welcome back, ${name}.` : "Welcome back."}
        </h1>
        <p className="muted mt-2">Signed in as {email}</p>
        <section className="card mt-8 p-6" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-xl font-bold">
            Profile details
          </h2>
          <dl className="mt-5 grid gap-6 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="muted text-sm">{label}</dt>
                <dd className="mt-1 font-semibold break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["3", "Orders"],
            ["2", "Saved items"],
            ["240", "Reward points"],
          ].map((x) => (
            <div className="card p-6" key={x[1]}>
              <p className="text-3xl font-black">{x[0]}</p>
              <p className="muted text-sm">{x[1]}</p>
            </div>
          ))}
        </div>
        <div className="card mt-6 p-6">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold">Recent order</h2>
            <Link className="text-sm font-bold text-blue-600" href="/orders">
              View all
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
            <div>
              <b>#PLS-20391</b>
              <p className="muted text-sm">August 18, 2026 · 2 items</p>
            </div>
            <span className="pill bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              Delivered
            </span>
            <b>$118.00</b>
          </div>
        </div>
        <div id="addresses">
          <AddressBook />
        </div>
        <div className="card mt-6 p-6">
          <h2 className="text-xl font-bold">Account settings</h2>
          <p className="muted mt-2">
            Profile, payment methods, and notification preferences will live
            here.
          </p>
        </div>
      </div>
    </AccountShell>
  );
}
