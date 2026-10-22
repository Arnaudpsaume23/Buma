"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { PaymentModal } from "@/components/PaymentModal";
import { Stars } from "@/components/Stars";
import { drawUnlocked, paidToday } from "@/lib/eligibility";
import { fcfa, isDrawHour } from "@/lib/format";
import { useGroupe } from "@/lib/store";

export default function DashboardPage({
  params,
}: {
  params: { groupe_id: string };
}) {
  const store = useGroupe(params.groupe_id);
  const { groupe, membres, paiements, tirages, role, demo18h, rapportJour } = store;
  const [payOpen, setPayOpen] = useState(false);
  const [rapport, setRapport] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const actifs = useMemo(
    () => membres.filter((m) => m.statut === "actif"),
    [membres],
  );
  const paidSet = groupe
    ? paidToday(paiements, groupe.id, groupe.jour_actuel)
    : new Set<string>();

  if (!groupe) return <p>Groupe introuvable.</p>;

  const heureOk = demo18h || isDrawHour(groupe.heure_tirage);
  const unlock = drawUnlocked(paidSet.size, actifs.length, heureOk);

  function copyRapport() {
    const t = rapportJour(groupe!.id);
    setRapport(t);
    navigator.clipboard?.writeText(t).catch(() => undefined);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-gabon-green p-5 text-white">
        <p className="text-xs font-black uppercase tracking-widest text-gabon-yellow">
          {groupe.nom} · {groupe.collecteur_nom}
        </p>
        <p className="num-xl mt-2 font-display text-6xl sm:text-7xl">
          JOUR {groupe.jour_actuel}
          <span className="text-4xl text-gabon-yellow"> / {groupe.nb_membres}</span>
        </p>
        <p className="mt-3 font-display text-4xl sm:text-5xl">
          Marmite : {fcfa(groupe.montant_marmite)}
        </p>
        <p className="mt-2 text-2xl font-black">
          {paidSet.size}/{actifs.length} ont payé
        </p>
      </section>

      <CalendarGrid
        groupe={groupe}
        paiements={paiements}
        tirages={tirages}
        actifs={actifs.length}
      />

      <section className="overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-display text-2xl">Membres du jour</h2>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="text-sm font-black text-gabon-blue"
          >
            + Membre
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-market-cream font-black uppercase">
              <tr>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Tél</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Gagné</th>
                <th className="px-3 py-2">Garantie</th>
              </tr>
            </thead>
            <tbody>
              {membres.map((m) => {
                const p = paiements.find(
                  (x) =>
                    x.membre_id === m.id && x.jour_numero === groupe.jour_actuel,
                );
                let statut = "Retard";
                let color = "text-market-red";
                if (m.statut === "exclu") {
                  statut = "Exclu";
                } else if (p?.statut === "Payé") {
                  statut = `Payé ${p.heure_paiement} ${p.id_transaction_airtel}`;
                  color = "text-gabon-green";
                }
                return (
                  <tr key={m.id} className="border-t border-black/5">
                    <td className="px-3 py-2 font-bold">
                      <Link href={`/membre/${m.id}`} className="underline">
                        {m.nom}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{m.telephone}</td>
                    <td className={`px-3 py-2 font-black ${color}`}>{statut}</td>
                    <td className="px-3 py-2">
                      <Stars score={m.score_confiance} />
                    </td>
                    <td className="px-3 py-2">
                      {m.a_gagne ? `Oui J${m.jour_gagné}` : "Non"}
                    </td>
                    <td className="px-3 py-2">
                      {m.garantie_payée ? "🔒 10.000" : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setPayOpen(true)}
        className="giant-btn bg-gabon-green"
      >
        Enregistrer paiement du jour
      </button>
      <button
        type="button"
        onClick={copyRapport}
        className="giant-btn bg-gabon-blue"
      >
        Rapport du jour 18h30
      </button>
      <Link
        href={unlock.ok ? `/tirage/${groupe.id}/live` : "#"}
        onClick={(e) => {
          if (!unlock.ok) {
            e.preventDefault();
            setRapport(unlock.raison ?? "");
          }
        }}
        className={`giant-btn block ${
          unlock.ok ? "bg-market-orange" : "bg-neutral-400 shadow-none"
        }`}
      >
        Lancer tirage au sort live
      </Link>
      {!unlock.ok && (
        <p className="text-center text-sm font-bold text-market-red">{unlock.raison}</p>
      )}
      {role !== "collecteur" && (
        <p className="text-center text-xs font-bold">
          Passe en rôle Collecteur (haut de page) pour enregistrer et tirer.
        </p>
      )}

      {rapport && (
        <pre className="whitespace-pre-wrap rounded-3xl bg-black p-4 text-sm text-gabon-yellow">
          {rapport}
        </pre>
      )}

      {payOpen && (
        <PaymentModal groupeId={groupe.id} onClose={() => setPayOpen(false)} />
      )}
      {addOpen && <AddMembreModal groupeId={groupe.id} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddMembreModal({
  groupeId,
  onClose,
}: {
  groupeId: string;
  onClose: () => void;
}) {
  const { addMembre, groupes } = useGroupe(groupeId);
  const groupe = groupes.find((g) => g.id === groupeId);
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("+241 ");
  const [g1n, setG1n] = useState("");
  const [g1t, setG1t] = useState("+241 ");
  const [g2n, setG2n] = useState("");
  const [g2t, setG2t] = useState("+241 ");
  const [garantie, setGarantie] = useState(true);
  const [starter, setStarter] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  function submit() {
    const res = addMembre({
      groupe_id: groupeId,
      nom,
      telephone: tel,
      score_confiance: 3,
      date_inscription: new Date().toISOString().slice(0, 10),
      garant_1_nom: g1n,
      garant_1_tel: g1t,
      garant_2_nom: g2n,
      garant_2_tel: g2t,
      garantie_payée: garantie,
      solde_garantie: garantie ? (groupe?.garantie ?? 10000) : 0,
      tontines_terminees: starter ? [1000] : [],
    });
    if (!res.ok) {
      setMsg(res.raison ?? "Refusé");
      return;
    }
    onClose();
  }

  const inp = "mt-1 w-full rounded-xl border-2 px-3 py-2 font-bold";
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5">
        <h3 className="font-display text-3xl">Nouveau membre</h3>
        <p className="mb-3 text-sm font-bold">
          Score départ 3★ · 2 garants · ticket 1.000/2.000 obligatoire pour 10.000
        </p>
        {[
          ["Nom", nom, setNom],
          ["Téléphone +241", tel, setTel],
          ["Garant 1 nom", g1n, setG1n],
          ["Garant 1 tél", g1t, setG1t],
          ["Garant 2 nom", g2n, setG2n],
          ["Garant 2 tél", g2t, setG2t],
        ].map(([label, val, set]) => (
          <label key={String(label)} className="mb-2 block text-sm font-black">
            {label as string}
            <input
              className={inp}
              value={val as string}
              onChange={(e) =>
                (set as (v: string) => void)(e.target.value)
              }
            />
          </label>
        ))}
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" checked={garantie} onChange={(e) => setGarantie(e.target.checked)} />
          Garantie Airtel bloquée payée
        </label>
        <label className="mt-2 flex items-center gap-2 font-bold">
          <input type="checkbox" checked={starter} onChange={(e) => setStarter(e.target.checked)} />
          A terminé une tontine 1.000 ou 2.000
        </label>
        {msg && <p className="mt-2 font-black text-market-red">{msg}</p>}
        <button type="button" onClick={submit} className="giant-btn mt-3 bg-gabon-green">
          Inscrire
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full py-3 font-bold">
          Fermer
        </button>
      </div>
    </div>
  );
}
