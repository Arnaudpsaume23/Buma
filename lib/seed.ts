import { makeSeed, pickId } from "./seeded-random";
import type {
  FondsSecurite,
  Groupe,
  Membre,
  PaiementJournalier,
  Tirage,
} from "./types";
import { todayISO } from "./format";

const NAMES = [
  "Pauline Obame",
  "Marthe Nguema",
  "Amina Bongo",
  "Esther Mba",
  "Jeanne Koumba",
  "Marie Ndong",
  "Fatou Sow",
  "Chantal Oyono",
  "Rose Mengue",
  "Sylvie Moussavou",
  "Béatrice Mintsa",
  "Nicole Ekomy",
  "Georgette Nze",
  "Hortense Allogo",
  "Victoire Maganga",
  "Justine Obiang",
  "Clémence Bounda",
  "Antoinette Minko",
  "Solange Ntoutoume",
  "Pierrette Ella",
  "Danielle Obone",
  "Francine Mezui",
  "Odette Nkoghe",
  "Patricia Ango",
  "Monique Ibinga",
  "Colette Mba",
  "Albertine Nzeng",
  "Yvette Nze",
  "Germaine Ondimba",
  "Sandrine Mebale",
];

const GARANTS = [
  ["Maman Antoinette", "Papa Jean"],
  ["Maman Rose", "Papa Pierre"],
  ["Maman Léonie", "Papa Michel"],
  ["Papa François", "Maman Odile"],
  ["Maman Claire", "Papa André"],
];

function tel(i: number): string {
  const n = 77001000 + i * 17;
  return `+241 0${String(n).slice(0, 2)} ${String(n).slice(2, 4)} ${String(n).slice(4, 6)} ${String(n).slice(6, 8)}`;
}

export const GROUPE_ID = "g-mont-bouet-1";
export const GROUPE_STARTER_ID = "g-starter-1000";

export function buildSeed(): {
  groupes: Groupe[];
  membres: Membre[];
  paiements: PaiementJournalier[];
  tirages: Tirage[];
  fonds: FondsSecurite[];
} {
  const dateDebut = "2026-10-06";
  const jourActuel = 12;
  const n = 30;
  const mnt = 10000;

  const groupe: Groupe = {
    id: GROUPE_ID,
    nom: "Mamans Mont-Bouët 1",
    nb_membres: n,
    montant_journalier: mnt,
    montant_marmite: n * mnt,
    frais_service: 200,
    frais_express_pct: 3,
    garantie: 10000,
    fonds_secu_jour: 100,
    heure_tirage: "18:00",
    jour_repos: "dimanche",
    collecteur_tel: "+241 077 00 00 01",
    collecteur_nom: "Jean-Pierre Mba",
    statut: "actif",
    jour_actuel: jourActuel,
    mode_tirage: "intelligent",
    date_debut: dateDebut,
  };

  const starter: Groupe = {
    id: GROUPE_STARTER_ID,
    nom: "Débutantes Mont-Bouët 1.000",
    nb_membres: 10,
    montant_journalier: 1000,
    montant_marmite: 10000,
    frais_service: 200,
    frais_express_pct: 3,
    garantie: 1000,
    fonds_secu_jour: 100,
    heure_tirage: "18:00",
    jour_repos: "aucun",
    collecteur_tel: "+241 077 00 00 01",
    collecteur_nom: "Jean-Pierre Mba",
    statut: "termine",
    jour_actuel: 10,
    mode_tirage: "hasard",
    date_debut: "2026-08-01",
  };

  const membres: Membre[] = NAMES.map((nom, i) => {
    const g = GARANTS[i % GARANTS.length];
    const score =
      i < 8 ? 5 : i < 14 ? 4.5 : i < 22 ? 3.5 : i < 28 ? 3 : 2.5;
    return {
      id: `m-${i + 1}`,
      groupe_id: GROUPE_ID,
      nom,
      telephone: tel(i),
      qr_code: `BUMA-MB1-${String(i + 1).padStart(2, "0")}`,
      score_confiance: score,
      a_gagne: false,
      jour_gagné: null,
      date_inscription: "2026-10-01",
      garant_1_nom: g[0],
      garant_1_tel: tel(100 + i),
      garant_2_nom: g[1],
      garant_2_tel: tel(200 + i),
      garantie_payée: true,
      solde_garantie: 10000,
      solde_epargné: 0,
      jours_payés: 0,
      statut: "actif",
      tontines_terminees: [1000, 2000],
      jours_a_lheure_consecutifs: Math.min(11, 4 + (i % 6)),
    };
  });

  const paiements: PaiementJournalier[] = [];
  const lateToday = new Set(["m-29", "m-30"]);

  for (let jour = 1; jour <= jourActuel; jour += 1) {
    const date = todayISO(dateDebut, jour);
    for (const m of membres) {
      if (jour === jourActuel && lateToday.has(m.id)) continue;
      const h = 7 + ((Number(m.id.slice(2)) + jour) % 8);
      const min = (jour * 7 + Number(m.id.slice(2)) * 3) % 60;
      paiements.push({
        id: `p-${m.id}-j${jour}`,
        membre_id: m.id,
        groupe_id: GROUPE_ID,
        date,
        jour_numero: jour,
        montant: mnt,
        montant_frais_service: 200,
        montant_fonds_secu: 100,
        montant_total_payé: 10300,
        id_transaction_airtel: `AM-${1000 + jour * 30 + Number(m.id.slice(2))}`,
        heure_paiement: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        collecteur_id: "collecteur-1",
        statut: "Payé",
        mode_paiement: jour % 5 === 0 ? "Espece" : "Airtel",
      });
    }
  }

  const tirages: Tirage[] = [];
  const remaining = [...membres];
  for (let jour = 1; jour < jourActuel; jour += 1) {
    const date = todayISO(dateDebut, jour);
    const paidIds = paiements
      .filter((p) => p.jour_numero === jour)
      .map((p) => p.membre_id);
    let pool = remaining.filter((m) => paidIds.includes(m.id) && !m.a_gagne);
    if (jour <= 5) pool = pool.filter((m) => m.score_confiance >= 4.5);
    else if (jour <= 20) pool = pool.filter((m) => m.score_confiance >= 3);
    const seed = makeSeed(date, GROUPE_ID, jour);
    const gagnantId = pickId(
      pool.map((m) => m.id),
      seed,
    );
    if (!gagnantId) continue;
    const winner = membres.find((m) => m.id === gagnantId)!;
    winner.a_gagne = true;
    winner.jour_gagné = jour;
    remaining.splice(
      remaining.findIndex((m) => m.id === gagnantId),
      1,
    );
    tirages.push({
      id: `t-j${jour}`,
      groupe_id: GROUPE_ID,
      date_tirage: date,
      jour_numero: jour,
      membres_eligibles: pool.map((m) => m.id),
      membres_payés_aujourdhui: paidIds,
      gagnant_id: gagnantId,
      seed_hasard: seed,
      video_url: `https://buma.ga/videos/tirage-jour-${jour}.mp4`,
      heure_tirage: "18:00",
      statut: jour <= 9 ? "paye" : "tire",
      mode_paiement_gagnant: jour % 4 === 0 ? "express" : "standard",
    });
  }

  for (const m of membres) {
    const jours = paiements.filter((p) => p.membre_id === m.id).length;
    m.jours_payés = jours;
    m.solde_epargné = jours * mnt;
  }

  const collected =
    paiements.filter((p) => p.groupe_id === GROUPE_ID).length * 100;

  const fonds: FondsSecurite = {
    id: "fs-1",
    groupe_id: GROUPE_ID,
    montant_total_collecté: collected,
    montant_utilisé_pour_fuite: 0,
    montant_restant: collected,
    historique_utilisation: [],
  };

  const extraGroupes: Groupe[] = [
    starter,
    {
      ...groupe,
      id: "g-pk8-2",
      nom: "Sœurs PK8 Rotative",
      jour_actuel: 8,
      statut: "actif",
      date_debut: "2026-10-10",
    },
    {
      ...groupe,
      id: "g-owendo-3",
      nom: "Vendeuses Owendo Marché",
      jour_actuel: 30,
      statut: "termine",
      date_debut: "2026-09-01",
    },
  ];

  return {
    groupes: [groupe, ...extraGroupes],
    membres,
    paiements,
    tirages,
    fonds: [
      fonds,
      {
        id: "fs-2",
        groupe_id: "g-pk8-2",
        montant_total_collecté: 24000,
        montant_utilisé_pour_fuite: 0,
        montant_restant: 24000,
        historique_utilisation: [],
      },
      {
        id: "fs-3",
        groupe_id: "g-owendo-3",
        montant_total_collecté: 90000,
        montant_utilisé_pour_fuite: 0,
        montant_restant: 90000,
        historique_utilisation: [],
      },
    ],
  };
}
