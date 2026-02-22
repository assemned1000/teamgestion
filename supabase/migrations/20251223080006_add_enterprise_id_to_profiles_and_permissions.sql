/*
  # Add Enterprise ID to Profiles and User Permissions

  ## Changes Made
  
  1. **Profiles Table**
     - Add `enterprise_id` column (nullable) to allow users to be associated with enterprises
     - Add foreign key constraint to enterprises table
     - Add index for query performance
  
  2. **User Permissions Table**
     - Add `enterprise_id` column (not nullable) - permissions are per-enterprise
     - Add foreign key constraint to enterprises table  
     - Add index for query performance
     - Update unique constraint to include enterprise_id (user can have different permissions per enterprise per module)
  
  3. **Data Migration**
     - Set all existing profiles to Deep Closer enterprise (the original enterprise)
     - Set all existing user_permissions to Deep Closer enterprise
  
  ## Security Implications
  - After this migration, users will be scoped to specific enterprises
  - RLS policies will need to be updated in the next migration to enforce enterprise isolation
*/

-- Add enterprise_id to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN enterprise_id uuid REFERENCES enterprises(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_enterprise_id ON profiles(enterprise_id);
  END IF;
END $$;

-- Set all existing profiles to Deep Closer enterprise
UPDATE profiles 
SET enterprise_id = '1433ad99-2a06-4685-8046-30c51df777dc'
WHERE enterprise_id IS NULL;

-- Add enterprise_id to user_permissions table  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_permissions' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE user_permissions 
    ADD COLUMN enterprise_id uuid REFERENCES enterprises(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_user_permissions_enterprise_id ON user_permissions(enterprise_id);
  END IF;
END $$;

-- Set all existing user_permissions to Deep Closer enterprise
UPDATE user_permissions 
SET enterprise_id = '1433ad99-2a06-4685-8046-30c51df777dc'
WHERE enterprise_id IS NULL;

-- Make enterprise_id NOT NULL after setting values
ALTER TABLE user_permissions ALTER COLUMN enterprise_id SET NOT NULL;

-- Drop old unique constraint and create new one including enterprise_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_permissions_user_id_module_key'
  ) THEN
    ALTER TABLE user_permissions DROP CONSTRAINT user_permissions_user_id_module_key;
  END IF;
END $$;

-- Add new unique constraint: user can have one permission set per module per enterprise
ALTER TABLE user_permissions 
ADD CONSTRAINT user_permissions_user_enterprise_module_key 
UNIQUE (user_id, enterprise_id, module);
