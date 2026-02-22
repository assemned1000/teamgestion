/*
  # Fix User Permissions Policies to Use Helper Function

  ## Problem
  User permissions policies also check if user is admin by querying profiles table,
  which could cause similar recursion issues.

  ## Solution
  Update user_permissions policies to use the is_admin() helper function instead of
  querying profiles table directly.

  ## Changes
  - Drop and recreate user_permissions policies using is_admin() function
*/

-- Drop existing user_permissions policies
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can insert permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions" ON user_permissions;

-- Recreate policies using the is_admin() helper function
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert permissions"
  ON user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update permissions"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete permissions"
  ON user_permissions FOR DELETE
  TO authenticated
  USING (is_admin());
