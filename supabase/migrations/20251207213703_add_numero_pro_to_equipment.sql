/*
  # Add professional number field to equipment

  1. Changes
    - Add numero_pro (professional number) field to equipment table
    - Make name field nullable since it will be replaced by brand/model
    
  2. Notes
    - Existing equipment will have null values for numero_pro
    - Name field is made nullable for backward compatibility
*/

ALTER TABLE equipment 
  ADD COLUMN IF NOT EXISTS numero_pro text;

ALTER TABLE equipment 
  ALTER COLUMN name DROP NOT NULL;
