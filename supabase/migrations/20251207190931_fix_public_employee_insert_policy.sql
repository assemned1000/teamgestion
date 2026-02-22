/*
  # Fix Public Employee Form Submissions

  ## Summary
  This migration restores the ability for anonymous users to submit employee applications
  through the public form.

  ## Changes Made

  ### 1. Add INSERT Policy for Anonymous Users
  - Recreate the policy that allows anonymous users to insert employee records
  - This was accidentally removed in a previous migration
  - Essential for the public employee application form

  ### 2. Security
  - Only INSERT operations are allowed for anonymous users
  - Anonymous users cannot read, update, or delete employee records
  - All other operations still require authentication
*/

-- Drop the policy if it exists (in case it was already there)
DROP POLICY IF EXISTS "Allow public employee submissions" ON employees;

-- Recreate the policy to allow anonymous users to insert employee records
CREATE POLICY "Allow public employee submissions"
  ON employees FOR INSERT
  TO anon
  WITH CHECK (true);
