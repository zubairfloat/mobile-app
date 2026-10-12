"use client";
import Link from "next/link";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./store-provider";
import { LogoutButton } from "@/components/logout-button";
const links = [
  ["Shop", "/products"],
  ["Cases", "/products?category=Phone%20Cases"],
  ["Audio", "/products?category=Wireless%20Earbuds"],
  ["Power", "/products?category=Chargers"],
];
export function Header({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [menu, setMenu] = useState(false),
    s = useStore();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur-xl">
      <div className="container flex h-18 items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight">
          PULSE<span className="text-blue-600">.</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([n, h]) => (
            <Link
              className="text-sm font-semibold hover:text-blue-600"
              key={n}
              href={h}
            >
              {n}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/products" aria-label="Search" className="p-2.5">
            <Search size={20} />
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-2 text-sm font-semibold hover:text-blue-600"
                >
                  <User size={18} /> My Account
                </Link>
                <LogoutButton compact />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary px-4 py-2 text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
          <button
            onClick={() => s.setOpen(true)}
            aria-label="Open cart"
            className="relative p-2.5"
          >
            <ShoppingBag size={20} />
            {s.count > 0 && (
              <span className="absolute top-0 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {s.count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMenu(!menu)}
            aria-label="Toggle menu"
            className="p-2.5 md:hidden"
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {menu && (
        <nav className="container grid gap-4 border-t py-5 md:hidden">
          {links.map(([n, h]) => (
            <Link onClick={() => setMenu(false)} key={n} href={h}>
              {n}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-5 border-t pt-4">
            {isAuthenticated ? (
              <>
                <Link
                  onClick={() => setMenu(false)}
                  href="/account"
                  className="font-semibold"
                >
                  My Account
                </Link>
                <LogoutButton compact />
              </>
            ) : (
              <>
                <Link
                  onClick={() => setMenu(false)}
                  href="/login"
                  className="font-semibold"
                >
                  Login
                </Link>
                <Link
                  onClick={() => setMenu(false)}
                  href="/signup"
                  className="font-semibold text-blue-600"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
