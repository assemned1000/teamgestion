/*
  # Separate Professional and Personal Expenses Permissions

  ## Summary
  This migration updates the user_permissions table to support separate permissions
  for professional and personal expenses instead of grouping them together.

  ## Changes Made
  1. Migrate existing 'expenses' permissions to both new modules
  2. Update the module check constraint to include separate entries for:
     - expenses_professional (Dépenses Professionnelles)
     - expenses_personal (Dépenses Personnelles)
  3. Remove the generic 'expenses' module
*/

-- Step 1: Drop the old constraint
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_module_check;

-- Step 2: Migrate existing 'expenses' permissions to both new modules
DO $$
DECLARE
  expense_perm RECORD;
BEGIN
  FOR expense_perm IN 
    SELECT user_id, can_read, can_create, can_update, can_delete 
    FROM user_permissions 
    WHERE module = 'expenses'
  LOOP
    -- Insert professional expenses permission
    INSERT INTO user_permissions (user_id, module, can_read, can_create, can_update, can_delete)
    VALUES (
      expense_perm.user_id, 
      'expenses_professional', 
      expense_perm.can_read, 
      expense_perm.can_create, 
      expense_perm.can_update, 
      expense_perm.can_delete
    )
    ON CONFLICT (user_id, module) DO UPDATE
    SET 
      can_read = EXCLUDED.can_read,
      can_create = EXCLUDED.can_create,
      can_update = EXCLUDED.can_update,
      can_delete = EXCLUDED.can_delete;

    -- Insert personal expenses permission
    INSERT INTO user_permissions (user_id, module, can_read, can_create, can_update, can_delete)
    VALUES (
      expense_perm.user_id, 
      'expenses_personal', 
      expense_perm.can_read, 
      expense_perm.can_create, 
      expense_perm.can_update, 
      expense_perm.can_delete
    )
    ON CONFLICT (user_id, module) DO UPDATE
    SET 
      can_read = EXCLUDED.can_read,
      can_create = EXCLUDED.can_create,
      can_update = EXCLUDED.can_update,
      can_delete = EXCLUDED.can_delete;
  END LOOP;

  -- Delete old 'expenses' permissions
  DELETE FROM user_permissions WHERE module = 'expenses';
END $$;

-- Step 3: Add new constraint with separate expense modules
ALTER TABLE user_permissions ADD CONSTRAINT user_permissions_module_check 
  CHECK (module = ANY (ARRAY[
    'employees'::text, 
    'clients'::text, 
    'equipment'::text, 
    'salaries'::text, 
    'expenses_professional'::text,
    'expenses_personal'::text,
    'dashboard'::text, 
    'organization'::text
  ]));
