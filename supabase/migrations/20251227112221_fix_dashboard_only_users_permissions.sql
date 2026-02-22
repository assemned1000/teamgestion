/*
  # Fix Dashboard-Only Users Permissions

  This migration automatically grants necessary permissions to users who have dashboard access
  but no enterprise access or module permissions.

  ## Changes

  1. **Grant Enterprise Access**
     - Users with dashboard access but no enterprise access entries get access to all active enterprises
  
  2. **Grant Read-Only Module Permissions**
     - Users with dashboard access but no module permissions get read-only access to all modules
     - This allows them to view dashboard statistics without being able to modify data

  ## Impact
  - Fixes existing users who have dashboard access but see zero revenue/data
  - Ensures dashboard users can view aggregated statistics from all enterprises
*/

-- Find users with dashboard access but no enterprise access and grant them access to all enterprises
INSERT INTO user_enterprise_access (user_id, enterprise_id)
SELECT DISTINCT ap.user_id, e.id
FROM user_app_permissions ap
CROSS JOIN enterprises e
WHERE ap.can_access_dashboard = true
  AND e.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_enterprise_access uea 
    WHERE uea.user_id = ap.user_id
  )
ON CONFLICT (user_id, enterprise_id) DO NOTHING;

-- Grant read-only permissions for all modules to dashboard-only users
INSERT INTO user_permissions (user_id, enterprise_id, module, can_read, can_create, can_update, can_delete)
SELECT DISTINCT ap.user_id, e.id, m.module_name, true, false, false, false
FROM user_app_permissions ap
CROSS JOIN enterprises e
CROSS JOIN (
  VALUES 
    ('clients'),
    ('employees'),
    ('equipment'),
    ('salaries'),
    ('expenses_professional'),
    ('expenses_personal'),
    ('dashboard'),
    ('organization')
) AS m(module_name)
WHERE ap.can_access_dashboard = true
  AND e.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = ap.user_id
  )
ON CONFLICT (user_id, enterprise_id, module) DO NOTHING;
