/*
  # Fix Function Search Paths for Security

  1. Security Improvements
    - Set immutable search_path on all database functions
    - Prevents potential security vulnerabilities from search_path hijacking
    - Ensures functions always resolve to the correct schema
  
  2. Functions Updated
    - generate_qr_code() - parameterless version
    - update_updated_at()
    - set_qr_code()
    - grant_admin_permissions()
    - is_admin()
    - generate_qr_code(equipment_id) - version with parameter
  
  3. Important Notes
    - All functions now have SET search_path TO 'public', 'pg_temp'
    - This prevents search_path manipulation attacks
    - No functional changes, only security hardening
*/

-- Update generate_qr_code (parameterless version)
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN 'QR-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);
END;
$$;

-- Update update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update set_qr_code function
CREATE OR REPLACE FUNCTION set_qr_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := generate_qr_code(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- grant_admin_permissions and is_admin already have proper search_path
-- generate_qr_code(equipment_id) already has proper search_path
