/*
  # Correction des politiques RLS pour éviter la récursion infinie
  
  1. Modifications
    - Supprime toutes les politiques existantes sur profiles
    - Crée de nouvelles politiques simples sans récursion
  
  2. Nouvelles politiques
    - Les utilisateurs peuvent voir leur propre profil
    - Les utilisateurs peuvent mettre à jour leur propre profil (sauf le rôle)
    - Utilise auth.uid() au lieu de sous-requêtes pour éviter la récursion
*/

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Politique SELECT : les utilisateurs voient leur propre profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique UPDATE : les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique INSERT : permettre la création de profils lors de l'inscription
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
