/*
  # Allow authenticated users to update exchange rate

  1. Changes
    - Drop the existing restrictive "Admins can manage settings" policy
    - Create new policies that allow all authenticated users to update settings
    - Keep the read policy for all authenticated users
  
  2. Security
    - All authenticated users can now update settings (specifically exchange rate)
    - All authenticated users can read settings
*/

-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;

-- Create new policies for all authenticated users
CREATE POLICY "Authenticated users can insert settings"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete settings"
  ON settings
  FOR DELETE
  TO authenticated
  USING (true);
