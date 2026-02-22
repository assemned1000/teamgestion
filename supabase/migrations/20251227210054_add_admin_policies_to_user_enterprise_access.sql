/*
  # Add admin policies to user_enterprise_access table
  
  1. Problem
    - The user_enterprise_access table only has SELECT policy
    - Admins cannot INSERT, UPDATE, or DELETE records
    - This prevents saving user permissions when editing users
  
  2. Solution
    - Add INSERT policy for admins
    - Add UPDATE policy for admins
    - Add DELETE policy for admins
  
  3. Security
    - Only users with 'admin' or 'directeur_general' role can modify enterprise access
    - Uses the existing is_admin() function for consistent security checks
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can insert enterprise access" ON user_enterprise_access;
DROP POLICY IF EXISTS "Admins can update enterprise access" ON user_enterprise_access;
DROP POLICY IF EXISTS "Admins can delete enterprise access" ON user_enterprise_access;

-- Allow admins to insert enterprise access records
CREATE POLICY "Admins can insert enterprise access"
  ON user_enterprise_access
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Allow admins to update enterprise access records
CREATE POLICY "Admins can update enterprise access"
  ON user_enterprise_access
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admins to delete enterprise access records
CREATE POLICY "Admins can delete enterprise access"
  ON user_enterprise_access
  FOR DELETE
  TO authenticated
  USING (is_admin());
