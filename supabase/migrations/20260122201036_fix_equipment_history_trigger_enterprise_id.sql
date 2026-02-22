/*
  # Fix Equipment History Trigger for Enterprise ID
  
  1. Problem
    - The equipment history trigger doesn't include enterprise_id when creating history records
    - This causes "null value in column enterprise_id" error when assigning equipment
  
  2. Solution
    - Update the trigger function to include enterprise_id from the equipment record
    - Both INSERT and UPDATE operations will now properly set enterprise_id
  
  3. Changes
    - Modified track_equipment_assignment_change() function to include enterprise_id
    - enterprise_id is copied from the equipment record (NEW.enterprise_id)
*/

-- Drop and recreate the function to handle enterprise_id
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
        notes,
        enterprise_id
      ) VALUES (
        NEW.id,
        NEW.assigned_employee_id,
        now(),
        NULL,
        auth.uid(),
        NULL,
        NEW.enterprise_id
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
          notes,
          enterprise_id
        ) VALUES (
          NEW.id,
          NEW.assigned_employee_id,
          now(),
          NULL,
          auth.uid(),
          NULL,
          NEW.enterprise_id
        );
      END IF;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
