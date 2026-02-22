/*
  # Make enterprise_id nullable for personal expenses

  1. Changes
    - Alter `expenses` table to make `enterprise_id` nullable
    - This allows personal expenses to exist without being tied to an enterprise
    - Personal expenses (type='personal') will have NULL enterprise_id
    - Enterprise expenses will continue to have a valid enterprise_id

  2. Security
    - Update RLS policies to handle both personal and enterprise expenses
    - Personal expenses: accessible only by the user who created them (created_by)
    - Enterprise expenses: accessible based on user's enterprise access
*/

-- Make enterprise_id nullable
ALTER TABLE expenses ALTER COLUMN enterprise_id DROP NOT NULL;

-- Drop existing RLS policies for expenses
DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON expenses;

-- Create new RLS policies that handle both personal and enterprise expenses

-- SELECT: Users can view their own personal expenses OR expenses from enterprises they have access to
CREATE POLICY "Users can view personal and enterprise expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    -- Personal expenses: user is the creator
    (type = 'personal' AND created_by = auth.uid())
    OR
    -- Enterprise expenses: user has access to the enterprise
    (type != 'personal' AND enterprise_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_enterprise_access
      WHERE user_enterprise_access.user_id = auth.uid()
      AND user_enterprise_access.enterprise_id = expenses.enterprise_id
    ))
  );

-- INSERT: Users can insert personal expenses OR enterprise expenses if they have access
CREATE POLICY "Users can insert personal and enterprise expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Personal expenses: user is the creator
    (type = 'personal' AND created_by = auth.uid() AND enterprise_id IS NULL)
    OR
    -- Enterprise expenses: user has access to the enterprise
    (type != 'personal' AND enterprise_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_enterprise_access
      WHERE user_enterprise_access.user_id = auth.uid()
      AND user_enterprise_access.enterprise_id = expenses.enterprise_id
    ))
  );

-- UPDATE: Users can update their own personal expenses OR enterprise expenses if they have access
CREATE POLICY "Users can update personal and enterprise expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (
    -- Personal expenses: user is the creator
    (type = 'personal' AND created_by = auth.uid())
    OR
    -- Enterprise expenses: user has access to the enterprise
    (type != 'personal' AND enterprise_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_enterprise_access
      WHERE user_enterprise_access.user_id = auth.uid()
      AND user_enterprise_access.enterprise_id = expenses.enterprise_id
    ))
  )
  WITH CHECK (
    -- Personal expenses: user is the creator and enterprise_id stays null
    (type = 'personal' AND created_by = auth.uid() AND enterprise_id IS NULL)
    OR
    -- Enterprise expenses: user has access to the enterprise
    (type != 'personal' AND enterprise_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_enterprise_access
      WHERE user_enterprise_access.user_id = auth.uid()
      AND user_enterprise_access.enterprise_id = expenses.enterprise_id
    ))
  );

-- DELETE: Users can delete their own personal expenses OR enterprise expenses if they have access
CREATE POLICY "Users can delete personal and enterprise expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (
    -- Personal expenses: user is the creator
    (type = 'personal' AND created_by = auth.uid())
    OR
    -- Enterprise expenses: user has access to the enterprise
    (type != 'personal' AND enterprise_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_enterprise_access
      WHERE user_enterprise_access.user_id = auth.uid()
      AND user_enterprise_access.enterprise_id = expenses.enterprise_id
    ))
  );