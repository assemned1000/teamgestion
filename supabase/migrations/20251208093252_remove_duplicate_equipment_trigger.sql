/*
  # Remove Duplicate Equipment History Trigger

  1. Purpose
    - Remove the old trigger that tracks initial equipment assignment
    - Prevents duplicate history records on INSERT
    - The new unified trigger handles both INSERT and UPDATE

  2. Changes
    - Drop the old trigger and function: track_initial_equipment_assignment
    - Keep only the unified trigger: track_equipment_assignment_changes

  3. Important Notes
    - This ensures only one history record is created per INSERT
    - The unified trigger handles all history tracking automatically
*/

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS track_initial_equipment_assignment ON equipment;
DROP FUNCTION IF EXISTS track_initial_equipment_assignment();
