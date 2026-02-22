/*
  # Fix grant_admin_permissions function
  
  1. Changes
    - Update the grant_admin_permissions() function to use correct module names
    - Replace 'expenses' with 'expenses_professional' and 'expenses_personal'
    - This fixes the check constraint violation when creating admin users
  
  2. Notes
    - The function now creates permissions for all valid modules
    - Works for both 'admin' and 'directeur_general' roles
*/

CREATE OR REPLACE FUNCTION grant_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('admin', 'directeur_general') THEN
    DELETE FROM user_permissions WHERE user_id = NEW.id;
    
    INSERT INTO user_permissions (user_id, module, can_read, can_create, can_update, can_delete)
    VALUES
      (NEW.id, 'dashboard', true, true, true, true),
      (NEW.id, 'employees', true, true, true, true),
      (NEW.id, 'clients', true, true, true, true),
      (NEW.id, 'equipment', true, true, true, true),
      (NEW.id, 'salaries', true, true, true, true),
      (NEW.id, 'expenses_professional', true, true, true, true),
      (NEW.id, 'expenses_personal', true, true, true, true),
      (NEW.id, 'organization', true, true, true, true)
    ON CONFLICT (user_id, module) 
    DO UPDATE SET
      can_read = true,
      can_create = true,
      can_update = true,
      can_delete = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;