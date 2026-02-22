/*
  # Setup Expense Payment Reminder Cron Job

  1. Purpose
    - Automatically send email reminders for expenses due in 2 days
    - Runs daily at 9:00 AM (server time)
    - Calls the expense-payment-reminders Edge Function

  2. Configuration
    - Uses pg_cron extension to schedule daily job
    - Executes HTTP request to Edge Function
    - Function checks for expenses with payment_date = current_date + 2 days
    - Sends email to assemnen1000@gmail.com with expense details

  3. Requirements
    - pg_cron extension must be enabled
    - pg_net extension must be enabled for HTTP requests
    - Edge Function must be deployed

  4. Notes
    - Job runs at 09:00 AM every day
    - If you need to change the schedule, update the cron expression
    - To disable: SELECT cron.unschedule('expense-payment-reminders-daily');
    - To check job status: SELECT * FROM cron.job_run_details WHERE jobname = 'expense-payment-reminders-daily' ORDER BY start_time DESC LIMIT 10;
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule existing job if it exists
SELECT cron.unschedule('expense-payment-reminders-daily') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expense-payment-reminders-daily'
);

-- Schedule the job to run daily at 9:00 AM
SELECT cron.schedule(
  'expense-payment-reminders-daily',
  '0 9 * * *', -- Every day at 9:00 AM
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/expense-payment-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object('trigger', 'cron')
    ) as request_id;
  $$
);

-- Store Supabase configuration in database settings for the cron job to use
DO $$
BEGIN
  -- These settings will be used by the cron job
  -- The values are populated from environment variables
  EXECUTE format('ALTER DATABASE %I SET app.settings.supabase_url = %L', 
    current_database(), 
    current_setting('app.settings.supabase_url', true)
  );
  
  EXECUTE format('ALTER DATABASE %I SET app.settings.supabase_anon_key = %L', 
    current_database(), 
    current_setting('app.settings.supabase_anon_key', true)
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Settings might not be available in all environments
    RAISE NOTICE 'Could not set database settings. Cron job may need manual configuration.';
END $$;
