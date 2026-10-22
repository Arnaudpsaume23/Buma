"use client";

import { useState } from "react";
import type { Groupe, PaiementJournalier, Tirage } from "@/lib/types";

type Cell = "paye" | "aujourd" | "retard" | "futur";

export function CalendarGrid({
  groupe,
  paiements,
  tirages,
  actifs,
}: {
  groupe: Groupe;
  paiements: PaiementJournalier[];
  tirages: Tirage[];
  actifs: number;
}) {
  const [open, setOpen] = useState<number | null>(null);

  function kind(d: number): Cell {
    if (d > groupe.jour_actuel) return "futur";
    if (d === groupe.jour_actuel) return "aujourd";
    const paid = paiements.filter(
      (p) => p.jour_numero === d && p.statut === "Payé",
    ).length;
    const drawn = tirages.some((t) => t.jour_numero === d && t.gagnant_id);
    if (paid >= actifs && drawn) return "paye";
    if (paid < actifs) return "retard";
    return "paye";
  }

  const colors: Record<Cell, string> = {
    paye: "bg-gabon-green text-white border-gabon-green",
    aujourd: "bg-gabon-yellow text-gabon-green border-market-orange",
    retard: "bg-market-red text-white border-market-red",
    futur: "bg-neutral-200 text-neutral-500 border-neutral-300",
  };

  const detail = open
    ? {
        paid: paiements.filter((p) => p.jour_numero === open && p.statut === "Payé")
          .length,
        tirage: tirages.find((t) => t.jour_numero === open),
      }
    : null;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl">Calendrier 30 jours</h2>
        <div className="flex gap-2 text-[10px] font-bold uppercase">
          <span className="rounded bg-gabon-green px-2 py-0.5 text-white">Payé</span>
          <span className="rounded bg-gabon-yellow px-2 py-0.5">Auj.</span>
          <span className="rounded bg-market-red px-2 py-0.5 text-white">Retard</span>
          <span className="rounded bg-neutral-200 px-2 py-0.5">Futur</span>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {Array.from({ length: groupe.nb_membres }).map((_, i) => {
          const d = i + 1;
          const k = kind(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => setOpen(d)}
              className={`aspect-square rounded-xl border-2 text-lg font-black ${colors[k]} ${
                open === d ? "ring-4 ring-gabon-blue" : ""
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      {open && detail && (
        <div className="mt-3 rounded-2xl bg-market-cream p-3 text-sm font-semibold">
          <p className="font-black">Jour {open}</p>
          <p>
            Payés : {detail.paid}/{actifs}
          </p>
          <p>
            Tirage :{" "}
            {detail.tirage?.gagnant_id
              ? `fait — seed ${detail.tirage.seed_hasard}`
              : open < groupe.jour_actuel
                ? "non enregistré"
                : "en attente 18h"}
          </p>
        </div>
      )}
    </section>
  );
}
