/*
  # Ajout de la gestion des devises EUR/DZD
  
  ## Modifications
  
  1. Table expenses
     - Ajout du champ `currency` (EUR ou DZD)
  
  2. Nouvelle table employee_client_rates
     - Tarif mensuel par employé par client (en EUR)
     - Permet de facturer différemment chaque employé
  
  3. Nouvelle table settings
     - Configuration globale (taux de change EUR/DZD)
  
  4. Mise à jour de la documentation
     - clients: tous les montants en EUR
     - employees: tous les salaires en DZD
     - expenses: EUR ou DZD selon le champ currency
*/

-- Ajouter le champ devise aux dépenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency text DEFAULT 'DZD' CHECK (currency IN ('EUR', 'DZD'));

-- Créer la table des tarifs employés par client (en EUR)
CREATE TABLE IF NOT EXISTS employee_client_rates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  monthly_rate numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, client_id, start_date)
);

-- Créer la table de configuration
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Insérer le taux de change par défaut
INSERT INTO settings (key, value, description)
VALUES ('exchange_rate_eur_dzd', '140', 'Taux de change EUR vers DZD')
ON CONFLICT (key) DO NOTHING;

-- Trigger pour updated_at sur employee_client_rates
CREATE TRIGGER employee_client_rates_updated_at 
BEFORE UPDATE ON employee_client_rates 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- Trigger pour updated_at sur settings
CREATE TRIGGER settings_updated_at 
BEFORE UPDATE ON settings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- Activer RLS sur les nouvelles tables
ALTER TABLE employee_client_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour employee_client_rates
CREATE POLICY "Admins can view all employee rates"
  ON employee_client_rates FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Managers can view their team rates"
  ON employee_client_rates FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE manager_id = auth.uid())
  );

CREATE POLICY "Admins can manage employee rates"
  ON employee_client_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Politiques RLS pour settings
CREATE POLICY "Everyone can view settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_employee_client_rates_employee_id ON employee_client_rates(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_client_rates_client_id ON employee_client_rates(client_id);
CREATE INDEX IF NOT EXISTS idx_employee_client_rates_dates ON employee_client_rates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Ajouter un champ devise pour le matériel (optionnel)
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS purchase_currency text DEFAULT 'DZD' CHECK (purchase_currency IN ('EUR', 'DZD'));
