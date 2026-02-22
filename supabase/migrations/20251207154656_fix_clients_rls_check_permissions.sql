/*
  # Fix Clients Table RLS to Check Permissions

  ## Summary
  Updates the clients table RLS policy to check user_permissions instead of
  allowing all authenticated users.

  ## Changes
  1. Drop the existing permissive policy that allows all authenticated users
  2. Create new policies that check user_permissions table:
     - SELECT: Requires can_read permission for 'clients' module
     - INSERT: Requires can_create permission for 'clients' module
     - UPDATE: Requires can_update permission for 'clients' module
     - DELETE: Requires can_delete permission for 'clients' module
*/

-- Drop old permissive policy
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON clients;
DROP POLICY IF EXISTS "Users can manage clients" ON clients;

-- SELECT policy: Check can_read permission
CREATE POLICY "Users can view clients with permission"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.module = 'clients'
      AND user_permissions.can_read = true
    )
  );

-- INSERT policy: Check can_create permission
CREATE POLICY "Users can create clients with permission"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.module = 'clients'
      AND user_permissions.can_create = true
    )
  );

-- UPDATE policy: Check can_update permission
CREATE POLICY "Users can update clients with permission"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.module = 'clients'
      AND user_permissions.can_update = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.module = 'clients'
      AND user_permissions.can_update = true
    )
  );

-- DELETE policy: Check can_delete permission
CREATE POLICY "Users can delete clients with permission"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.module = 'clients'
      AND user_permissions.can_delete = true
    )
  );
