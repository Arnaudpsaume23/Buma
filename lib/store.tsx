"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyLatePenalty,
  applyOnTimeStreak,
  confiscateGarantie,
  coverFlight,
  punishGarants,
} from "./anti-fuite";
import {
  canJoinHighStake,
  canPayDay,
  eligibleForDraw,
  firstUnpaidDay,
  paidToday,
  shouldExclude,
} from "./eligibility";
import { todayISO } from "./format";
import { makeSeed, pickId } from "./seeded-random";
import { buildSeed, GROUPE_ID } from "./seed";
import type {
  BumaState,
  Groupe,
  Membre,
  ModePaiement,
  ModePaiementGagnant,
  PaiementJournalier,
  RoleDemo,
  Tirage,
} from "./types";

const KEY = "buma-state-v1";

function load(): BumaState {
  const seed = buildSeed();
  const base: BumaState = {
    ...seed,
    role: "collecteur",
    demo18h: true,
    horsLigne: false,
  };
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    return { ...base, ...JSON.parse(raw) };
  } catch {
    return base;
  }
}

type Store = BumaState & {
  ready: boolean;
  resetDemo: () => void;
  setRole: (r: RoleDemo) => void;
  setDemo18h: (v: boolean) => void;
  toggleHorsLigne: () => void;
  createGroupe: (g: Omit<Groupe, "id" | "montant_marmite" | "statut" | "jour_actuel">) => string;
  addMembre: (m: Omit<Membre, "id" | "qr_code" | "a_gagne" | "jour_gagné" | "jours_payés" | "solde_epargné" | "statut" | "jours_a_lheure_consecutifs">) => { ok: boolean; raison?: string; id?: string };
  recordPayment: (opts: {
    membreId: string;
    groupeId: string;
    airtelId: string;
    mode: ModePaiement;
  }) => { ok: boolean; raison?: string };
  launchTirage: (groupeId: string) => { ok: boolean; raison?: string; tirage?: Tirage };
  setPayout: (tirageId: string, mode: ModePaiementGagnant) => void;
  markFlight: (membreId: string) => { ok: boolean; sms: string[] };
  rapportJour: (groupeId: string) => string;
  applyExclusions: (groupeId: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function BumaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BumaState>(() => ({
    ...buildSeed(),
    role: "collecteur",
    demo18h: true,
    horsLigne: false,
  }));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const persist = useCallback((updater: (s: BumaState) => BumaState) => {
    setState((s) => updater(s));
  }, []);

  const value = useMemo<Store>(() => {
    return {
      ...state,
      ready,
      resetDemo: () => {
        localStorage.removeItem(KEY);
        setState({
          ...buildSeed(),
          role: "collecteur",
          demo18h: true,
          horsLigne: false,
        });
      },
      setRole: (r) => persist((s) => ({ ...s, role: r })),
      setDemo18h: (v) => persist((s) => ({ ...s, demo18h: v })),
      toggleHorsLigne: () => persist((s) => ({ ...s, horsLigne: !s.horsLigne })),
      createGroupe: (g) => {
        const id = `g-${Date.now()}`;
        const groupe: Groupe = {
          ...g,
          id,
          montant_marmite: g.nb_membres * g.montant_journalier,
          statut: "actif",
          jour_actuel: 1,
        };
        persist((s) => ({
          ...s,
          groupes: [groupe, ...s.groupes],
          fonds: [
            {
              id: `fs-${id}`,
              groupe_id: id,
              montant_total_collecté: 0,
              montant_utilisé_pour_fuite: 0,
              montant_restant: 0,
              historique_utilisation: [],
            },
            ...s.fonds,
          ],
        }));
        return id;
      },
      addMembre: (m) => {
        const groupe = state.groupes.find((g) => g.id === m.groupe_id);
        if (!groupe) return { ok: false, raison: "Groupe introuvable." };
        const ticket = canJoinHighStake({
          tontines_terminees: m.tontines_terminees,
          montantCible: groupe.montant_journalier,
        });
        if (!ticket.ok) return ticket;
        if (m.score_confiance <= 0) {
          return { ok: false, raison: "Score à 0 : interdit de rejoindre un groupe (garant d'un fuyard)." };
        }
        if (!m.garantie_payée) {
          return { ok: false, raison: "Garantie d'entrée Airtel bloquée obligatoire." };
        }
        const n = state.membres.filter((x) => x.groupe_id === m.groupe_id).length + 1;
        const id = `m-${m.groupe_id}-${n}`;
        const membre: Membre = {
          ...m,
          id,
          qr_code: `BUMA-${m.groupe_id.slice(0, 6).toUpperCase()}-${String(n).padStart(2, "0")}`,
          a_gagne: false,
          jour_gagné: null,
          jours_payés: 0,
          solde_epargné: 0,
          statut: "actif",
          jours_a_lheure_consecutifs: 0,
        };
        persist((s) => ({ ...s, membres: [...s.membres, membre] }));
        return { ok: true, id };
      },
      recordPayment: ({ membreId, groupeId, airtelId, mode }) => {
        const groupe = state.groupes.find((g) => g.id === groupeId);
        const membre = state.membres.find((m) => m.id === membreId);
        if (!groupe || !membre) return { ok: false, raison: "Introuvable." };
        if (!/^AM-[\w-]+$/i.test(airtelId.trim()) && mode !== "Espece") {
          return { ok: false, raison: "ID Airtel invalide. Format simulé : AM-xxxx" };
        }
        const target =
          firstUnpaidDay(state.paiements, membreId, groupe.jour_actuel) ??
          groupe.jour_actuel;
        const check = canPayDay(
          membre,
          state.paiements,
          target,
          groupe.jour_actuel,
        );
        if (!check.ok) return check;
        const now = new Date();
        const p: PaiementJournalier = {
          id: `p-${membreId}-j${target}-${now.getTime()}`,
          membre_id: membreId,
          groupe_id: groupeId,
          date: todayISO(groupe.date_debut, target),
          jour_numero: target,
          montant: groupe.montant_journalier,
          montant_frais_service: groupe.frais_service,
          montant_fonds_secu: groupe.fonds_secu_jour,
          montant_total_payé:
            groupe.montant_journalier +
            groupe.frais_service +
            groupe.fonds_secu_jour,
          id_transaction_airtel: mode === "Espece" ? "ESPECE" : airtelId.trim().toUpperCase(),
          heure_paiement: now.toTimeString().slice(0, 5),
          collecteur_id: "collecteur-1",
          statut: "Payé",
          mode_paiement: mode,
        };
        persist((s) => {
          const membres = s.membres.map((mm) => {
            if (mm.id !== membreId) return mm;
            const streak = mm.jours_a_lheure_consecutifs + 1;
            return {
              ...mm,
              jours_payés: mm.jours_payés + 1,
              solde_epargné: mm.solde_epargné + groupe.montant_journalier,
              jours_a_lheure_consecutifs: streak,
              score_confiance: applyOnTimeStreak(mm.score_confiance, streak),
            };
          });
          const fonds = s.fonds.map((f) =>
            f.groupe_id === groupeId
              ? {
                  ...f,
                  montant_total_collecté: f.montant_total_collecté + groupe.fonds_secu_jour,
                  montant_restant: f.montant_restant + groupe.fonds_secu_jour,
                }
              : f,
          );
          return { ...s, paiements: [...s.paiements, p], membres, fonds };
        });
        return { ok: true };
      },
      launchTirage: (groupeId) => {
        const groupe = state.groupes.find((g) => g.id === groupeId);
        if (!groupe) return { ok: false, raison: "Groupe introuvable." };
        const already = state.tirages.find(
          (t) => t.groupe_id === groupeId && t.jour_numero === groupe.jour_actuel,
        );
        if (already?.gagnant_id) {
          return { ok: false, raison: "Tirage déjà effectué aujourd'hui.", tirage: already };
        }
        const eligibles = eligibleForDraw({
          groupe,
          membres: state.membres,
          paiements: state.paiements,
          jour: groupe.jour_actuel,
        });
        if (!eligibles.length) {
          return { ok: false, raison: "Aucun membre éligible (impayés / déjà gagné / score)." };
        }
        const date = todayISO(groupe.date_debut, groupe.jour_actuel);
        const seed = makeSeed(date, groupe.id, groupe.jour_actuel);
        const gagnantId = pickId(
          eligibles.map((m) => m.id),
          seed,
        );
        const paid = [...paidToday(state.paiements, groupe.id, groupe.jour_actuel)];
        const tirage: Tirage = {
          id: `t-${groupe.id}-j${groupe.jour_actuel}`,
          groupe_id: groupe.id,
          date_tirage: date,
          jour_numero: groupe.jour_actuel,
          membres_eligibles: eligibles.map((m) => m.id),
          membres_payés_aujourdhui: paid,
          gagnant_id: gagnantId,
          seed_hasard: seed,
          video_url: `https://buma.ga/videos/tirage-${groupe.id}-j${groupe.jour_actuel}.mp4`,
          heure_tirage: groupe.heure_tirage,
          statut: "tire",
          mode_paiement_gagnant: null,
        };
        persist((s) => ({
          ...s,
          tirages: [
            ...s.tirages.filter((t) => t.id !== tirage.id),
            tirage,
          ],
          membres: s.membres.map((m) =>
            m.id === gagnantId
              ? { ...m, a_gagne: true, jour_gagné: groupe.jour_actuel }
              : m,
          ),
        }));
        return { ok: true, tirage };
      },
      setPayout: (tirageId, mode) => {
        persist((s) => ({
          ...s,
          tirages: s.tirages.map((t) =>
            t.id === tirageId
              ? { ...t, mode_paiement_gagnant: mode, statut: "paye" }
              : t,
          ),
        }));
      },
      markFlight: (membreId) => {
        const membre = state.membres.find((m) => m.id === membreId);
        const groupe = state.groupes.find((g) => g.id === membre?.groupe_id);
        if (!membre || !groupe) return { ok: false, sms: [] };
        const joursRestants = groupe.nb_membres - membre.jours_payés;
        const fonds = state.fonds.find((f) => f.groupe_id === groupe.id)!;
        const { membre: exclu, versMarmite } = confiscateGarantie(membre, groupe);
        const cover = coverFlight({
          joursRestants,
          montantJournalier: groupe.montant_journalier,
          garantie: versMarmite,
          fonds,
        });
        persist((s) => ({
          ...s,
          membres: punishGarants(
            s.membres.map((m) => (m.id === membreId ? exclu : m)),
            membre,
          ),
          fonds: s.fonds.map((f) => (f.groupe_id === groupe.id ? cover.fonds : f)),
        }));
        return {
          ok: true,
          sms: [
            `SMS → ${membre.garant_1_nom} (${membre.garant_1_tel}) : ${membre.nom} a fuit la tontine Buma. Votre score passe à 0.`,
            `SMS → ${membre.garant_2_nom} (${membre.garant_2_tel}) : ${membre.nom} a fuit la tontine Buma. Votre score passe à 0.`,
          ],
        };
      },
      rapportJour: (groupeId) => {
        const groupe = state.groupes.find((g) => g.id === groupeId);
        if (!groupe) return "";
        const membres = state.membres.filter((m) => m.groupe_id === groupeId);
        const paid = paidToday(state.paiements, groupeId, groupe.jour_actuel);
        const retards = membres.filter(
          (m) => m.statut === "actif" && !paid.has(m.id),
        );
        const exclus = membres.filter((m) => m.statut === "exclu");
        return [
          `📊 RAPPORT BUMA — ${groupe.nom}`,
          `Jour ${groupe.jour_actuel}/${groupe.nb_membres} — ${groupe.heure_tirage}`,
          `Marmite : ${groupe.montant_marmite.toLocaleString("fr-FR")} FCFA`,
          `Payés : ${paid.size}/${membres.filter((m) => m.statut === "actif").length}`,
          retards.length
            ? `Retardataires : ${retards.map((m) => `${m.nom} (${m.telephone})`).join(", ")}`
            : "Aucun retardataire 🎉",
          exclus.length
            ? `Exclus : ${exclus.map((m) => m.nom).join(", ")}`
            : "Aucune exclusion",
          `Collecteur : ${groupe.collecteur_nom}`,
        ].join("\n");
      },
      applyExclusions: (groupeId) => {
        persist((s) => {
          const groupe = s.groupes.find((g) => g.id === groupeId);
          if (!groupe) return s;
          return {
            ...s,
            membres: s.membres.map((m) => {
              if (m.groupe_id !== groupeId) return m;
              if (shouldExclude(m, s.paiements, groupe.jour_actuel)) {
                return {
                  ...m,
                  statut: "exclu",
                  score_confiance: applyLatePenalty(),
                  solde_garantie: 0,
                  garantie_payée: false,
                };
              }
              return m;
            }),
          };
        });
      },
    };
  }, [persist, ready, state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBuma() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBuma hors provider");
  return ctx;
}

export function useGroupe(id: string) {
  const s = useBuma();
  const groupe = s.groupes.find((g) => g.id === id) ?? s.groupes.find((g) => g.id === GROUPE_ID);
  const membres = s.membres.filter((m) => m.groupe_id === groupe?.id);
  const paiements = s.paiements.filter((p) => p.groupe_id === groupe?.id);
  const tirages = s.tirages
    .filter((t) => t.groupe_id === groupe?.id)
    .sort((a, b) => a.jour_numero - b.jour_numero);
  const fonds = s.fonds.find((f) => f.groupe_id === groupe?.id);
  return { ...s, groupe, membres, paiements, tirages, fonds };
}
