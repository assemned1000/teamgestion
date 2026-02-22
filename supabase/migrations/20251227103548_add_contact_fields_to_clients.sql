/*
  # Add contact fields to clients table
  
  1. Changes
    - Add `domain` field to store the company domain
    - Add `contact_name` field to store the contact person name
    - Add `contact_type` field to store whether contact is phone or email
    - Add `contact_value` field to store the actual phone number or email address
  
  2. Notes
    - These fields are nullable to maintain backward compatibility
    - Designed primarily for Ompleo enterprise but available for all
*/

DO $$ 
BEGIN
  -- Add domain field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'domain'
  ) THEN
    ALTER TABLE clients ADD COLUMN domain text;
  END IF;

  -- Add contact_name field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE clients ADD COLUMN contact_name text;
  END IF;

  -- Add contact_type field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'contact_type'
  ) THEN
    ALTER TABLE clients ADD COLUMN contact_type text CHECK (contact_type IN ('numero', 'email', NULL));
  END IF;

  -- Add contact_value field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'contact_value'
  ) THEN
    ALTER TABLE clients ADD COLUMN contact_value text;
  END IF;
END $$;