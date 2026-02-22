/*
  # Remove Contact Fields from Clients Table

  1. Changes
    - Remove `email` column from clients table
    - Remove `phone` column from clients table
    - Remove `address` column from clients table
  
  2. Notes
    - These fields are no longer needed in the client information
    - Contact information is now limited to contact_person name only
*/

-- Remove email, phone, and address columns from clients table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'email'
  ) THEN
    ALTER TABLE clients DROP COLUMN email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'phone'
  ) THEN
    ALTER TABLE clients DROP COLUMN phone;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'address'
  ) THEN
    ALTER TABLE clients DROP COLUMN address;
  END IF;
END $$;
