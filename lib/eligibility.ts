import type { Groupe, Membre, PaiementJournalier } from "./types";

export function paidToday(
  paiements: PaiementJournalier[],
  groupeId: string,
  jour: number,
): Set<string> {
  return new Set(
    paiements
      .filter(
        (p) =>
          p.groupe_id === groupeId &&
          p.jour_numero === jour &&
          p.statut === "Payé",
      )
      .map((p) => p.membre_id),
  );
}

export function paidDays(
  paiements: PaiementJournalier[],
  membreId: string,
): Set<number> {
  return new Set(
    paiements
      .filter((p) => p.membre_id === membreId && p.statut === "Payé")
      .map((p) => p.jour_numero),
  );
}

export function firstUnpaidDay(
  paiements: PaiementJournalier[],
  membreId: string,
  jusqua: number,
): number | null {
  const paid = paidDays(paiements, membreId);
  for (let j = 1; j <= jusqua; j += 1) {
    if (!paid.has(j)) return j;
  }
  return null;
}

export function canPayDay(
  membre: Membre,
  paiements: PaiementJournalier[],
  jourVise: number,
  jourActuel: number,
): { ok: boolean; raison?: string } {
  if (membre.statut === "exclu") {
    return { ok: false, raison: "Membre exclu — garantie confisquée." };
  }
  if (jourVise > jourActuel) {
    return { ok: false, raison: "Impossible de payer un jour futur." };
  }
  const unpaid = firstUnpaidDay(paiements, membre.id, jourActuel);
  if (unpaid && unpaid < jourVise) {
    return {
      ok: false,
      raison: `Dette Jour ${unpaid} à solder d'abord. Pas de paiement double.`,
    };
  }
  const paid = paidDays(paiements, membre.id);
  if (paid.has(jourVise)) {
    return { ok: false, raison: "Ce jour est déjà payé." };
  }
  if (jourVise < jourActuel - 1) {
    return {
      ok: false,
      raison: "Plus d'1 jour de tolérance — exclusion automatique.",
    };
  }
  return { ok: true };
}

export function shouldExclude(
  membre: Membre,
  paiements: PaiementJournalier[],
  jourActuel: number,
): boolean {
  if (membre.statut === "exclu") return true;
  const unpaid = firstUnpaidDay(paiements, membre.id, jourActuel);
  if (!unpaid) return false;
  return jourActuel - unpaid >= 2;
}

export function eligibleForDraw(opts: {
  groupe: Groupe;
  membres: Membre[];
  paiements: PaiementJournalier[];
  jour: number;
}): Membre[] {
  const { groupe, membres, paiements, jour } = opts;
  const paid = paidToday(paiements, groupe.id, jour);
  const pool = membres.filter(
    (m) =>
      m.groupe_id === groupe.id &&
      m.statut === "actif" &&
      !m.a_gagne &&
      m.garantie_payée &&
      paid.has(m.id),
  );

  if (groupe.mode_tirage === "hasard") return pool;

  if (jour <= 5) {
    return pool.filter((m) => m.score_confiance >= 4.5);
  }
  if (jour <= 20) {
    return pool.filter((m) => m.score_confiance >= 3);
  }
  return pool;
}

export function canJoinHighStake(membreLike: {
  tontines_terminees: number[];
  montantCible: number;
}): { ok: boolean; raison?: string } {
  if (membreLike.montantCible < 10000) return { ok: true };
  const ok = membreLike.tontines_terminees.some((m) => m === 1000 || m === 2000);
  if (!ok) {
    return {
      ok: false,
      raison:
        "Ticket d'entrée : terminer d'abord une tontine à 1.000 ou 2.000 FCFA.",
    };
  }
  return { ok: true };
}

export function drawUnlocked(
  payes: number,
  total: number,
  heureOk: boolean,
): { ok: boolean; raison?: string } {
  if (total === 0) return { ok: false, raison: "Aucun membre." };
  const ratio = payes / total;
  if (ratio < 0.8) {
    return {
      ok: false,
      raison: `Tirage bloqué : ${payes}/${total} payés (minimum 80%).`,
    };
  }
  if (!heureOk) {
    return { ok: false, raison: "Tirage disponible à 18h00 uniquement." };
  }
  return { ok: true };
}
