/*
  # Create One-Time Tokens Table

  ## Summary
  This migration creates a table to store one-time use tokens for the public employee form.
  Each token can only be used once and expires after a certain period.

  ## Changes Made

  ### 1. New Tables
  - `one_time_tokens`
    - `id` (uuid, primary key)
    - `token` (text, unique) - The actual token string
    - `used` (boolean) - Whether the token has been used
    - `created_at` (timestamptz) - When the token was created
    - `expires_at` (timestamptz) - When the token expires

  ### 2. Security
  - Enable RLS on the table
  - Allow anonymous users to SELECT tokens (to verify)
  - Allow authenticated users with proper permissions to INSERT tokens

  ### 3. Indexes
  - Add index on token for fast lookups
  - Add index on used and expires_at for cleanup queries
*/

-- Create one_time_tokens table
CREATE TABLE IF NOT EXISTS one_time_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  used boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL
);

-- Enable RLS
ALTER TABLE one_time_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to SELECT tokens (to verify)
CREATE POLICY "Anyone can view tokens"
  ON one_time_tokens FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users with proper permissions to INSERT tokens
CREATE POLICY "Authenticated users can create tokens"
  ON one_time_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'manager')
    )
  );

-- Allow authenticated users to UPDATE tokens (mark as used)
CREATE POLICY "Authenticated users can update tokens"
  ON one_time_tokens FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'manager')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_one_time_tokens_token ON one_time_tokens(token);
CREATE INDEX IF NOT EXISTS idx_one_time_tokens_used_expires ON one_time_tokens(used, expires_at);
