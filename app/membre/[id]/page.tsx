"use client";

import { useState } from "react";
import { PaymentModal } from "@/components/PaymentModal";
import { PunchCard } from "@/components/PunchCard";
import { Stars } from "@/components/Stars";
import { paidDays } from "@/lib/eligibility";
import { fcfa } from "@/lib/format";
import { useBuma } from "@/lib/store";

export default function MembrePage({ params }: { params: { id: string } }) {
  const { membres, groupes, paiements } = useBuma();
  const membre = membres.find((m) => m.id === params.id);
  const groupe = groupes.find((g) => g.id === membre?.groupe_id);
  const [open, setOpen] = useState(false);

  if (!membre || !groupe) return <p>Membre introuvable.</p>;
  const days = paidDays(paiements, membre.id);

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-5 shadow-card">
        <p className="font-mono text-xs font-black">{membre.qr_code}</p>
        <h1 className="font-display text-5xl">{membre.nom}</h1>
        <p className="font-bold">{membre.telephone}</p>
        <div className="mt-2">
          <Stars score={membre.score_confiance} />
          <span className="ml-2 font-black">{membre.score_confiance.toFixed(1)} ★</span>
        </div>
        <p className="mt-3 rounded-2xl bg-market-cream p-3 font-bold">
          Garants : {membre.garant_1_nom}, {membre.garant_2_nom}
        </p>
      </section>

      <section className="rounded-[28px] bg-gabon-green p-5 text-white">
        <p className="font-display text-4xl">
          Tu as payé {membre.jours_payés}/{groupe.nb_membres} jours
        </p>
        <p className="mt-2 text-2xl font-black">Épargné {fcfa(membre.solde_epargné)}</p>
        <p className="mt-1 text-xl font-bold">
          Tu as gagné ?{" "}
          {membre.a_gagne ? `Oui — Jour ${membre.jour_gagné}` : "Pas encore"}
        </p>
        <p className="mt-2 text-sm font-bold text-gabon-yellow">
          Garantie {membre.garantie_payée ? "bloquée 10.000" : "non payée / confisquée"}
        </p>
      </section>

      <PunchCard
        total={groupe.nb_membres}
        paidDays={days}
        winDay={membre.jour_gagné}
      />

      <button type="button" onClick={() => setOpen(true)} className="giant-btn bg-market-orange">
        J&apos;AI PAYÉ AUJOURD&apos;HUI
      </button>

      {open && (
        <PaymentModal
          groupeId={groupe.id}
          presetMembreId={membre.id}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
