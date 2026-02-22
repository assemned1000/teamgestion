/*
  # Daily Activity Counter Table

  1. New Table
    - `daily_activity` - Simple counter table to maintain daily database activity
      - `id` (uuid, primary key)
      - `counter` (integer) - Auto-incrementing counter
      - `last_updated` (timestamp) - Last update timestamp
  
  2. Function
    - `increment_daily_counter()` - Function to increment the counter daily
  
  3. Scheduled Job
    - Uses pg_cron to run the increment function daily at midnight
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the daily activity table
CREATE TABLE IF NOT EXISTS daily_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counter integer DEFAULT 1,
  last_updated timestamptz DEFAULT now()
);

-- Insert initial record if none exists
INSERT INTO daily_activity (counter, last_updated)
SELECT 1, now()
WHERE NOT EXISTS (SELECT 1 FROM daily_activity);

-- Create function to increment counter
CREATE OR REPLACE FUNCTION increment_daily_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE daily_activity
  SET counter = counter + 1,
      last_updated = now()
  WHERE id = (SELECT id FROM daily_activity LIMIT 1);
END;
$$;

-- Schedule the function to run daily at midnight UTC
SELECT cron.schedule(
  'increment-daily-counter',
  '0 0 * * *',
  'SELECT increment_daily_counter();'
);