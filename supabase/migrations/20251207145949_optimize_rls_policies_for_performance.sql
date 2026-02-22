/*
  # Optimize RLS Policies for Performance

  1. Performance Improvements
    - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
    - This prevents the function from being re-evaluated for each row
    - Significantly improves query performance at scale
  
  2. Tables Updated
    - profiles (3 policies)
    - user_permissions (1 policy)
    - clients (3 policies)
    - employees (4 policies)
    - equipment (4 policies)
    - equipment_history (3 policies)
    - salaries (4 policies)
    - expenses (5 policies)
    - employee_client_rates (3 policies)

  3. Important Notes
    - All policies are recreated with optimized auth function calls
    - No functional changes, only performance optimization
    - This is critical for maintaining good performance as data grows
*/

-- ==========================================
-- PROFILES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ==========================================
-- USER_PERMISSIONS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ==========================================
-- CLIENTS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can view their clients" ON clients;
CREATE POLICY "Managers can view their clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    manager_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- EMPLOYEES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all employees" ON employees;
CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can view their employees" ON employees;
CREATE POLICY "Managers can view their employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    manager_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Employees can view own record" ON employees;
CREATE POLICY "Employees can view own record"
  ON employees FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
CREATE POLICY "Admins can manage employees"
  ON employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- EQUIPMENT TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all equipment" ON equipment;
CREATE POLICY "Admins can view all equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can view their team equipment" ON equipment;
CREATE POLICY "Managers can view their team equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employees e ON e.manager_id = p.id
      WHERE p.id = (select auth.uid())
      AND p.role = 'manager'
      AND e.id = equipment.assigned_employee_id
    )
  );

DROP POLICY IF EXISTS "Employees can view own equipment" ON equipment;
CREATE POLICY "Employees can view own equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = (select auth.uid())
      AND employees.id = equipment.assigned_employee_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
CREATE POLICY "Admins can manage equipment"
  ON equipment FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- EQUIPMENT_HISTORY TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all equipment history" ON equipment_history;
CREATE POLICY "Admins can view all equipment history"
  ON equipment_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view relevant equipment history" ON equipment_history;
CREATE POLICY "Users can view relevant equipment history"
  ON equipment_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = (select auth.uid())
      AND employees.id = equipment_history.employee_id
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employees e ON e.manager_id = p.id
      WHERE p.id = (select auth.uid())
      AND p.role = 'manager'
      AND e.id = equipment_history.employee_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage equipment history" ON equipment_history;
CREATE POLICY "Admins can manage equipment history"
  ON equipment_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- SALARIES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all salaries" ON salaries;
CREATE POLICY "Admins can view all salaries"
  ON salaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can view their team salaries" ON salaries;
CREATE POLICY "Managers can view their team salaries"
  ON salaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employees e ON e.manager_id = p.id
      WHERE p.id = (select auth.uid())
      AND p.role = 'manager'
      AND e.id = salaries.employee_id
    )
  );

DROP POLICY IF EXISTS "Employees can view own salaries" ON salaries;
CREATE POLICY "Employees can view own salaries"
  ON salaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = (select auth.uid())
      AND employees.id = salaries.employee_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage salaries" ON salaries;
CREATE POLICY "Admins can manage salaries"
  ON salaries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- EXPENSES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all expenses" ON expenses;
CREATE POLICY "Admins can view all expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can view their team expenses" ON expenses;
CREATE POLICY "Managers can view their team expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employees e ON e.manager_id = p.id
      WHERE p.id = (select auth.uid())
      AND p.role = 'manager'
      AND e.id = expenses.employee_id
    )
  );

DROP POLICY IF EXISTS "Employees can view own expenses" ON expenses;
CREATE POLICY "Employees can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = (select auth.uid())
      AND employees.id = expenses.employee_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage expenses" ON expenses;
CREATE POLICY "Admins can manage expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can create expenses" ON expenses;
CREATE POLICY "Managers can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'manager'
    )
  );

-- ==========================================
-- EMPLOYEE_CLIENT_RATES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all employee rates" ON employee_client_rates;
CREATE POLICY "Admins can view all employee rates"
  ON employee_client_rates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can view their team rates" ON employee_client_rates;
CREATE POLICY "Managers can view their team rates"
  ON employee_client_rates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employees e ON e.manager_id = p.id
      WHERE p.id = (select auth.uid())
      AND p.role = 'manager'
      AND e.id = employee_client_rates.employee_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage employee rates" ON employee_client_rates;
CREATE POLICY "Admins can manage employee rates"
  ON employee_client_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );
