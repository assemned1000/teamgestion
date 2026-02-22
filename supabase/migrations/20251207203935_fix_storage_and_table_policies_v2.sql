/*
  # Fix Storage and Table RLS Policies

  ## Summary
  This migration adds missing RLS policies for employee photos storage, 
  employee_client_rates table, and equipment table to fix permission errors.

  ## Changes Made

  ### 1. Storage Policies
  - Allow anonymous users to upload employee photos (for public form)
  - Maintains existing authenticated user policies

  ### 2. Employee Client Rates Policies
  - Add INSERT policy for authenticated users with proper permissions
  - Add UPDATE policy for authenticated users with proper permissions
  - Add DELETE policy for authenticated users with proper permissions

  ### 3. Equipment Policies
  - Add INSERT policy for authenticated users with proper permissions
  - Add UPDATE policy for authenticated users with proper permissions
  - Add DELETE policy for authenticated users with proper permissions

  ### 4. Security
  - All policies check for admin/manager role or explicit permissions
  - Anonymous users can only upload photos (no other access)
  - Data integrity maintained through permission checks
*/

-- Drop existing policies if they exist to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anonymous users can upload employee photos" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow anonymous users to upload employee photos (for public form)
CREATE POLICY "Anonymous users can upload employee photos"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'employee-photos');

-- Add INSERT policy for employee_client_rates
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can create employee rates" ON employee_client_rates;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can create employee rates"
  ON employee_client_rates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'employees'
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'manager')
        OR up.can_create = true
      )
    )
  );

-- Add UPDATE policy for employee_client_rates
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can update employee rates" ON employee_client_rates;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can update employee rates"
  ON employee_client_rates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'employees'
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'manager')
        OR up.can_update = true
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'employees'
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'manager')
        OR up.can_update = true
      )
    )
  );

-- Add DELETE policy for employee_client_rates
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can delete employee rates" ON employee_client_rates;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can delete employee rates"
  ON employee_client_rates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'employees'
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'manager')
        OR up.can_delete = true
      )
    )
  );

-- Add INSERT policy for equipment
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can create equipment" ON equipment;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can create equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'equipment'
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'manager')
        OR up.can_create = true
      )
    )
  );

-- Add UPDATE policy for equipment
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can update equipment" ON equipment;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can update equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'equipment'
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'manager')
        OR up.can_update = true
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'equipment'
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'manager')
        OR up.can_update = true
      )
    )
  );

-- Add DELETE policy for equipment
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can delete equipment" ON equipment;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can delete equipment"
  ON equipment FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_permissions up ON up.user_id = p.id AND up.module = 'equipment'
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'manager')
        OR up.can_delete = true
      )
    )
  );
