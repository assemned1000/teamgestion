/*
  # Add name field to expenses table

  1. Changes
    - Add `name` column to expenses table (text, required)
    - Populate existing records with category value as name
    - Make category nullable and optional for future records
    
  2. Notes
    - Name field will be the primary identifier for expenses
    - Category field kept for backward compatibility but made optional
*/

-- Add name column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS name text;

-- Populate existing records with category as name
UPDATE expenses SET name = category WHERE name IS NULL;

-- Make name required for future inserts
ALTER TABLE expenses ALTER COLUMN name SET NOT NULL;

-- Make category nullable (optional)
ALTER TABLE expenses ALTER COLUMN category DROP NOT NULL;
