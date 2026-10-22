import type { Groupe, Membre, PaiementJournalier, Tirage, FondsSecurite } from "./types";

/**
 * Client Supabase (placeholder). Le front tourne 100% mock / localStorage.
 * Quand les clés seront prêtes : créer le projet, coller supabase/schema.sql,
 * puis remplacer BumaProvider par ces appels.
 */
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export type Tables = {
  groupes: Groupe;
  membres: Membre;
  paiements_journaliers: PaiementJournalier;
  tirages: Tirage;
  fonds_securite: FondsSecurite;
};
