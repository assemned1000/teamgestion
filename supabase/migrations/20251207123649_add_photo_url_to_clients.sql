/*
  # Add Photo URL to Clients Table

  ## Changes
  - Add photo_url column to clients table to store client logos/photos

  ## Security
  - Column is nullable to maintain compatibility with existing records
*/

-- Add photo_url column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE clients ADD COLUMN photo_url text;
  END IF;
END $$;
