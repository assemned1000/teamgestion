/*
  # Update Expenses Currency Constraint

  1. Changes
    - Drop the existing currency check constraint that only allows EUR and DZD
    - Create a new constraint that allows EUR, DZD, USD, and AED currencies
  
  2. Notes
    - This allows expenses to be recorded in multiple currencies
    - Supports multi-currency operations across different regions
*/

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_currency_check;

ALTER TABLE expenses ADD CONSTRAINT expenses_currency_check 
  CHECK (currency = ANY (ARRAY['EUR'::text, 'DZD'::text, 'USD'::text, 'AED'::text]));
