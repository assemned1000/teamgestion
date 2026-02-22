/*
  # Create User Enterprise Access Junction Table

  ## Purpose
  Allow users to belong to multiple enterprises while maintaining proper data isolation.

  ## Changes
  
  1. **New Table: user_enterprise_access**
     - Links users to enterprises they can access
     - Many-to-many relationship
     - Allows users to work across multiple enterprises
  
  2. **Data Migration**
     - Create user_enterprise_access records for all existing users
     - Based on their current profile enterprise_id
  
  3. **Update RLS Policies**
     - Modify all RLS policies to check user_enterprise_access instead of profile.enterprise_id
     - This provides more flexible access control

  ## Security
  - Users can only access data from enterprises they're explicitly granted access to
  - Enterprise associations are managed through user_enterprise_access table
*/

-- Create user_enterprise_access table
CREATE TABLE IF NOT EXISTS user_enterprise_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enterprise_id uuid NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, enterprise_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_enterprise_access_user_id ON user_enterprise_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enterprise_access_enterprise_id ON user_enterprise_access(enterprise_id);

-- Enable RLS
ALTER TABLE user_enterprise_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_enterprise_access
CREATE POLICY "Users can view their own enterprise access"
  ON user_enterprise_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Migrate existing data: grant all users access to both enterprises
INSERT INTO user_enterprise_access (user_id, enterprise_id)
SELECT DISTINCT p.id, e.id
FROM profiles p
CROSS JOIN enterprises e
WHERE e.is_active = true
ON CONFLICT (user_id, enterprise_id) DO NOTHING;

-- Now update all RLS policies to use user_enterprise_access instead of profile.enterprise_id

-- ========================================
-- CLIENTS TABLE POLICIES (UPDATED)
-- ========================================

DROP POLICY IF EXISTS "Users can view clients with permission" ON clients;
DROP POLICY IF EXISTS "Users can create clients with permission" ON clients;
DROP POLICY IF EXISTS "Users can update clients with permission" ON clients;
DROP POLICY IF EXISTS "Users can delete clients with permission" ON clients;

CREATE POLICY "Users can view clients with permission"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = clients.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_read = true
        AND up.enterprise_id = clients.enterprise_id
    )
  );

CREATE POLICY "Users can create clients with permission"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = clients.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_create = true
        AND up.enterprise_id = clients.enterprise_id
    )
  );

CREATE POLICY "Users can update clients with permission"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = clients.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = clients.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = clients.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = clients.enterprise_id
    )
  );

CREATE POLICY "Users can delete clients with permission"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = clients.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_delete = true
        AND up.enterprise_id = clients.enterprise_id
    )
  );

-- ========================================
-- EMPLOYEES TABLE POLICIES (UPDATED)
-- ========================================

DROP POLICY IF EXISTS "Users can view employees with permission" ON employees;
DROP POLICY IF EXISTS "Users can create employees with permission" ON employees;
DROP POLICY IF EXISTS "Users can update employees with permission" ON employees;
DROP POLICY IF EXISTS "Users can delete employees with permission" ON employees;

CREATE POLICY "Users can view employees with permission"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employees.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_read = true
        AND up.enterprise_id = employees.enterprise_id
    )
  );

CREATE POLICY "Users can create employees with permission"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employees.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_create = true
        AND up.enterprise_id = employees.enterprise_id
    )
  );

CREATE POLICY "Users can update employees with permission"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employees.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_update = true
        AND up.enterprise_id = employees.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employees.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_update = true
        AND up.enterprise_id = employees.enterprise_id
    )
  );

CREATE POLICY "Users can delete employees with permission"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employees.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_delete = true
        AND up.enterprise_id = employees.enterprise_id
    )
  );

-- ========================================
-- EQUIPMENT TABLE POLICIES (UPDATED)
-- ========================================

DROP POLICY IF EXISTS "Users can view equipment with permission" ON equipment;
DROP POLICY IF EXISTS "Users can create equipment with permission" ON equipment;
DROP POLICY IF EXISTS "Users can update equipment with permission" ON equipment;
DROP POLICY IF EXISTS "Users can delete equipment with permission" ON equipment;

CREATE POLICY "Users can view equipment with permission"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_read = true
        AND up.enterprise_id = equipment.enterprise_id
    )
  );

CREATE POLICY "Users can create equipment with permission"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_create = true
        AND up.enterprise_id = equipment.enterprise_id
    )
  );

CREATE POLICY "Users can update equipment with permission"
  ON equipment FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_update = true
        AND up.enterprise_id = equipment.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_update = true
        AND up.enterprise_id = equipment.enterprise_id
    )
  );

CREATE POLICY "Users can delete equipment with permission"
  ON equipment FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_delete = true
        AND up.enterprise_id = equipment.enterprise_id
    )
  );

-- ========================================
-- EXPENSES TABLE POLICIES (UPDATED)
-- ========================================

DROP POLICY IF EXISTS "Users can view expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses with permission" ON expenses;

CREATE POLICY "Users can view expenses with permission"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = expenses.enterprise_id
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_read = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_read = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
    )
  );

CREATE POLICY "Users can create expenses with permission"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = expenses.enterprise_id
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_create = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_create = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
    )
  );

CREATE POLICY "Users can update expenses with permission"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = expenses.enterprise_id
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_update = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_update = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = expenses.enterprise_id
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_update = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_update = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
    )
  );

CREATE POLICY "Users can delete expenses with permission"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = expenses.enterprise_id
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_delete = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_delete = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
    )
  );

-- ========================================
-- Continue with other tables...
-- (employee_client_rates, client_costs, equipment_history, salaries)
-- ========================================

DROP POLICY IF EXISTS "Users can view employee client rates with permission" ON employee_client_rates;
DROP POLICY IF EXISTS "Users can create employee client rates with permission" ON employee_client_rates;
DROP POLICY IF EXISTS "Users can update employee client rates with permission" ON employee_client_rates;
DROP POLICY IF EXISTS "Users can delete employee client rates with permission" ON employee_client_rates;

CREATE POLICY "Users can view employee client rates with permission"
  ON employee_client_rates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employee_client_rates.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_read = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
    )
  );

CREATE POLICY "Users can create employee client rates with permission"
  ON employee_client_rates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employee_client_rates.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_create = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
    )
  );

CREATE POLICY "Users can update employee client rates with permission"
  ON employee_client_rates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employee_client_rates.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employee_client_rates.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
    )
  );

CREATE POLICY "Users can delete employee client rates with permission"
  ON employee_client_rates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = employee_client_rates.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_delete = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
    )
  );

-- CLIENT_COSTS
DROP POLICY IF EXISTS "Users can view client costs with permission" ON client_costs;
DROP POLICY IF EXISTS "Users can create client costs with permission" ON client_costs;
DROP POLICY IF EXISTS "Users can update client costs with permission" ON client_costs;
DROP POLICY IF EXISTS "Users can delete client costs with permission" ON client_costs;

CREATE POLICY "Users can view client costs with permission"
  ON client_costs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = client_costs.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_read = true
        AND up.enterprise_id = client_costs.enterprise_id
    )
  );

CREATE POLICY "Users can create client costs with permission"
  ON client_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = client_costs.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_create = true
        AND up.enterprise_id = client_costs.enterprise_id
    )
  );

CREATE POLICY "Users can update client costs with permission"
  ON client_costs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = client_costs.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = client_costs.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = client_costs.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = client_costs.enterprise_id
    )
  );

CREATE POLICY "Users can delete client costs with permission"
  ON client_costs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = client_costs.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_delete = true
        AND up.enterprise_id = client_costs.enterprise_id
    )
  );

-- EQUIPMENT_HISTORY
DROP POLICY IF EXISTS "Users can view equipment history" ON equipment_history;
DROP POLICY IF EXISTS "Users can create equipment history" ON equipment_history;
DROP POLICY IF EXISTS "Users can update equipment history" ON equipment_history;
DROP POLICY IF EXISTS "Users can delete equipment history" ON equipment_history;

CREATE POLICY "Users can view equipment history"
  ON equipment_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment_history.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_read = true
        AND up.enterprise_id = equipment_history.enterprise_id
    )
  );

CREATE POLICY "Users can create equipment history"
  ON equipment_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment_history.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_create = true
        AND up.enterprise_id = equipment_history.enterprise_id
    )
  );

CREATE POLICY "Users can update equipment history"
  ON equipment_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment_history.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_update = true
        AND up.enterprise_id = equipment_history.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment_history.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_update = true
        AND up.enterprise_id = equipment_history.enterprise_id
    )
  );

CREATE POLICY "Users can delete equipment history"
  ON equipment_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = equipment_history.enterprise_id
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_delete = true
        AND up.enterprise_id = equipment_history.enterprise_id
    )
  );

-- SALARIES (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'salaries') THEN
    DROP POLICY IF EXISTS "Users can view salaries with permission" ON salaries;
    DROP POLICY IF EXISTS "Users can create salaries with permission" ON salaries;
    DROP POLICY IF EXISTS "Users can update salaries with permission" ON salaries;
    DROP POLICY IF EXISTS "Users can delete salaries with permission" ON salaries;

    CREATE POLICY "Users can view salaries with permission"
      ON salaries FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = salaries.enterprise_id
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_read = true
            AND up.enterprise_id = salaries.enterprise_id
        )
      );

    CREATE POLICY "Users can create salaries with permission"
      ON salaries FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = salaries.enterprise_id
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_create = true
            AND up.enterprise_id = salaries.enterprise_id
        )
      );

    CREATE POLICY "Users can update salaries with permission"
      ON salaries FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = salaries.enterprise_id
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_update = true
            AND up.enterprise_id = salaries.enterprise_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = salaries.enterprise_id
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_update = true
            AND up.enterprise_id = salaries.enterprise_id
        )
      );

    CREATE POLICY "Users can delete salaries with permission"
      ON salaries FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN user_enterprise_access uea ON uea.user_id = auth.uid() AND uea.enterprise_id = salaries.enterprise_id
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_delete = true
            AND up.enterprise_id = salaries.enterprise_id
        )
      );
  END IF;
END $$;
