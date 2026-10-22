"use client";

import { useMemo, useState } from "react";
import { fcfa } from "@/lib/format";
import { useGroupe } from "@/lib/store";
import type { ModePaiement } from "@/lib/types";

export function PaymentModal({
  groupeId,
  onClose,
  presetMembreId,
}: {
  groupeId: string;
  onClose: () => void;
  presetMembreId?: string;
}) {
  const { membres, groupe, recordPayment, paiements } = useGroupe(groupeId);
  const [qr, setQr] = useState("");
  const [airtel, setAirtel] = useState("AM-");
  const [mode, setMode] = useState<ModePaiement>("Airtel");
  const [msg, setMsg] = useState<string | null>(null);

  const membre = useMemo(() => {
    if (presetMembreId) return membres.find((m) => m.id === presetMembreId);
    const q = qr.trim().toUpperCase();
    if (!q) return null;
    return membres.find(
      (m) =>
        m.qr_code === q ||
        m.nom.toLowerCase().includes(qr.toLowerCase()) ||
        m.telephone.replace(/\s/g, "").includes(qr.replace(/\s/g, "")),
    );
  }, [membres, presetMembreId, qr]);

  const already = membre
    ? paiements.some(
        (p) =>
          p.membre_id === membre.id &&
          p.jour_numero === groupe?.jour_actuel &&
          p.statut === "Payé",
      )
    : false;

  function submit() {
    if (!membre || !groupe) {
      setMsg("Scanne le QR ou saisis le nom / téléphone.");
      return;
    }
    const res = recordPayment({
      membreId: membre.id,
      groupeId: groupe.id,
      airtelId: airtel,
      mode,
    });
    if (!res.ok) {
      setMsg(res.raison ?? "Échec");
      return;
    }
    setMsg(`Vérifié ✓ ${membre.nom} — ${fcfa(groupe.montant_journalier + groupe.frais_service + groupe.fonds_secu_jour)}`);
    setTimeout(onClose, 700);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-4 sm:place-items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-card">
        <h3 className="font-display text-3xl">Enregistrer paiement</h3>
        <p className="mb-4 text-sm font-semibold text-black/60">
          Simulation Airtel Money — ID format AM-xxxx
        </p>
        {!presetMembreId && (
          <label className="mb-3 block text-sm font-bold">
            Scanner QR membre
            <input
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              placeholder="BUMA-MB1-01 ou nom"
              className="mt-1 w-full rounded-xl border-2 border-black/10 px-3 py-3"
            />
          </label>
        )}
        {membre && (
          <div className="mb-3 rounded-2xl bg-gabon-green/10 p-3 font-bold">
            <p>{membre.nom}</p>
            <p className="text-sm">{membre.telephone}</p>
            <p className="font-mono text-xs">{membre.qr_code}</p>
            {already && <p className="text-market-red">Déjà payé aujourd&apos;hui</p>}
          </div>
        )}
        <div className="mb-3 grid grid-cols-3 gap-2 text-xs font-black">
          {(["Airtel", "QR", "Espece"] as ModePaiement[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 ${mode === m ? "bg-gabon-blue text-white" : "bg-neutral-100"}`}
            >
              {m}
            </button>
          ))}
        </div>
        {mode !== "Espece" && (
          <label className="mb-3 block text-sm font-bold">
            ID Airtel Money
            <input
              value={airtel}
              onChange={(e) => setAirtel(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-black/10 px-3 py-3 font-mono"
            />
          </label>
        )}
        {msg && <p className="mb-3 font-bold text-gabon-green">{msg}</p>}
        <button type="button" onClick={submit} className="giant-btn bg-gabon-green">
          Vérifier et passer en vert
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full py-3 font-bold">
          Fermer
        </button>
      </div>
    </div>
  );
}
