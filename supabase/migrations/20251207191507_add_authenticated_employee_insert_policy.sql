/*
  # Add INSERT Policy for Authenticated Users on Employees

  ## Summary
  This migration adds an INSERT policy for authenticated users to create employee records.
  Previously, only anonymous users could insert employees, which caused errors when
  logged-in users tried to use the public employee form.

  ## Changes Made

  ### 1. Add INSERT Policy for Authenticated Users
  - Allow authenticated users with proper permissions to insert employee records
  - Check for admin/manager role or explicit create permission
  - This enables both public form submission and admin creation

  ### 2. Security
  - Only users with admin/manager role or explicit create permission can insert
  - Maintains role-based access control
  - Keeps data integrity through permission checks
*/

-- Add INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create employees"
  ON employees FOR INSERT
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
