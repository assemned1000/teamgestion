/*
  # Add payment status to clients table

  1. Changes
    - Add `is_paid` column to `clients` table
      - Boolean field to track whether a client has paid
      - Defaults to false (unpaid)
  
  2. Notes
    - This allows tracking of payment status for each client
    - Used to calculate total paid revenue separately from total revenue
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'is_paid'
  ) THEN
    ALTER TABLE clients ADD COLUMN is_paid boolean DEFAULT false;
  END IF;
END $$;
