"use client";

import { useMemo, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Wheel } from "@/components/Wheel";
import { eligibleForDraw, drawUnlocked, paidToday } from "@/lib/eligibility";
import { fcfa, isDrawHour, shortPhone } from "@/lib/format";
import { useGroupe } from "@/lib/store";

export default function TirageLivePage({
  params,
}: {
  params: { groupe_id: string };
}) {
  const store = useGroupe(params.groupe_id);
  const {
    groupe,
    membres,
    paiements,
    tirages,
    launchTirage,
    setPayout,
    role,
    demo18h,
  } = store;
  const [count, setCount] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wa, setWa] = useState<string | null>(null);

  const todayTirage = groupe
    ? tirages.find((t) => t.jour_numero === groupe.jour_actuel)
    : undefined;
  const winner = membres.find((m) => m.id === todayTirage?.gagnant_id);

  const eligibles = useMemo(() => {
    if (!groupe) return [];
    return eligibleForDraw({
      groupe,
      membres,
      paiements,
      jour: groupe.jour_actuel,
    });
  }, [groupe, membres, paiements]);

  if (!groupe) return <p>Groupe introuvable.</p>;

  const paid = paidToday(paiements, groupe.id, groupe.jour_actuel).size;
  const actifs = membres.filter((m) => m.statut === "actif").length;
  const heureOk = demo18h || isDrawHour(groupe.heure_tirage);
  const unlock = drawUnlocked(paid, actifs, heureOk);
  const expressFee = Math.round(groupe.montant_marmite * (groupe.frais_express_pct / 100));
  const canClick = role === "collecteur";
  const winnerIndex = winner
    ? Math.max(
        0,
        eligibles.findIndex((m) => m.id === winner.id),
      )
    : 0;

  function startCountdown() {
    setError(null);
    if (!canClick) {
      setError("Seul le chef / collecteur peut lancer le tirage.");
      return;
    }
    if (!unlock.ok) {
      setError(unlock.raison ?? "Tirage bloqué");
      return;
    }
    if (todayTirage?.gagnant_id) {
      setError("Tirage déjà fait aujourd'hui.");
      return;
    }
    let n = 5;
    setCount(n);
    const t = setInterval(() => {
      n -= 1;
      setCount(n);
      if (n <= 0) {
        clearInterval(t);
        setCount(null);
        setSpinning(true);
        setTimeout(() => {
          const res = launchTirage(groupe!.id!);
          setSpinning(false);
          if (!res.ok) setError(res.raison ?? "Échec");
        }, 3400);
      }
    }, 700);
  }

  function payout(mode: "standard" | "express") {
    if (!todayTirage) return;
    setPayout(todayTirage.id, mode);
    const msg = winner
      ? `🎉 BUMA ${groupe?.nom}\nGAGNANTE JOUR ${groupe?.jour_actuel} : ${winner.nom} — ${winner.telephone}\n${fcfa(groupe.montant_marmite)}\nMode : ${mode === "express" ? "EXPRESS 5 min" : "Demain 10h gratuit"}\nVidéo : ${todayTirage.video_url}\nPreuve seed : ${todayTirage.seed_hasard}`
      : "";
    setWa(msg);
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-5">
      <Confetti show={Boolean(winner) && !spinning} />
      <section className="rounded-[28px] bg-gabon-blue p-5 text-center text-white">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-gabon-yellow">
          Tirage live · {groupe.heure_tirage}
        </p>
        <h1 className="font-display text-5xl">Loto Buma</h1>
        <p className="font-bold">
          Jour {groupe.jour_actuel} · Marmite {fcfa(groupe.montant_marmite)}
        </p>
        <p className="text-sm">
          Mode {groupe.mode_tirage} · Payés {paid}/{actifs} · Éligibles {eligibles.length}
        </p>
      </section>

      {count !== null && (
        <p className="text-center font-display text-8xl text-market-orange">{count}</p>
      )}

      <Wheel
        names={eligibles.map((m) => m.nom.split(" ")[0])}
        spinning={spinning}
        winnerIndex={winnerIndex}
      />

      <div className="rounded-3xl bg-white p-4 shadow-card">
        <p className="mb-2 text-xs font-black uppercase">Noms dans la roue (payé + pas encore gagné)</p>
        <div className="flex flex-wrap gap-2">
          {eligibles.map((m) => (
            <span
              key={m.id}
              className="rounded-full bg-gabon-green px-3 py-1 text-sm font-black text-white"
            >
              {m.nom.split(" ")[0]}
            </span>
          ))}
          {!eligibles.length && (
            <p className="font-bold text-market-red">Personne n&apos;est éligible pour l&apos;instant.</p>
          )}
        </div>
      </div>

      {!winner && (
        <button
          type="button"
          onClick={startCountdown}
          disabled={spinning || count !== null}
          className="giant-btn bg-market-orange disabled:bg-neutral-400"
        >
          Lancer le tirage
        </button>
      )}

      {winner && todayTirage && !spinning && (
        <section className="pop-win rounded-[28px] bg-gabon-yellow p-5 text-center">
          <p className="text-sm font-black uppercase">Gagnante jour {groupe.jour_actuel}</p>
          <p className="font-display text-5xl text-gabon-green">{winner.nom}</p>
          <p className="text-xl font-black">
            {shortPhone(winner.telephone)} · {fcfa(groupe.montant_marmite)}
          </p>
          <p className="mt-2 font-mono text-xs">seed {todayTirage.seed_hasard}</p>
          <p className="text-xs">Vidéo simulée : {todayTirage.video_url}</p>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => payout("standard")}
              className="giant-btn bg-gabon-green"
            >
              Recevoir demain 10h GRATUIT
            </button>
            <button
              type="button"
              onClick={() => payout("express")}
              className="giant-btn bg-gabon-blue"
            >
              Recevoir MAINTENANT — Frais {fcfa(expressFee)} (Express)
            </button>
          </div>
        </section>
      )}

      {error && <p className="text-center font-black text-market-red">{error}</p>}
      {wa && (
        <pre className="whitespace-pre-wrap rounded-3xl bg-black p-4 text-sm text-white">{wa}</pre>
      )}

      <section className="rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-2xl">Historique des tirages</h2>
        <ul className="mt-3 space-y-2">
          {[...tirages].reverse().map((t) => {
            const w = membres.find((m) => m.id === t.gagnant_id);
            return (
              <li key={t.id} className="flex justify-between rounded-2xl bg-market-cream px-3 py-2 font-bold">
                <span>
                  Jour {t.jour_numero} · {w?.nom ?? "—"}
                </span>
                <span className="text-gabon-green">
                  {t.mode_paiement_gagnant === "express" ? "Express" : t.statut}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
