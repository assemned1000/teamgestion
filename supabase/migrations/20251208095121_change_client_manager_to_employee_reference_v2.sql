/*
  # Change Client Manager Reference to Employees

  1. Changes
    - Drop existing foreign key constraint on clients.manager_id that references profiles
    - Clear existing manager_id values that reference profiles (users can reassign managers)
    - Add new foreign key constraint on clients.manager_id to reference employees table
    - This ensures managers are selected from employees with Manager or Manager Général positions

  2. Notes
    - Existing manager_id values will be cleared (set to NULL)
    - Users will need to reassign managers from the employees list
    - Only managers from employees table can be assigned going forward
*/

DO $$
BEGIN
  -- Drop the existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'clients_manager_id_fkey'
    AND table_name = 'clients'
  ) THEN
    ALTER TABLE clients DROP CONSTRAINT clients_manager_id_fkey;
  END IF;
END $$;

-- Clear existing manager_id values that reference profiles
UPDATE clients SET manager_id = NULL WHERE manager_id IS NOT NULL;

-- Add new foreign key constraint pointing to employees table
ALTER TABLE clients
  ADD CONSTRAINT clients_manager_id_fkey
  FOREIGN KEY (manager_id)
  REFERENCES employees(id)
  ON DELETE SET NULL;