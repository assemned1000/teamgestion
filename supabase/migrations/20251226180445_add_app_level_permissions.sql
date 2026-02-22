/*
  # Add App-Level Permissions System
  
  1. New Tables
    - `user_app_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `can_access_dashboard` (boolean) - Access to main dashboard page
      - `can_access_entreprises` (boolean) - Access to entreprises page
      - `can_access_personal` (boolean) - Access to personnel page
      - `can_access_users` (boolean) - Access to users management page
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Changes
    - Adds hierarchical permission system
    - Main app pages can be controlled separately from enterprise modules
    - Allows fine-grained access control at app level
  
  3. Security
    - Enable RLS on `user_app_permissions` table
    - Add policies for admins to manage app permissions
    - Add policies for users to read their own app permissions
*/

-- Create user_app_permissions table
CREATE TABLE IF NOT EXISTS user_app_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  can_access_dashboard boolean DEFAULT false,
  can_access_entreprises boolean DEFAULT false,
  can_access_personal boolean DEFAULT false,
  can_access_users boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_app_permissions_user_id ON user_app_permissions(user_id);

-- Enable RLS
ALTER TABLE user_app_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all app permissions
CREATE POLICY "Admins can read all app permissions"
  ON user_app_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'directeur_general')
    )
  );

-- Policy: Users can read their own app permissions
CREATE POLICY "Users can read own app permissions"
  ON user_app_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can insert app permissions
CREATE POLICY "Admins can insert app permissions"
  ON user_app_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'directeur_general')
    )
  );

-- Policy: Admins can update app permissions
CREATE POLICY "Admins can update app permissions"
  ON user_app_permissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'directeur_general')
    )
  );

-- Policy: Admins can delete app permissions
CREATE POLICY "Admins can delete app permissions"
  ON user_app_permissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'directeur_general')
    )
  );

-- Create default app permissions for existing users
INSERT INTO user_app_permissions (user_id, can_access_dashboard, can_access_entreprises, can_access_personal, can_access_users)
SELECT 
  id,
  true as can_access_dashboard,
  true as can_access_entreprises,
  true as can_access_personal,
  CASE WHEN role IN ('admin', 'directeur_general') THEN true ELSE false END as can_access_users
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_app_permissions)
ON CONFLICT (user_id) DO NOTHING;
