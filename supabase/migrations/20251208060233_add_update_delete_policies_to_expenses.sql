/*
  # Add UPDATE and DELETE policies to expenses table

  1. Changes
    - Add policy to allow authenticated users to update expenses
    - Add policy to allow authenticated users to delete expenses
  
  2. Security
    - Only authenticated users can modify expenses
    - Maintains data integrity while allowing necessary operations
*/

CREATE POLICY "Allow authenticated users to update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (true);
