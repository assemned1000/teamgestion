/*
  # Cleanup Orphaned Auth Users

  1. Purpose
    - Remove auth users that don't have corresponding profiles
    - These are test/failed user creation attempts

  2. Changes
    - Delete auth users without profiles
    - Keeps only valid users with complete profiles

  3. Security
    - Only affects orphaned auth records
    - Does not touch users with profiles
*/

DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id 
  FROM auth.users au 
  LEFT JOIN profiles p ON au.id = p.id 
  WHERE p.id IS NULL
);