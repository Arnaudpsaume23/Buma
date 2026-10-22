export type GroupeStatut = "actif" | "termine";
export type MembreStatut = "actif" | "exclu";
export type PaiementStatut = "Payé" | "Retard" | "Exclu";
export type ModePaiement = "Airtel" | "QR" | "Espece";
export type ModeTirage = "intelligent" | "hasard";
export type JourRepos = "dimanche" | "aucun";
export type TirageStatut = "en_attente" | "tire" | "paye";
export type ModePaiementGagnant = "standard" | "express";
export type RoleDemo = "collecteur" | "membre" | "admin";

export interface Groupe {
  id: string;
  nom: string;
  nb_membres: number;
  montant_journalier: number;
  montant_marmite: number;
  frais_service: number;
  frais_express_pct: number;
  garantie: number;
  fonds_secu_jour: number;
  heure_tirage: string;
  jour_repos: JourRepos;
  collecteur_tel: string;
  collecteur_nom: string;
  statut: GroupeStatut;
  jour_actuel: number;
  mode_tirage: ModeTirage;
  date_debut: string;
}

export interface Membre {
  id: string;
  groupe_id: string;
  nom: string;
  telephone: string;
  qr_code: string;
  score_confiance: number;
  a_gagne: boolean;
  jour_gagné: number | null;
  date_inscription: string;
  garant_1_nom: string;
  garant_1_tel: string;
  garant_2_nom: string;
  garant_2_tel: string;
  garantie_payée: boolean;
  solde_garantie: number;
  solde_epargné: number;
  jours_payés: number;
  statut: MembreStatut;
  tontines_terminees: number[];
  jours_a_lheure_consecutifs: number;
}

export interface PaiementJournalier {
  id: string;
  membre_id: string;
  groupe_id: string;
  date: string;
  jour_numero: number;
  montant: number;
  montant_frais_service: number;
  montant_fonds_secu: number;
  montant_total_payé: number;
  id_transaction_airtel: string;
  heure_paiement: string;
  collecteur_id: string;
  statut: PaiementStatut;
  mode_paiement: ModePaiement;
}

export interface Tirage {
  id: string;
  groupe_id: string;
  date_tirage: string;
  jour_numero: number;
  membres_eligibles: string[];
  membres_payés_aujourdhui: string[];
  gagnant_id: string | null;
  seed_hasard: string;
  video_url: string;
  heure_tirage: string;
  statut: TirageStatut;
  mode_paiement_gagnant: ModePaiementGagnant | null;
}

export interface FondsSecurite {
  id: string;
  groupe_id: string;
  montant_total_collecté: number;
  montant_utilisé_pour_fuite: number;
  montant_restant: number;
  historique_utilisation: { date: string; motif: string; montant: number }[];
}

export interface BumaState {
  groupes: Groupe[];
  membres: Membre[];
  paiements: PaiementJournalier[];
  tirages: Tirage[];
  fonds: FondsSecurite[];
  role: RoleDemo;
  demo18h: boolean;
  horsLigne: boolean;
}
