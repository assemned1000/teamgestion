/*
  # Add 'users' module to permissions constraint

  1. Changes
    - Drop existing check constraint on user_permissions table
    - Add new constraint that includes 'users' module
  
  2. Notes
    - This allows admins to grant permissions for the Users module
    - Users module permissions control access to user management features
*/

ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_module_check;

ALTER TABLE user_permissions
ADD CONSTRAINT user_permissions_module_check 
CHECK (module = ANY (ARRAY[
  'employees'::text,
  'clients'::text,
  'equipment'::text,
  'salaries'::text,
  'expenses_professional'::text,
  'expenses_personal'::text,
  'dashboard'::text,
  'organization'::text,
  'users'::text
]));
