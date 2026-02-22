/*
  # Update Employee Salary Fields

  1. Changes
    - Add `monthly_salary` column (salaire mensuel) - numeric, required, default 0
    - Add `recharge` column (rechargement) - numeric, optional, default 0
    - Drop `cash_salary` column (salaire liquide) - being removed per requirement
  
  2. Migration Strategy
    - Add new columns first
    - Remove old column last
    - Use safe default values to ensure data integrity

  3. Important Notes
    - All existing employees will have monthly_salary and recharge set to 0 by default
    - cash_salary data will be lost when column is dropped
    - Total salary calculation will need to be updated in frontend
*/

-- Add new monthly_salary column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'monthly_salary'
  ) THEN
    ALTER TABLE employees ADD COLUMN monthly_salary numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add new recharge column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'recharge'
  ) THEN
    ALTER TABLE employees ADD COLUMN recharge numeric DEFAULT 0;
  END IF;
END $$;

-- Drop cash_salary column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'cash_salary'
  ) THEN
    ALTER TABLE employees DROP COLUMN cash_salary;
  END IF;
END $$;