/*
  # Create Client Costs Table

  1. New Tables
    - `client_costs`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients table)
      - `name` (text, name of the cost)
      - `price` (numeric, cost amount in EUR)
      - `created_at` (timestamptz, creation timestamp)
  
  2. Security
    - Enable RLS on `client_costs` table
    - Add policies for authenticated users to manage client costs
    - Only authenticated users can view, insert, update, and delete costs
  
  3. Relationships
    - Foreign key to clients table with CASCADE delete
*/

CREATE TABLE IF NOT EXISTS client_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view client costs"
  ON client_costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client costs"
  ON client_costs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client costs"
  ON client_costs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client costs"
  ON client_costs FOR DELETE
  TO authenticated
  USING (true);
