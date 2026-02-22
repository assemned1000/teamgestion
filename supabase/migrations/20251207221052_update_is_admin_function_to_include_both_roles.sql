/*
  # Update is_admin function to recognize both admin and directeur_general roles

  1. Changes
    - Update is_admin() function to check for both 'admin' and 'directeur_general' roles
    - This ensures both roles have full administrative privileges
  
  2. Security
    - Maintains security by checking for authorized admin roles
    - Only users with admin or directeur_general role can perform admin actions
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'directeur_general')
  );
END;
$$;
