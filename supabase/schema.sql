-- ============================================================
-- Schéma CRM Plomberie / Serrurerie
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- Table des interventions
create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  technicien text not null,
  agence text not null,
  type_intervention text not null,
  mission text not null,
  client_nom text not null,
  client_adresse text not null,
  client_cp text not null,
  client_ville text not null,
  client_tel text not null,
  num_devis text not null,
  num_facture text not null,
  date_facture date,
  montant_ttc numeric not null,
  tva text not null,
  type_reglement text not null,
  payee boolean not null default false,
  origine text not null,
  date_intervention date not null,
  a_finir boolean not null default false,
  commentaire text,
  attachments jsonb not null default '[]'::jsonb
);

-- Listes déroulantes gérables (techniciens / agences)
create table if not exists public.techniciens (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique
);

create table if not exists public.agences (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique
);

-- Activer la sécurité au niveau des lignes
alter table public.interventions enable row level security;
alter table public.techniciens enable row level security;
alter table public.agences enable row level security;

-- Toute personne connectée (un compte par technicien) peut tout lire/écrire
-- car les fiches sont partagées entre toute l'équipe.
create policy "lecture_equipe_interventions" on public.interventions
  for select using (auth.role() = 'authenticated');
create policy "ecriture_equipe_interventions" on public.interventions
  for insert with check (auth.role() = 'authenticated');
create policy "modif_equipe_interventions" on public.interventions
  for update using (auth.role() = 'authenticated');
create policy "suppr_equipe_interventions" on public.interventions
  for delete using (auth.role() = 'authenticated');

create policy "lecture_equipe_techniciens" on public.techniciens
  for select using (auth.role() = 'authenticated');
create policy "ecriture_equipe_techniciens" on public.techniciens
  for insert with check (auth.role() = 'authenticated');
create policy "suppr_equipe_techniciens" on public.techniciens
  for delete using (auth.role() = 'authenticated');

create policy "lecture_equipe_agences" on public.agences
  for select using (auth.role() = 'authenticated');
create policy "ecriture_equipe_agences" on public.agences
  for insert with check (auth.role() = 'authenticated');
create policy "suppr_equipe_agences" on public.agences
  for delete using (auth.role() = 'authenticated');

-- Bucket de stockage pour les pièces jointes (devis, factures, photos)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "lecture_equipe_fichiers" on storage.objects
  for select using (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "depot_equipe_fichiers" on storage.objects
  for insert with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "suppr_equipe_fichiers" on storage.objects
  for delete using (bucket_id = 'attachments' and auth.role() = 'authenticated');
