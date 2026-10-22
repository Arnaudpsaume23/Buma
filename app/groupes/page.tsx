"use client";

import Link from "next/link";
import { fcfa } from "@/lib/format";
import { useBuma } from "@/lib/store";

export default function GroupesPage() {
  const { groupes } = useBuma();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-5xl">Groupes</h1>
      {groupes.map((g) => (
        <Link
          key={g.id}
          href={`/dashboard/${g.id}`}
          className="block rounded-3xl bg-white p-4 shadow-card"
        >
          <p className="font-display text-3xl">{g.nom}</p>
          <p className="font-bold">
            Jour {g.jour_actuel}/{g.nb_membres} · Marmite {fcfa(g.montant_marmite)}
          </p>
        </Link>
      ))}
    </div>
  );
}
