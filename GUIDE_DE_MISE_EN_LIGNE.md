# Guide de mise en ligne — CRM Fiches d'intervention

Ce guide suppose que vous n'avez aucune connaissance technique. Suivez les étapes dans l'ordre, sans en sauter. Comptez environ 30 à 45 minutes la première fois. Une fois fait, vous n'aurez plus jamais à recommencer — seulement à ajouter des comptes techniciens de temps en temps.

---

## Étape 1 — Créer la base de données (Supabase, gratuit)

1. Allez sur **supabase.com** et créez un compte (avec votre email).
2. Cliquez sur **"New project"**. Donnez-lui un nom (ex : `crm-plomberie`), choisissez un mot de passe pour la base (notez-le quelque part), choisissez une région proche de vous (ex : Europe).
3. Attendez 1 à 2 minutes que le projet soit créé.
4. Dans le menu de gauche, cliquez sur **"SQL Editor"**, puis **"New query"**.
5. Ouvrez le fichier `supabase/schema.sql` fourni avec ce projet, copiez tout son contenu, collez-le dans la fenêtre, puis cliquez sur **"Run"**. Cela crée toutes les tables nécessaires.
6. Dans le menu de gauche, allez dans **"Project Settings" > "API"**. Vous y trouverez deux informations à garder sous la main :
   - **Project URL**
   - **anon public key** (une longue clé)

Gardez cet onglet ouvert, vous en aurez besoin à l'étape 3.

---

## Étape 2 — Déposer le code sur GitHub

1. Allez sur **github.com** et créez un compte gratuit.
2. Cliquez sur **"New repository"**. Nommez-le `crm-plomberie-serrurerie`, laissez-le en "Public" ou "Private" (peu importe), cliquez sur **"Create repository"**.
3. Sur la page qui suit, cliquez sur le lien **"uploading an existing file"**.
4. Faites glisser **tous les fichiers et dossiers** de ce projet (sauf le dossier `node_modules` s'il existe, et le fichier `.env.local`) dans la zone de dépôt.
5. Cliquez sur **"Commit changes"** en bas de page.

---

## Étape 3 — Mettre le site en ligne (Vercel, gratuit)

1. Allez sur **vercel.com** et créez un compte en cliquant sur **"Continue with GitHub"** (ça relie directement les deux services).
2. Cliquez sur **"Add New" > "Project"**.
3. Choisissez le dépôt `crm-plomberie-serrurerie` que vous venez de créer, cliquez sur **"Import"**.
4. Avant de cliquer sur "Deploy", ouvrez la section **"Environment Variables"** et ajoutez ces deux lignes (avec les valeurs récupérées à l'étape 1) :
   - `NEXT_PUBLIC_SUPABASE_URL` → collez le Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → collez la clé anon public
5. Cliquez sur **"Deploy"**. Patientez 1 à 2 minutes.
6. Une fois terminé, Vercel vous donne une adresse du type `crm-plomberie-serrurerie.vercel.app`. C'est l'adresse de votre site, utilisable immédiatement par toute l'équipe.

*(Optionnel : dans "Settings" du projet Vercel, vous pouvez brancher un nom de domaine personnalisé comme `crm.mon-entreprise.fr` si vous en achetez un.)*

---

## Étape 4 — Créer les comptes de votre équipe

1. Retournez sur votre projet Supabase.
2. Dans le menu de gauche, cliquez sur **"Authentication" > "Users"**.
3. Cliquez sur **"Add user" > "Create new user"**.
4. Entrez l'email et un mot de passe temporaire pour chaque technicien. Cochez "Auto Confirm User" pour qu'il puisse se connecter tout de suite.
5. Communiquez à chaque technicien son email et son mot de passe — ils pourront le changer plus tard si besoin.

Répétez pour chaque membre de l'équipe.

---

## Étape 5 — Installer le site comme une appli sur le téléphone

**Sur Android (Chrome) :**
Ouvrez l'adresse du site → menu ⋮ en haut à droite → **"Ajouter à l'écran d'accueil"**.

**Sur iPhone (Safari) :**
Ouvrez l'adresse du site → bouton de partage (carré avec flèche) → **"Sur l'écran d'accueil"**.

Une icône apparaît sur le téléphone, comme une vraie application.

---

## Pour aller plus loin

- **Ajouter/retirer un technicien** : refaites l'étape 4.
- **Modifier le site plus tard** : revenez me voir dans Claude avec vos demandes, je vous fournirai les fichiers modifiés à re-déposer sur GitHub (Vercel republie automatiquement à chaque mise à jour du dépôt).
- **Coûts** : Supabase et Vercel sont gratuits jusqu'à un usage largement suffisant pour une équipe de 15-20 personnes. Vous serez prévenu avant tout passage à un forfait payant.
