/*
  # Add assigned_by field to equipment_history

  1. Changes
    - Add `assigned_by` column to track which user made the assignment
    - Add foreign key constraint to profiles table
    - Add index on assigned_by for performance

  2. Notes
    - This field will automatically track who assigned equipment to employees
    - Will be populated when creating history records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment_history' AND column_name = 'assigned_by'
  ) THEN
    ALTER TABLE equipment_history ADD COLUMN assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_equipment_history_assigned_by ON equipment_history(assigned_by);
  END IF;
END $$;
