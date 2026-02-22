/*
  # Backfill Equipment History for Existing Assignments

  1. Purpose
    - Create equipment history records for equipment that is currently assigned but has no history
    - This ensures all current assignments are tracked in the history table

  2. Changes
    - Insert history records for all equipment with assigned_employee_id but no history
    - Set assigned_date to the created_at date of the equipment (or current date if null)
    - Set assigned_by to null since we don't have this information for historical data
    - Leave returned_date as null since the equipment is currently assigned

  3. Important Notes
    - This is a one-time backfill operation
    - Only creates records for equipment that currently has an assigned employee
    - Does not modify existing history records
*/

-- Insert history records for equipment that is currently assigned but has no history
INSERT INTO equipment_history (equipment_id, employee_id, assigned_date, returned_date, assigned_by, notes)
SELECT 
  e.id as equipment_id,
  e.assigned_employee_id as employee_id,
  COALESCE(e.created_at, now()) as assigned_date,
  NULL as returned_date,
  NULL as assigned_by,
  'Historique créé automatiquement pour l''assignation existante' as notes
FROM equipment e
WHERE 
  e.assigned_employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM equipment_history eh 
    WHERE eh.equipment_id = e.id 
    AND eh.employee_id = e.assigned_employee_id 
    AND eh.returned_date IS NULL
  );
