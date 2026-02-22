/*
  # Fix One-Time Tokens Insert Policy for All Admin Roles

  1. Changes
    - Drop existing INSERT policy on one_time_tokens table
    - Create new INSERT policy that includes all admin roles:
      - admin
      - manager
      - directeur_general
      - manager_general
    - This ensures all authorized users can generate public employee form links

  2. Security
    - Only users with administrative roles can create tokens
    - Regular employees cannot create tokens
    - Maintains secure access control
*/

DROP POLICY IF EXISTS "Authenticated users can create tokens" ON one_time_tokens;

CREATE POLICY "Authenticated admin users can create tokens"
  ON one_time_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'manager', 'directeur_general', 'manager_general')
    )
  );