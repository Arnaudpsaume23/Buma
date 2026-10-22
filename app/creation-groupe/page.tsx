"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { fcfa } from "@/lib/format";
import { useBuma } from "@/lib/store";
import type { JourRepos, ModeTirage } from "@/lib/types";

export default function CreationGroupePage() {
  const { createGroupe } = useBuma();
  const router = useRouter();
  const [nom, setNom] = useState("Mamans Mont-Bouët 1");
  const [nb, setNb] = useState(30);
  const [montant, setMontant] = useState(10000);
  const [heure, setHeure] = useState("18:00");
  const [repos, setRepos] = useState<JourRepos>("dimanche");
  const [frais, setFrais] = useState(200);
  const [express, setExpress] = useState(3);
  const [garantie, setGarantie] = useState(10000);
  const [secu, setSecu] = useState(100);
  const [collecteurTel, setCollecteurTel] = useState("+241 077 00 00 01");
  const [collecteurNom, setCollecteurNom] = useState("Jean-Pierre Mba");
  const [mode, setMode] = useState<ModeTirage>("intelligent");

  const marmite = nb * montant;
  const jours = nb;

  const preview = useMemo(
    () => ({
      service: nb * frais * jours,
      expressUn: Math.round(marmite * (express / 100)),
      fonds: nb * secu * jours,
    }),
    [nb, frais, jours, marmite, express, secu],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = createGroupe({
      nom,
      nb_membres: nb,
      montant_journalier: montant,
      frais_service: frais,
      frais_express_pct: express,
      garantie,
      fonds_secu_jour: secu,
      heure_tirage: heure,
      jour_repos: repos,
      collecteur_tel: collecteurTel,
      collecteur_nom: collecteurNom,
      mode_tirage: mode,
      date_debut: new Date().toISOString().slice(0, 10),
    });
    router.push(`/dashboard/${id}`);
  }

  const field = "mt-1 w-full rounded-xl border-2 border-black/10 px-3 py-3 font-bold";

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="font-display text-5xl">Créer un groupe</h1>
      <p className="font-bold text-black/60">
        Nombre de jours = nombre de membres. Tout le monde gagne une fois.
      </p>

      <label className="block font-black">
        Nom du groupe
        <input className={field} value={nom} onChange={(e) => setNom(e.target.value)} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block font-black">
          Membres (10–50)
          <input
            className={field}
            type="number"
            min={10}
            max={50}
            value={nb}
            onChange={(e) => setNb(Number(e.target.value))}
          />
        </label>
        <label className="block font-black">
          Montant / jour
          <input
            className={field}
            type="number"
            value={montant}
            onChange={(e) => setMontant(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="rounded-3xl bg-gabon-yellow p-4">
        <p className="text-sm font-black uppercase">Jours auto</p>
        <p className="font-display text-5xl">{jours}</p>
        <p className="font-black">Marmite = {fcfa(marmite)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block font-black">
          Heure tirage
          <input className={field} type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
        </label>
        <label className="block font-black">
          Jour de repos
          <select className={field} value={repos} onChange={(e) => setRepos(e.target.value as JourRepos)}>
            <option value="dimanche">Dimanche (pas de collecte)</option>
            <option value="aucun">Aucun</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block font-black">
          Frais service / jour
          <input className={field} type="number" value={frais} onChange={(e) => setFrais(Number(e.target.value))} />
        </label>
        <label className="block font-black">
          Frais express %
          <input className={field} type="number" value={express} onChange={(e) => setExpress(Number(e.target.value))} />
        </label>
        <label className="block font-black">
          Garantie d&apos;entrée
          <input className={field} type="number" value={garantie} onChange={(e) => setGarantie(Number(e.target.value))} />
        </label>
        <label className="block font-black">
          Fonds sécu / membre / jour
          <input className={field} type="number" value={secu} onChange={(e) => setSecu(Number(e.target.value))} />
        </label>
      </div>

      <label className="block font-black">
        Nom collecteur
        <input className={field} value={collecteurNom} onChange={(e) => setCollecteurNom(e.target.value)} />
      </label>
      <label className="block font-black">
        Téléphone collecteur
        <input className={field} value={collecteurTel} onChange={(e) => setCollecteurTel(e.target.value)} />
      </label>

      <fieldset className="rounded-3xl bg-white p-4 shadow-card">
        <legend className="font-black">Mode tirage</legend>
        <label className="mt-2 flex items-start gap-2 font-bold">
          <input type="radio" checked={mode === "intelligent"} onChange={() => setMode("intelligent")} />
          Intelligent (sécurisé) — jours 1-5 réservés aux scores ≥ 4.5
        </label>
        <label className="mt-2 flex items-start gap-2 font-bold">
          <input type="radio" checked={mode === "hasard"} onChange={() => setMode("hasard")} />
          100% Hasard — parmi ceux qui ont payé aujourd&apos;hui
        </label>
      </fieldset>

      <div className="rounded-3xl bg-gabon-blue p-4 text-white">
        <p className="font-black uppercase">Ton revenu estimé (groupe plein)</p>
        <p>Frais service : {fcfa(preview.service)}</p>
        <p>1 express : {fcfa(preview.expressUn)}</p>
        <p>Fonds sécu total : {fcfa(preview.fonds)} (50% fête / 50% toi si 0 fuite)</p>
      </div>

      <button type="submit" className="giant-btn bg-gabon-green">
        Créer le groupe
      </button>
    </form>
  );
}
