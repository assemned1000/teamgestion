/*
  # Système de permissions utilisateurs et stockage

  1. Nouvelles tables
    - `user_permissions` : gère les droits d'accès de chaque utilisateur par module
      - `user_id` (uuid, FK vers profiles)
      - `module` (text) : nom du module (employees, clients, equipment, salaries, expenses, dashboard, organization)
      - `can_read` (boolean) : peut lire les données
      - `can_create` (boolean) : peut créer des données
      - `can_update` (boolean) : peut modifier des données
      - `can_delete` (boolean) : peut supprimer des données

  2. Storage Buckets
    - `employee-photos` : pour stocker les photos des salariés
    - `expense-files` : pour stocker les justificatifs de dépenses

  3. Sécurité
    - Enable RLS sur user_permissions
    - Politiques pour que les admins puissent gérer les permissions
    - Politiques pour que les utilisateurs puissent lire leurs propres permissions
    - Politiques de storage pour les uploads sécurisés
*/

-- Créer la table user_permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('employees', 'clients', 'equipment', 'salaries', 'expenses', 'dashboard', 'organization')),
  can_read boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_update boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_permissions
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert permissions"
  ON user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update permissions"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete permissions"
  ON user_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Créer les buckets de storage s'ils n'existent pas
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('employee-photos', 'employee-photos', true),
  ('expense-files', 'expense-files', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques de storage pour employee-photos (public read, authenticated write)
CREATE POLICY "Public can view employee photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'employee-photos');

CREATE POLICY "Authenticated users can upload employee photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-photos');

CREATE POLICY "Authenticated users can update employee photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'employee-photos')
  WITH CHECK (bucket_id = 'employee-photos');

CREATE POLICY "Authenticated users can delete employee photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee-photos');

-- Politiques de storage pour expense-files (private, only authenticated)
CREATE POLICY "Authenticated can view expense files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'expense-files');

CREATE POLICY "Authenticated can upload expense files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'expense-files');

CREATE POLICY "Authenticated can update expense files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'expense-files')
  WITH CHECK (bucket_id = 'expense-files');

CREATE POLICY "Authenticated can delete expense files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'expense-files');

-- Fonction pour donner toutes les permissions aux admins automatiquement
CREATE OR REPLACE FUNCTION grant_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    -- Supprimer les permissions existantes
    DELETE FROM user_permissions WHERE user_id = NEW.id;
    
    -- Créer toutes les permissions pour l'admin
    INSERT INTO user_permissions (user_id, module, can_read, can_create, can_update, can_delete)
    VALUES
      (NEW.id, 'employees', true, true, true, true),
      (NEW.id, 'clients', true, true, true, true),
      (NEW.id, 'equipment', true, true, true, true),
      (NEW.id, 'salaries', true, true, true, true),
      (NEW.id, 'expenses', true, true, true, true),
      (NEW.id, 'dashboard', true, true, true, true),
      (NEW.id, 'organization', true, true, true, true)
    ON CONFLICT (user_id, module) 
    DO UPDATE SET
      can_read = true,
      can_create = true,
      can_update = true,
      can_delete = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour attribuer automatiquement les permissions aux admins
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
CREATE TRIGGER on_profile_role_change
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION grant_admin_permissions();

-- Donner les permissions à l'admin existant
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    DELETE FROM user_permissions WHERE user_id = admin_user_id;
    
    INSERT INTO user_permissions (user_id, module, can_read, can_create, can_update, can_delete)
    VALUES
      (admin_user_id, 'employees', true, true, true, true),
      (admin_user_id, 'clients', true, true, true, true),
      (admin_user_id, 'equipment', true, true, true, true),
      (admin_user_id, 'salaries', true, true, true, true),
      (admin_user_id, 'expenses', true, true, true, true),
      (admin_user_id, 'dashboard', true, true, true, true),
      (admin_user_id, 'organization', true, true, true, true);
  END IF;
END $$;
