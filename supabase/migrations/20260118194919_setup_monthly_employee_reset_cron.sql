/*
  # Setup Monthly Employee Reset Cron Job
  
  1. Purpose
    - Automatically reset rechargement (recharge) and bonus (monthly_bonus) fields to 0 on the 5th of each month
    - This ensures clean monthly cycles while preserving salary data
  
  2. New Functions
    - `reset_employee_recharge_and_bonus()`: Resets recharge and monthly_bonus to 0 for all active employees in all enterprises
  
  3. Cron Job
    - Scheduled to run at 00:05 (5 minutes past midnight) on the 5th of each month
    - Uses cron expression: '5 0 5 * *' (minute hour day-of-month month day-of-week)
  
  4. Security
    - Function executes with SECURITY DEFINER to ensure proper permissions
    - Only resets fields for active employees to prevent data loss
  
  5. Notes
    - monthly_salary and declared_salary remain unchanged
    - Only affects recharge and monthly_bonus fields
    - Runs automatically without manual intervention
*/

-- Create function to reset recharge and monthly_bonus for all employees
CREATE OR REPLACE FUNCTION reset_employee_recharge_and_bonus()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset recharge and monthly_bonus to 0 for all active employees
  UPDATE employees
  SET 
    recharge = 0,
    monthly_bonus = 0
  WHERE status = 'Actif';
  
  -- Log the reset action
  RAISE NOTICE 'Employee recharge and bonus reset completed at %', NOW();
END;
$$;

-- Schedule the function to run on the 5th of each month at 00:05
SELECT cron.schedule(
  'reset-employee-recharge-bonus',
  '5 0 5 * *',
  $$SELECT reset_employee_recharge_and_bonus();$$
);
