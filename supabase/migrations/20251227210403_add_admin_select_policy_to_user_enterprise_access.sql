/*
  # Add admin SELECT policy to user_enterprise_access table
  
  1. Problem
    - Admins can only read their own enterprise access (user_id = auth.uid())
    - When managing other users' permissions, admins need to see their enterprise access
    - This causes the UI to not display which enterprises a user has access to
  
  2. Solution
    - Add a SELECT policy for admins to view all enterprise access records
  
  3. Security
    - Only users with 'admin' or 'directeur_general' role can view all records
    - Regular users can still only see their own records
*/

-- Allow admins to view all enterprise access records
CREATE POLICY "Admins can read all enterprise access"
  ON user_enterprise_access
  FOR SELECT
  TO authenticated
  USING (is_admin());
