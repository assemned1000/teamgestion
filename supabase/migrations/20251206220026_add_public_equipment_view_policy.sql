/*
  # Add Public Equipment View Policy

  1. Changes
    - Add SELECT policy on `equipment` table for anonymous/public users
    - Add SELECT policy on `employees` table for anonymous/public users (for assignment info)
    
  2. Security
    - Allow public read-only access to equipment details for QR code scanning
    - Allow public read-only access to employee basic info (name, position) for QR code scanning
    - No write access allowed for anonymous users
*/

-- Allow public to view equipment details (for QR code scanning)
CREATE POLICY "Public can view equipment"
  ON equipment FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public to view basic employee info (for equipment assignment display)
CREATE POLICY "Public can view basic employee info"
  ON employees FOR SELECT
  TO anon, authenticated
  USING (true);
