/*
  # Create System Configuration Table
  
  1. New Tables
    - `system_config`
      - `key` (text, primary key) - Configuration key name
      - `value` (text) - Configuration value (encrypted in production)
      - `description` (text) - Description of the config
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `system_config` table
    - Only service role can access (no policies for users)
    - This ensures API keys and secrets are not exposed to users
  
  3. Data
    - Insert Resend API key
*/

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (no policies = only service role can access)
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Insert Resend API key
INSERT INTO system_config (key, value, description)
VALUES (
  'RESEND_API_KEY',
  're_JDv55V7K_ANFkLdhtFvgyieExs4Pn2EoY',
  'Resend API key for sending email notifications'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();