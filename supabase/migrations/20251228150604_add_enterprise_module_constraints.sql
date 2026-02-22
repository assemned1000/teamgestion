/*
  # Add enterprise-specific module constraints

  1. Changes
    - Create a function to validate that modules are appropriate for each enterprise
    - Add a check constraint to user_permissions table
    
  2. Enterprise Module Rules
    - Deep Closer: dashboard, employees, clients, equipment, salaries, expenses_professional, organization
    - Ompleo: dashboard, employees, clients, equipment, salaries, expenses_professional, organization  
    - ScalSet (dubai): dashboard, clients, expenses_professional
    
  3. Security
    - Prevents creation of permissions for modules that don't exist in an enterprise
*/

-- Create a function to validate enterprise modules
CREATE OR REPLACE FUNCTION validate_enterprise_module(enterprise_id uuid, module text)
RETURNS boolean AS $$
DECLARE
  enterprise_slug text;
BEGIN
  SELECT slug INTO enterprise_slug FROM enterprises WHERE id = enterprise_id;
  
  -- Deep Closer allowed modules
  IF enterprise_slug = 'deep-closer' THEN
    RETURN module IN ('dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization');
  END IF;
  
  -- Ompleo allowed modules
  IF enterprise_slug = 'ompleo' THEN
    RETURN module IN ('dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization');
  END IF;
  
  -- ScalSet (dubai) allowed modules
  IF enterprise_slug = 'dubai' THEN
    RETURN module IN ('dashboard', 'clients', 'expenses_professional');
  END IF;
  
  -- Default: allow the module
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraint to user_permissions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_permissions_enterprise_module_check'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT user_permissions_enterprise_module_check 
    CHECK (validate_enterprise_module(enterprise_id, module));
  END IF;
END $$;
