/*
  # Auto-Track Equipment History on INSERT and UPDATE

  1. Purpose
    - Extend the equipment history tracking to handle both INSERT and UPDATE operations
    - Automatically create history records when equipment is first created with an assignment
    - Continue to track assignment changes via UPDATE

  2. Changes
    - Update the trigger function to handle INSERT operations
    - When a new equipment is created with an assigned_employee_id:
      * Create an initial history record
    - When equipment is updated:
      * Continue existing behavior (mark returns, create new assignments)

  3. Important Notes
    - Trigger fires on both INSERT and UPDATE
    - INSERT: Only creates history if employee is assigned
    - UPDATE: Handles assignment changes as before
    - Uses auth.uid() to track who made the change
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS track_equipment_assignment_changes ON equipment;

-- Recreate the function to handle both INSERT and UPDATE
CREATE OR REPLACE FUNCTION track_equipment_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT operations (new equipment)
  IF TG_OP = 'INSERT' THEN
    -- If equipment is created with an assigned employee, create initial history record
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
    
  -- Handle UPDATE operations (equipment changes)
  ELSIF TG_OP = 'UPDATE' THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for both INSERT and UPDATE
CREATE TRIGGER track_equipment_assignment_changes
  AFTER INSERT OR UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION track_equipment_assignment_change();
