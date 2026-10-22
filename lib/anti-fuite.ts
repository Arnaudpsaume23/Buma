import type { FondsSecurite, Groupe, Membre } from "./types";

export function applyOnTimeStreak(score: number, streak: number): number {
  if (streak > 0 && streak % 5 === 0) {
    return Math.min(5, Number((score + 0.5).toFixed(1)));
  }
  return score;
}

export function applyLatePenalty(): number {
  return 0;
}

export function confiscateGarantie(membre: Membre, groupe: Groupe) {
  return {
    membre: {
      ...membre,
      statut: "exclu" as const,
      garantie_payée: false,
      solde_garantie: 0,
      score_confiance: 0,
    },
    versMarmite: groupe.garantie,
  };
}

export function coverFlight(opts: {
  joursRestants: number;
  montantJournalier: number;
  garantie: number;
  fonds: FondsSecurite;
}): {
  dette: number;
  fromGarantie: number;
  fromFonds: number;
  resteACharge: number;
  fonds: FondsSecurite;
} {
  const dette = opts.joursRestants * opts.montantJournalier;
  const fromGarantie = Math.min(opts.garantie, dette);
  let reste = dette - fromGarantie;
  const fromFonds = Math.min(opts.fonds.montant_restant, reste);
  reste -= fromFonds;
  return {
    dette,
    fromGarantie,
    fromFonds,
    resteACharge: reste,
    fonds: {
      ...opts.fonds,
      montant_utilisé_pour_fuite: opts.fonds.montant_utilisé_pour_fuite + fromFonds,
      montant_restant: opts.fonds.montant_restant - fromFonds,
      historique_utilisation: [
        ...opts.fonds.historique_utilisation,
        {
          date: new Date().toISOString().slice(0, 10),
          motif: `Compensation fuite (dette ${dette} FCFA)`,
          montant: fromFonds,
        },
      ],
    },
  };
}

export function feteFin(fonds: FondsSecurite, nbMembres: number) {
  const dist = Math.floor(fonds.montant_restant * 0.5);
  const parMembre = nbMembres ? Math.floor(dist / nbMembres) : 0;
  const primeGestion = fonds.montant_restant - dist;
  return { dist, parMembre, primeGestion };
}

export function punishGarants(
  all: Membre[],
  fuyard: Membre,
): Membre[] {
  const tels = new Set([fuyard.garant_1_tel, fuyard.garant_2_tel]);
  return all.map((m) => {
    if (tels.has(m.telephone) || m.id === fuyard.id) {
      return { ...m, score_confiance: 0 };
    }
    return m;
  });
}
