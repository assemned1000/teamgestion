/*
  # Add payment date to clients table

  1. Changes
    - Add `payment_date` column to `clients` table
      - Type: integer (day of month, 1-31)
      - Nullable: true (optional field)
      - Represents the day of the month when payment is due for this client

  2. Notes
    - Stores only the day number (1-31) as clients typically have recurring monthly payments on the same day
    - Nullable to allow clients without a specific payment date
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE clients ADD COLUMN payment_date integer;
    ALTER TABLE clients ADD CONSTRAINT payment_date_range CHECK (payment_date >= 1 AND payment_date <= 31);
  END IF;
END $$;