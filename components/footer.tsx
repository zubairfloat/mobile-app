import Link from "next/link";
export function Footer() {
  return (
    <footer className="bg-[#090a0c] py-14 text-white">
      <div className="container grid gap-10 md:grid-cols-4">
        <div>
          <p className="text-xl font-black">
            PULSE<span className="text-blue-500">.</span>
          </p>
          <p className="mt-4 text-sm text-white/55">
            Smarter accessories for a life in motion.
          </p>
        </div>
        {[
          ["Shop", "Products", "Cases", "Audio", "Power"],
          ["Help", "Delivery", "Returns", "Warranty", "Contact"],
          ["Account", "Sign in", "Create account", "Orders", "Settings"],
        ].map((g, i) => (
          <div key={i}>
            <p className="font-bold">{g[0]}</p>
            <div className="mt-4 grid gap-3 text-sm text-white/55">
              {g.slice(1).map((x) => (
                <Link href={x === "Products" ? "/products" : "#"} key={x}>
                  {x}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="container mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
        © 2026 Pulse. Designed for everyday power.
      </div>
    </footer>
  );
}
