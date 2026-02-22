/*
  # Automatic Equipment Assignment History Tracking

  1. Purpose
    - Automatically track equipment assignment changes in the history table
    - Ensure history is always up-to-date without relying on frontend code

  2. Changes
    - Create a trigger function that executes on equipment updates
    - When assigned_employee_id changes:
      * Mark previous assignment as returned (set returned_date)
      * Create new history record for the new assignment
    - Trigger captures the current user making the change

  3. Important Notes
    - Trigger only fires when assigned_employee_id actually changes
    - Handles all cases: assignment, unassignment, and reassignment
    - Uses auth.uid() to track who made the change
*/

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS track_equipment_assignment_changes ON equipment;
DROP FUNCTION IF EXISTS track_equipment_assignment_change();

-- Create the trigger function
CREATE OR REPLACE FUNCTION track_equipment_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if assigned_employee_id changed
  IF (OLD.assigned_employee_id IS DISTINCT FROM NEW.assigned_employee_id) THEN
    
    -- If there was a previous assignment, mark it as returned
    IF OLD.assigned_employee_id IS NOT NULL THEN
      UPDATE equipment_history
      SET returned_date = now()
      WHERE equipment_id = OLD.id
        AND employee_id = OLD.assigned_employee_id
        AND returned_date IS NULL;
    END IF;
    
    -- If there's a new assignment, create a history record
    IF NEW.assigned_employee_id IS NOT NULL THEN
      INSERT INTO equipment_history (
        equipment_id,
        employee_id,
        assigned_date,
        returned_date,
        assigned_by,
        notes
      ) VALUES (
        NEW.id,
        NEW.assigned_employee_id,
        now(),
        NULL,
        auth.uid(),
        NULL
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER track_equipment_assignment_changes
  AFTER UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION track_equipment_assignment_change();
