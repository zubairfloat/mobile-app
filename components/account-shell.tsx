import Link from "next/link";
import { CircleUserRound, Package, Settings, Heart } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ProfileAvatar } from "@/components/profile-avatar";
export function AccountShell({
  children,
  active,
  email,
  name,
  avatarUrl,
}: {
  children: React.ReactNode;
  active: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}) {
  const memberEmail = email ?? "Member";
  const nav = [
    [CircleUserRound, "Profile", "/account"],
    [Package, "Orders", "/orders"],
    [Heart, "Wishlist", "#"],
    [Settings, "Settings", "#"],
  ] as const;
  return (
    <div className="section container">
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <aside>
          <div className="card p-5">
            <ProfileAvatar
              key={avatarUrl}
              src={avatarUrl}
              name={name ?? "Pulse member"}
              initials={(name || memberEmail).slice(0, 2).toUpperCase()}
            />
            <p className="mt-3 font-bold">{name ?? "Pulse member"}</p>
            <p className="muted truncate text-sm">{memberEmail}</p>
          </div>
          <nav className="mt-4 grid gap-1">
            {nav.map(([Icon, n, h]) => (
              <Link
                href={h}
                key={n}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${active === n ? "bg-black text-white" : "hover:bg-slate-100"}`}
              >
                <Icon size={18} />
                {n}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </aside>
        {children}
      </div>
    </div>
  );
}
