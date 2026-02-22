/*
  # Add Payment Method and Currency Fields to Clients

  1. Changes
    - Add `payment_method` column to `clients` table
      - Type: text
      - Options: 'virement bancaire', 'cash'
      - Nullable: allows NULL for existing clients
    - Add `currency` column to `clients` table
      - Type: text
      - Options: 'euro', 'usd', 'aed'
      - Nullable: allows NULL for existing clients

  2. Purpose
    - Track payment method for each client (bank transfer or cash)
    - Track currency preference for each client (EUR, USD, or AED)
    - Display this information in client cards and details page

  3. Notes
    - No RLS changes needed as these fields follow existing client table security
    - Existing clients will have NULL values until updated
*/

-- Add payment_method column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE clients ADD COLUMN payment_method text;
  END IF;
END $$;

-- Add currency column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'currency'
  ) THEN
    ALTER TABLE clients ADD COLUMN currency text;
  END IF;
END $$;
