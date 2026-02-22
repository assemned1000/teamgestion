/*
  # Add Enterprise ID to One-Time Tokens

  ## Summary
  This migration adds an enterprise_id column to the one_time_tokens table to ensure
  that employees created via public form links are assigned to the correct enterprise.

  ## Changes Made

  ### 1. Schema Updates
  - Add `enterprise_id` column to `one_time_tokens` table
  - Add foreign key constraint to `enterprises` table
  - Add index for performance

  ### 2. Notes
  - This ensures that when an employee fills out the public form, they are automatically
    assigned to the correct enterprise that generated the token/link
*/

-- Add enterprise_id column to one_time_tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_time_tokens' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE one_time_tokens ADD COLUMN enterprise_id uuid REFERENCES enterprises(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_one_time_tokens_enterprise_id ON one_time_tokens(enterprise_id);
