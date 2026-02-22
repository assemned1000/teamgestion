/*
  # Add payment method to expenses

  1. Changes
    - Add payment_method column to expenses table
    - Allow values: 'virement bancaire' or 'cash'
    - Set default to 'cash'
    - Update existing records to have 'cash' as payment method

  2. Notes
    - This allows tracking how personal and professional expenses were paid
    - Default to 'cash' for backwards compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE expenses ADD COLUMN payment_method text DEFAULT 'cash';
  END IF;
END $$;

UPDATE expenses SET payment_method = 'cash' WHERE payment_method IS NULL;