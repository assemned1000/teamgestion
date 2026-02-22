/*
  # Add payment date to client costs

  1. Changes
    - Add `payment_date` column to `client_costs` table
      - Type: date (nullable)
      - Stores the payment date for each client cost/offer
  
  2. Notes
    - This field is optional and can be used to track when payments are expected
    - Particularly useful for Ompleo's "offre d'emploi" feature
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_costs' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE client_costs ADD COLUMN payment_date date;
  END IF;
END $$;
