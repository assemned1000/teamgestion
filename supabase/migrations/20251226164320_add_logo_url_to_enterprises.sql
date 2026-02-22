/*
  # Add logo URL to enterprises table

  1. Changes
    - Add `logo_url` column to `enterprises` table to store enterprise logos
    - Column is nullable to allow enterprises without logos
  
  2. Notes
    - This enables displaying enterprise logos throughout the application
    - Logo URLs will reference files in the public storage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enterprises' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE enterprises ADD COLUMN logo_url text;
  END IF;
END $$;
