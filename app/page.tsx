"use client";

import Link from "next/link";
import { fcfa } from "@/lib/format";
import { GROUPE_ID } from "@/lib/seed";
import { useGroupe } from "@/lib/store";
import { paidToday } from "@/lib/eligibility";

export default function HomePage() {
  const { groupe, membres, paiements, tirages } = useGroupe(GROUPE_ID);
  if (!groupe) return null;
  const actifs = membres.filter((m) => m.statut === "actif");
  const paid = paidToday(paiements, groupe.id, groupe.jour_actuel).size;
  const lastWin = [...tirages].reverse().find((t) => t.gagnant_id);
  const winner = membres.find((m) => m.id === lastWin?.gagnant_id);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[32px] bg-gabon-green p-6 text-white shadow-giant">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-gabon-yellow">
          Marché Mont-Bouët · Libreville
        </p>
        <h1 className="mt-2 font-display text-6xl sm:text-7xl">BUMA</h1>
        <p className="mt-2 max-w-md text-lg font-bold leading-tight">
          Tontine journalière rotative. 30 mamans. 10.000 FCFA. Tirage loto à 18h.
          Personne ne fuit.
        </p>
      </section>

      <section className="rounded-[32px] bg-gabon-yellow p-5 text-gabon-green shadow-card">
        <p className="text-sm font-black uppercase">Marmite du jour</p>
        <p className="num-xl mt-1 font-display text-6xl sm:text-8xl">
          {fcfa(groupe.montant_marmite).replace(" FCFA", "")}
        </p>
        <p className="text-xl font-black">FCFA · Jour {groupe.jour_actuel}/{groupe.nb_membres}</p>
        <p className="mt-2 text-lg font-extrabold">
          {paid}/{actifs.length} ont payé aujourd&apos;hui
        </p>
      </section>

      <Link
        href={`/dashboard/${groupe.id}`}
        className="giant-btn block bg-market-orange"
      >
        J&apos;AI PAYÉ AUJOURD&apos;HUI
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/tirage/${groupe.id}/live`}
          className="rounded-3xl bg-gabon-blue p-4 font-black text-white shadow-card"
        >
          <p className="text-xs uppercase">18h00</p>
          <p className="font-display text-3xl">Tirage live</p>
        </Link>
        <Link
          href="/creation-groupe"
          className="rounded-3xl bg-white p-4 font-black shadow-card"
        >
          <p className="text-xs uppercase text-gabon-green">Nouveau</p>
          <p className="font-display text-3xl text-gabon-green">Groupe</p>
        </Link>
      </div>

      {winner && lastWin && (
        <section className="rounded-3xl border-4 border-gabon-blue bg-white p-4">
          <p className="text-xs font-black uppercase text-gabon-blue">Dernière gagnante</p>
          <p className="font-display text-4xl">{winner.nom.split(" ")[0]}</p>
          <p className="font-bold">
            Jour {lastWin.jour_numero} · {fcfa(groupe.montant_marmite)}
          </p>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Garantie bloquée", "10.000 FCFA"],
          ["2 garants WhatsApp", "Score à 0 si fuite"],
          ["Fonds sécurité", "100 F / jour / membre"],
        ].map(([t, d]) => (
          <div key={t} className="rounded-3xl bg-white p-4 shadow-card">
            <p className="font-display text-2xl text-gabon-green">{t}</p>
            <p className="font-bold">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
