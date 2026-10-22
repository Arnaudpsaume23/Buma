"use client";

import { fcfa } from "@/lib/format";
import { feteFin } from "@/lib/anti-fuite";
import { useBuma } from "@/lib/store";

export default function RevenusPage() {
  const { groupes, tirages, fonds, membres } = useBuma();

  const rows = groupes.map((g) => {
    const jours = g.statut === "termine" ? g.nb_membres : g.jour_actuel;
    const service = g.nb_membres * g.frais_service * (g.statut === "termine" ? g.nb_membres : jours);
    const expressN = tirages.filter(
      (t) => t.groupe_id === g.id && t.mode_paiement_gagnant === "express",
    ).length;
    const express = expressN * Math.round(g.montant_marmite * (g.frais_express_pct / 100));
    const f = fonds.find((x) => x.groupe_id === g.id);
    const fete = f ? feteFin(f, g.nb_membres) : { primeGestion: 0, parMembre: 0, dist: 0 };
    const secu50 = g.statut === "termine" && f && f.montant_utilisé_pour_fuite === 0
      ? fete.primeGestion
      : 0;
    return {
      g,
      service,
      express,
      secu50,
      total: service + express + secu50,
      expressN,
      fete,
    };
  });

  const tot = rows.reduce(
    (a, r) => ({
      service: a.service + r.service,
      express: a.express + r.express,
      secu50: a.secu50 + r.secu50,
      total: a.total + r.total,
    }),
    { service: 0, express: 0, secu50: 0, total: 0 },
  );

  const objectif = 9_000_000;
  const vingtGroupes = tot.total * (20 / Math.max(groupes.length, 1));

  return (
    <div className="space-y-4">
      <h1 className="font-display text-5xl">Revenus Buma</h1>
      <section className="rounded-[28px] bg-gabon-green p-5 text-white">
        <p className="text-sm font-black uppercase">Total tous groupes</p>
        <p className="num-xl font-display text-6xl">{tot.total.toLocaleString("fr-FR")}</p>
        <p className="text-2xl font-black">FCFA</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card title="Frais service" value={tot.service} />
        <Card title="Express 3%" value={tot.express} />
        <Card title="Fonds sécu 50%" value={tot.secu50} />
      </div>

      {rows.map((r) => (
        <article key={r.g.id} className="rounded-3xl bg-white p-4 shadow-card">
          <h2 className="font-display text-3xl">{r.g.nom}</h2>
          <p className="text-sm font-bold">
            {r.g.nb_membres} membres · Jour {r.g.jour_actuel} · {r.g.statut}
          </p>
          <ul className="mt-2 font-bold">
            <li>Frais service : {fcfa(r.service)}</li>
            <li>
              Express : {r.expressN} × {fcfa(Math.round(r.g.montant_marmite * 0.03))} = {fcfa(r.express)}
            </li>
            <li>Prime sans fuite (50% fonds) : {fcfa(r.secu50)}</li>
            <li className="text-gabon-green">Total groupe : {fcfa(r.total)}</li>
          </ul>
        </article>
      ))}

      <section className="rounded-[28px] bg-gabon-yellow p-5">
        <p className="font-black uppercase">Objectif 20 groupes</p>
        <p className="font-display text-5xl">{fcfa(objectif)} / mois</p>
        <p className="mt-2 font-bold">
          Projection actuelle × 20 groupes : {fcfa(Math.round(vingtGroupes))}
        </p>
        <p className="text-sm font-bold">
          Membres plateforme : {membres.length}
        </p>
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card">
      <p className="text-xs font-black uppercase">{title}</p>
      <p className="font-display text-4xl text-gabon-green">{value.toLocaleString("fr-FR")}</p>
    </div>
  );
}
