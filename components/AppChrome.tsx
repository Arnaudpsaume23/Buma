"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GROUPE_ID } from "@/lib/seed";
import { useBuma } from "@/lib/store";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: `/dashboard/${GROUPE_ID}`, label: "Dashboard" },
  { href: `/tirage/${GROUPE_ID}/live`, label: "Tirage" },
  { href: "/creation-groupe", label: "Groupe" },
  { href: "/admin/revenus", label: "Revenus" },
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { role, setRole, demo18h, setDemo18h, horsLigne, toggleHorsLigne, resetDemo } =
    useBuma();

  return (
    <div className="market-grid min-h-dvh">
      <header className="sticky top-0 z-40 border-b-4 border-gabon-yellow bg-gabon-green text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gabon-yellow text-xl font-black text-gabon-green">
              B
            </span>
            <span>
              <span className="block font-display text-2xl leading-none">BUMA</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gabon-yellow">
                Tontine + Loto Gabon
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="rounded-lg bg-white/15 px-2 py-1 text-xs font-bold"
            >
              <option value="collecteur">Collecteur</option>
              <option value="membre">Membre</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </header>

      {horsLigne && (
        <div className="bg-market-orange px-4 py-2 text-center text-sm font-black text-white">
          Mode hors-ligne collecteur — les paiements sont stockés sur le téléphone
        </div>
      )}

      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] font-bold">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={demo18h}
            onChange={(e) => setDemo18h(e.target.checked)}
          />
          Simuler 18h (démo tirage)
        </label>
        <button type="button" onClick={toggleHorsLigne} className="underline">
          {horsLigne ? "Repasser en ligne" : "Hors-ligne"}
        </button>
        <button type="button" onClick={resetDemo} className="text-market-red underline">
          Reset démo
        </button>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-4 border-gabon-yellow bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5">
          {NAV.map((n) => {
            const active = path === n.href || (n.href !== "/" && path.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`py-3 text-center text-[11px] font-black uppercase ${
                  active ? "bg-gabon-yellow text-gabon-green" : "text-gabon-green"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
