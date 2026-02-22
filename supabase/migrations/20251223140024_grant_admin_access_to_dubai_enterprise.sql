/*
  # Grant Admin Access to Dubai Enterprise

  ## Overview
  This migration grants admin and directeur_general users access to the new Dubai enterprise.

  ## Changes
  1. **User Enterprise Access**
     - Grant all admin and directeur_general users access to Dubai enterprise
     
  2. **User Permissions**
     - Grant full CRUD permissions for Dubai-specific modules:
       - dashboard (read)
       - clients (full CRUD)
       - expenses_professional (full CRUD)
       - users (full CRUD for admins only)

  ## Important Notes
  - Only applies to users with admin or directeur_general roles
  - Uses ON CONFLICT to avoid duplicate entries
  - Ensures users can immediately access the Dubai enterprise
*/

-- Grant enterprise access to admin users for Dubai
INSERT INTO user_enterprise_access (user_id, enterprise_id)
SELECT 
  p.id,
  e.id
FROM profiles p
CROSS JOIN enterprises e
WHERE e.slug = 'dubai'
  AND p.role IN ('admin', 'directeur_general')
  AND NOT EXISTS (
    SELECT 1 FROM user_enterprise_access uea 
    WHERE uea.user_id = p.id AND uea.enterprise_id = e.id
  );

-- Grant dashboard permissions (read only)
INSERT INTO user_permissions (user_id, enterprise_id, module, can_read, can_create, can_update, can_delete)
SELECT 
  p.id,
  e.id,
  'dashboard',
  true,
  false,
  false,
  false
FROM profiles p
CROSS JOIN enterprises e
WHERE e.slug = 'dubai'
  AND p.role IN ('admin', 'directeur_general')
ON CONFLICT (user_id, enterprise_id, module) 
DO UPDATE SET 
  can_read = true;

-- Grant clients permissions (full CRUD)
INSERT INTO user_permissions (user_id, enterprise_id, module, can_read, can_create, can_update, can_delete)
SELECT 
  p.id,
  e.id,
  'clients',
  true,
  true,
  true,
  true
FROM profiles p
CROSS JOIN enterprises e
WHERE e.slug = 'dubai'
  AND p.role IN ('admin', 'directeur_general')
ON CONFLICT (user_id, enterprise_id, module) 
DO UPDATE SET 
  can_read = true,
  can_create = true,
  can_update = true,
  can_delete = true;

-- Grant expenses_professional permissions (full CRUD)
INSERT INTO user_permissions (user_id, enterprise_id, module, can_read, can_create, can_update, can_delete)
SELECT 
  p.id,
  e.id,
  'expenses_professional',
  true,
  true,
  true,
  true
FROM profiles p
CROSS JOIN enterprises e
WHERE e.slug = 'dubai'
  AND p.role IN ('admin', 'directeur_general')
ON CONFLICT (user_id, enterprise_id, module) 
DO UPDATE SET 
  can_read = true,
  can_create = true,
  can_update = true,
  can_delete = true;

-- Grant users permissions (full CRUD for admins)
INSERT INTO user_permissions (user_id, enterprise_id, module, can_read, can_create, can_update, can_delete)
SELECT 
  p.id,
  e.id,
  'users',
  true,
  true,
  true,
  true
FROM profiles p
CROSS JOIN enterprises e
WHERE e.slug = 'dubai'
  AND p.role IN ('admin', 'directeur_general')
ON CONFLICT (user_id, enterprise_id, module) 
DO UPDATE SET 
  can_read = true,
  can_create = true,
  can_update = true,
  can_delete = true;
