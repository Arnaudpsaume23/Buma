-- Buma — schéma Supabase (PostgreSQL)
-- Coller dans l'éditeur SQL du projet.

create extension if not exists "pgcrypto";

create table if not exists groupes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  nb_membres int not null check (nb_membres between 10 and 50),
  montant_journalier int not null,
  montant_marmite int not null,
  frais_service int not null default 200,
  frais_express_pct numeric not null default 3,
  garantie int not null default 10000,
  fonds_secu_jour int not null default 100,
  heure_tirage time not null default '18:00',
  jour_repos text not null default 'dimanche' check (jour_repos in ('dimanche', 'aucun')),
  collecteur_tel text not null,
  collecteur_nom text not null,
  statut text not null default 'actif' check (statut in ('actif', 'terminé', 'termine')),
  jour_actuel int not null default 1,
  mode_tirage text not null default 'intelligent' check (mode_tirage in ('intelligent', 'hasard')),
  date_debut date not null default current_date
);

create table if not exists membres (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references groupes(id) on delete cascade,
  nom text not null,
  telephone text not null,
  qr_code text not null unique,
  score_confiance numeric not null default 3 check (score_confiance between 0 and 5),
  a_gagné boolean not null default false,
  jour_gagné int,
  date_inscription date not null default current_date,
  garant_1_nom text not null,
  garant_1_tel text not null,
  garant_2_nom text not null,
  garant_2_tel text not null,
  garantie_payée boolean not null default false,
  solde_garantie int not null default 0,
  solde_epargné int not null default 0,
  jours_payés int not null default 0,
  statut text not null default 'actif' check (statut in ('actif', 'exclu')),
  tontines_terminees int[] not null default '{}'
);

create table if not exists paiements_journaliers (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null references membres(id) on delete cascade,
  groupe_id uuid not null references groupes(id) on delete cascade,
  date date not null,
  jour_numero int not null,
  montant int not null,
  montant_frais_service int not null,
  montant_fonds_secu int not null,
  montant_total_payé int not null,
  id_transaction_airtel text,
  heure_paiement time,
  collecteur_id text,
  statut text not null check (statut in ('Payé', 'Retard', 'Exclu')),
  mode_paiement text not null check (mode_paiement in ('Airtel', 'QR', 'Espece')),
  unique (membre_id, jour_numero)
);

create table if not exists tirages (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references groupes(id) on delete cascade,
  date_tirage date not null,
  jour_numero int not null,
  membres_eligibles uuid[] not null default '{}',
  membres_payés_aujourdhui uuid[] not null default '{}',
  gagnant_id uuid references membres(id),
  seed_hasard text not null,
  video_url text,
  heure_tirage time not null,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'tiré', 'tire', 'payé', 'paye')),
  mode_paiement_gagnant text check (mode_paiement_gagnant in ('standard', 'express')),
  unique (groupe_id, jour_numero)
);

create table if not exists fonds_securite (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null unique references groupes(id) on delete cascade,
  montant_total_collecté int not null default 0,
  montant_utilisé_pour_fuite int not null default 0,
  montant_restant int not null default 0,
  historique_utilisation jsonb not null default '[]'::jsonb
);

create index if not exists idx_membres_groupe on membres(groupe_id);
create index if not exists idx_paiements_groupe_jour on paiements_journaliers(groupe_id, jour_numero);
create index if not exists idx_tirages_groupe on tirages(groupe_id);

alter table groupes enable row level security;
alter table membres enable row level security;
alter table paiements_journaliers enable row level security;
alter table tirages enable row level security;
alter table fonds_securite enable row level security;
