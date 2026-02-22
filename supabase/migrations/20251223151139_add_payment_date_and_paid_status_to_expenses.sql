/*
  # Add Payment Date and Paid Status to Expenses

  1. Changes
    - Add `payment_date` column to track when the expense should be paid
    - Add `is_paid` column to track payment status (paid/unpaid)
    - Set default values for existing records

  2. Notes
    - payment_date is optional (nullable) since not all expenses have a scheduled payment date
    - is_paid defaults to false (unpaid) for new expenses
    - payment_method already exists in the table
*/

DO $$
BEGIN
  -- Add payment_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE expenses ADD COLUMN payment_date date;
  END IF;

  -- Add is_paid column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'is_paid'
  ) THEN
    ALTER TABLE expenses ADD COLUMN is_paid boolean DEFAULT false NOT NULL;
  END IF;
END $$;
