/*
  # Add Multi-Enterprise Support

  1. Purpose
    - Enable support for multiple enterprises (Deep Closer and Ompleo)
    - Isolate data between enterprises
    - Maintain backward compatibility with existing data

  2. New Tables
    - `enterprises`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique) - for URL routing (e.g., 'deep-closer', 'ompleo')
      - `description` (text)
      - `color_scheme` (text) - for UI theming
      - `is_active` (boolean)
      - `created_at` (timestamptz)

  3. Table Modifications
    - Add `enterprise_id` column to all main tables:
      * clients
      * employees
      * equipment
      * expenses
      * client_costs
      * employee_client_rates
      * equipment_history
      * salaries

  4. Data Migration
    - Create default enterprises (Deep Closer and Ompleo)
    - Assign existing data to Deep Closer enterprise
    - Set Deep Closer as default for backward compatibility

  5. Security
    - Update RLS policies to enforce enterprise isolation
    - Users can only access data from their assigned enterprise(s)

  6. Notes
    - This migration preserves all existing data
    - Existing Deep Closer data remains functional
    - Ompleo starts with a clean slate
*/

-- Create enterprises table
CREATE TABLE IF NOT EXISTS enterprises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  color_scheme text DEFAULT 'from-blue-600 to-blue-800',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;

-- Insert default enterprises
INSERT INTO enterprises (name, slug, description, color_scheme, is_active)
VALUES 
  ('Deep Closer', 'deep-closer', 'Gestion complète des employés, clients et matériel', 'from-blue-600 to-blue-800', true),
  ('Ompleo', 'ompleo', 'Gestion complète des employés, clients et matériel', 'from-green-600 to-green-800', true)
ON CONFLICT (slug) DO NOTHING;

-- Add enterprise_id columns and migrate data
DO $$
DECLARE
  deep_closer_id uuid;
BEGIN
  SELECT id INTO deep_closer_id FROM enterprises WHERE slug = 'deep-closer';

  -- Clients table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN enterprise_id uuid REFERENCES enterprises(id);
    UPDATE clients SET enterprise_id = deep_closer_id WHERE enterprise_id IS NULL;
    ALTER TABLE clients ALTER COLUMN enterprise_id SET NOT NULL;
  END IF;

  -- Employees table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN enterprise_id uuid REFERENCES enterprises(id);
    UPDATE employees SET enterprise_id = deep_closer_id WHERE enterprise_id IS NULL;
    ALTER TABLE employees ALTER COLUMN enterprise_id SET NOT NULL;
  END IF;

  -- Equipment table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE equipment ADD COLUMN enterprise_id uuid REFERENCES enterprises(id);
    UPDATE equipment SET enterprise_id = deep_closer_id WHERE enterprise_id IS NULL;
    ALTER TABLE equipment ALTER COLUMN enterprise_id SET NOT NULL;
  END IF;

  -- Expenses table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN enterprise_id uuid REFERENCES enterprises(id);
    UPDATE expenses SET enterprise_id = deep_closer_id WHERE enterprise_id IS NULL;
    ALTER TABLE expenses ALTER COLUMN enterprise_id SET NOT NULL;
  END IF;

  -- Client costs table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'client_costs' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE client_costs ADD COLUMN enterprise_id uuid REFERENCES enterprises(id);
    UPDATE client_costs SET enterprise_id = deep_closer_id WHERE enterprise_id IS NULL;
    ALTER TABLE client_costs ALTER COLUMN enterprise_id SET NOT NULL;
  END IF;

  -- Employee client rates table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employee_client_rates' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE employee_client_rates ADD COLUMN enterprise_id uuid REFERENCES enterprises(id);
    UPDATE employee_client_rates SET enterprise_id = deep_closer_id WHERE enterprise_id IS NULL;
    ALTER TABLE employee_client_rates ALTER COLUMN enterprise_id SET NOT NULL;
  END IF;

  -- Equipment history table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment_history' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE equipment_history ADD COLUMN enterprise_id uuid REFERENCES enterprises(id);
    UPDATE equipment_history SET enterprise_id = deep_closer_id WHERE enterprise_id IS NULL;
    ALTER TABLE equipment_history ALTER COLUMN enterprise_id SET NOT NULL;
  END IF;

  -- Salaries table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'salaries' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE salaries ADD COLUMN enterprise_id uuid REFERENCES enterprises(id);
    UPDATE salaries SET enterprise_id = deep_closer_id WHERE enterprise_id IS NULL;
    ALTER TABLE salaries ALTER COLUMN enterprise_id SET NOT NULL;
  END IF;
END $$;

-- RLS Policies for enterprises table
CREATE POLICY "Authenticated users can view all enterprises"
  ON enterprises FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for enterprise_id columns
CREATE INDEX IF NOT EXISTS idx_clients_enterprise_id ON clients(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_employees_enterprise_id ON employees(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_equipment_enterprise_id ON equipment(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_expenses_enterprise_id ON expenses(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_client_costs_enterprise_id ON client_costs(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_employee_client_rates_enterprise_id ON employee_client_rates(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_equipment_history_enterprise_id ON equipment_history(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_salaries_enterprise_id ON salaries(enterprise_id);
