/*
  # Update RLS Policies for Enterprise Isolation

  ## Overview
  This migration updates ALL Row Level Security (RLS) policies to enforce enterprise data isolation.
  Users can only access data that belongs to an enterprise they are associated with.

  ## Tables Updated
  1. clients - Client records
  2. employees - Employee records  
  3. equipment - Equipment records
  4. equipment_history - Equipment assignment history
  5. expenses - Company expenses
  6. salaries - Salary records
  7. employee_client_rates - Employee-client rate assignments
  8. client_costs - Additional client costs

  ## Policy Pattern
  Each policy checks TWO things:
  1. User has the appropriate permission for the module
  2. Data belongs to an enterprise the user has access to (via their profile)

  ## Notes
  - Super admins and general admins may have broader access
  - The WITH CHECK clause ensures new data is created with valid enterprise associations
*/

-- ========================================
-- CLIENTS TABLE POLICIES
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
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_read = true
        AND up.enterprise_id = clients.enterprise_id
        AND p.enterprise_id = clients.enterprise_id
    )
  );

CREATE POLICY "Users can create clients with permission"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_create = true
        AND up.enterprise_id = clients.enterprise_id
        AND p.enterprise_id = clients.enterprise_id
    )
  );

CREATE POLICY "Users can update clients with permission"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = clients.enterprise_id
        AND p.enterprise_id = clients.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = clients.enterprise_id
        AND p.enterprise_id = clients.enterprise_id
    )
  );

CREATE POLICY "Users can delete clients with permission"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_delete = true
        AND up.enterprise_id = clients.enterprise_id
        AND p.enterprise_id = clients.enterprise_id
    )
  );

-- ========================================
-- EMPLOYEES TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view employees with permission" ON employees;
DROP POLICY IF EXISTS "Users can create employees with permission" ON employees;
DROP POLICY IF EXISTS "Allow public to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to create employees" ON employees;
DROP POLICY IF EXISTS "Users can update employees with permission" ON employees;
DROP POLICY IF EXISTS "Users can delete employees with permission" ON employees;

CREATE POLICY "Users can view employees with permission"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_read = true
        AND up.enterprise_id = employees.enterprise_id
        AND p.enterprise_id = employees.enterprise_id
    )
  );

CREATE POLICY "Users can create employees with permission"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_create = true
        AND up.enterprise_id = employees.enterprise_id
        AND p.enterprise_id = employees.enterprise_id
    )
  );

CREATE POLICY "Users can update employees with permission"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_update = true
        AND up.enterprise_id = employees.enterprise_id
        AND p.enterprise_id = employees.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_update = true
        AND up.enterprise_id = employees.enterprise_id
        AND p.enterprise_id = employees.enterprise_id
    )
  );

CREATE POLICY "Users can delete employees with permission"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'employees'
        AND up.can_delete = true
        AND up.enterprise_id = employees.enterprise_id
        AND p.enterprise_id = employees.enterprise_id
    )
  );

-- ========================================
-- EQUIPMENT TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view equipment with permission" ON equipment;
DROP POLICY IF EXISTS "Public can view equipment" ON equipment;
DROP POLICY IF EXISTS "Users can create equipment with permission" ON equipment;
DROP POLICY IF EXISTS "Users can update equipment with permission" ON equipment;
DROP POLICY IF EXISTS "Users can delete equipment with permission" ON equipment;

CREATE POLICY "Users can view equipment with permission"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_read = true
        AND up.enterprise_id = equipment.enterprise_id
        AND p.enterprise_id = equipment.enterprise_id
    )
  );

CREATE POLICY "Users can create equipment with permission"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_create = true
        AND up.enterprise_id = equipment.enterprise_id
        AND p.enterprise_id = equipment.enterprise_id
    )
  );

CREATE POLICY "Users can update equipment with permission"
  ON equipment FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_update = true
        AND up.enterprise_id = equipment.enterprise_id
        AND p.enterprise_id = equipment.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_update = true
        AND up.enterprise_id = equipment.enterprise_id
        AND p.enterprise_id = equipment.enterprise_id
    )
  );

CREATE POLICY "Users can delete equipment with permission"
  ON equipment FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_delete = true
        AND up.enterprise_id = equipment.enterprise_id
        AND p.enterprise_id = equipment.enterprise_id
    )
  );

-- ========================================
-- EXPENSES TABLE POLICIES  
-- ========================================

DROP POLICY IF EXISTS "Users can view professional expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can view personal expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can update professional expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can update personal expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can delete professional expenses with permission" ON expenses;
DROP POLICY IF EXISTS "Users can delete personal expenses with permission" ON expenses;

CREATE POLICY "Users can view expenses with permission"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_read = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_read = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
        AND p.enterprise_id = expenses.enterprise_id
    )
  );

CREATE POLICY "Users can create expenses with permission"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_create = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_create = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
        AND p.enterprise_id = expenses.enterprise_id
    )
  );

CREATE POLICY "Users can update expenses with permission"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_update = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_update = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
        AND p.enterprise_id = expenses.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_update = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_update = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
        AND p.enterprise_id = expenses.enterprise_id
    )
  );

CREATE POLICY "Users can delete expenses with permission"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND (
          (expenses.type = 'professional' AND up.module = 'expenses' AND up.can_delete = true)
          OR
          (expenses.type = 'personal' AND up.module = 'personal_expenses' AND up.can_delete = true)
        )
        AND up.enterprise_id = expenses.enterprise_id
        AND p.enterprise_id = expenses.enterprise_id
    )
  );

-- ========================================
-- EMPLOYEE_CLIENT_RATES TABLE POLICIES
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
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_read = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
        AND p.enterprise_id = employee_client_rates.enterprise_id
    )
  );

CREATE POLICY "Users can create employee client rates with permission"
  ON employee_client_rates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_create = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
        AND p.enterprise_id = employee_client_rates.enterprise_id
    )
  );

CREATE POLICY "Users can update employee client rates with permission"
  ON employee_client_rates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
        AND p.enterprise_id = employee_client_rates.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
        AND p.enterprise_id = employee_client_rates.enterprise_id
    )
  );

CREATE POLICY "Users can delete employee client rates with permission"
  ON employee_client_rates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_delete = true
        AND up.enterprise_id = employee_client_rates.enterprise_id
        AND p.enterprise_id = employee_client_rates.enterprise_id
    )
  );

-- ========================================
-- CLIENT_COSTS TABLE POLICIES
-- ========================================

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
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_read = true
        AND up.enterprise_id = client_costs.enterprise_id
        AND p.enterprise_id = client_costs.enterprise_id
    )
  );

CREATE POLICY "Users can create client costs with permission"
  ON client_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_create = true
        AND up.enterprise_id = client_costs.enterprise_id
        AND p.enterprise_id = client_costs.enterprise_id
    )
  );

CREATE POLICY "Users can update client costs with permission"
  ON client_costs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = client_costs.enterprise_id
        AND p.enterprise_id = client_costs.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_update = true
        AND up.enterprise_id = client_costs.enterprise_id
        AND p.enterprise_id = client_costs.enterprise_id
    )
  );

CREATE POLICY "Users can delete client costs with permission"
  ON client_costs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'clients'
        AND up.can_delete = true
        AND up.enterprise_id = client_costs.enterprise_id
        AND p.enterprise_id = client_costs.enterprise_id
    )
  );

-- ========================================
-- EQUIPMENT_HISTORY TABLE POLICIES
-- ========================================

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
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_read = true
        AND up.enterprise_id = equipment_history.enterprise_id
        AND p.enterprise_id = equipment_history.enterprise_id
    )
  );

CREATE POLICY "Users can create equipment history"
  ON equipment_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_create = true
        AND up.enterprise_id = equipment_history.enterprise_id
        AND p.enterprise_id = equipment_history.enterprise_id
    )
  );

CREATE POLICY "Users can update equipment history"
  ON equipment_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_update = true
        AND up.enterprise_id = equipment_history.enterprise_id
        AND p.enterprise_id = equipment_history.enterprise_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_update = true
        AND up.enterprise_id = equipment_history.enterprise_id
        AND p.enterprise_id = equipment_history.enterprise_id
    )
  );

CREATE POLICY "Users can delete equipment history"
  ON equipment_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE up.user_id = auth.uid()
        AND up.module = 'equipment'
        AND up.can_delete = true
        AND up.enterprise_id = equipment_history.enterprise_id
        AND p.enterprise_id = equipment_history.enterprise_id
    )
  );

-- ========================================
-- SALARIES TABLE (if it has RLS enabled)
-- ========================================

-- Note: Salaries table may not have RLS policies, but adding them for completeness
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
          INNER JOIN profiles p ON p.id = auth.uid()
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_read = true
            AND up.enterprise_id = salaries.enterprise_id
            AND p.enterprise_id = salaries.enterprise_id
        )
      );

    CREATE POLICY "Users can create salaries with permission"
      ON salaries FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN profiles p ON p.id = auth.uid()
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_create = true
            AND up.enterprise_id = salaries.enterprise_id
            AND p.enterprise_id = salaries.enterprise_id
        )
      );

    CREATE POLICY "Users can update salaries with permission"
      ON salaries FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN profiles p ON p.id = auth.uid()
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_update = true
            AND up.enterprise_id = salaries.enterprise_id
            AND p.enterprise_id = salaries.enterprise_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN profiles p ON p.id = auth.uid()
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_update = true
            AND up.enterprise_id = salaries.enterprise_id
            AND p.enterprise_id = salaries.enterprise_id
        )
      );

    CREATE POLICY "Users can delete salaries with permission"
      ON salaries FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_permissions up
          INNER JOIN profiles p ON p.id = auth.uid()
          WHERE up.user_id = auth.uid()
            AND up.module = 'salaries'
            AND up.can_delete = true
            AND up.enterprise_id = salaries.enterprise_id
            AND p.enterprise_id = salaries.enterprise_id
        )
      );
  END IF;
END $$;
