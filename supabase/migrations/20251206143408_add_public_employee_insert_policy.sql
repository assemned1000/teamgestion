/*
  # Allow Public Employee Form Submissions

  1. Changes
    - Add RLS policy to allow anonymous users to insert new employee records
    - This enables the public employee application form to work without authentication
  
  2. Security
    - Only INSERT operations are allowed
    - Public users cannot read, update, or delete employee records
    - All other operations still require authentication
*/

CREATE POLICY "Allow public employee submissions"
  ON employees FOR INSERT
  TO anon
  WITH CHECK (true);
