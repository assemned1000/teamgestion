/*
  # Add UPDATE and DELETE policies to employees table

  1. Changes
    - Add policy to allow authenticated users to update employees
    - Add policy to allow authenticated users to delete employees
  
  2. Security
    - Only authenticated users can modify employees
    - Users must have appropriate permissions
*/

CREATE POLICY "Allow authenticated users to update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'employees'
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'manager', 'directeur_general', 'manager_general') OR up.can_update = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'employees'
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'manager', 'directeur_general', 'manager_general') OR up.can_update = true)
    )
  );

CREATE POLICY "Allow authenticated users to delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'employees'
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'manager', 'directeur_general', 'manager_general') OR up.can_delete = true)
    )
  );
