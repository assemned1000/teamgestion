/*
  # Add new roles to profiles table

  1. Changes
    - Drop existing role check constraint on profiles table
    - Add new role check constraint with additional roles:
      - directeur_general (Directeur général)
      - assistante_direction (Assistante de direction)
      - manager_general (Manager général)
    
  2. Security
    - Maintains existing RLS policies
    - No changes to permissions structure
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'manager', 'employee', 'assistante', 'directeur_general', 'assistante_direction', 'manager_general'));
