-- =====================================================
-- Gestion Pro - MySQL Compatible Database Export
-- =====================================================
-- Generated: 2025-12-15
-- Database: MySQL/MariaDB
-- Character Set: UTF-8
--
-- IMPORTANT NOTES:
-- - This is a MySQL conversion of the PostgreSQL schema
-- - Row Level Security (RLS) is NOT supported - implement in application layer
-- - UUID support uses VARCHAR(36) instead of native UUID type
-- - auth.uid() functions removed - handle authentication in your application
-- - Supabase Storage features not available
--
-- Tables included:
-- - profiles (user profiles)
-- - user_permissions (user access control)
-- - settings (system settings)
-- - clients (client management)
-- - employees (employee management)
-- - employee_rates (employee billing rates)
-- - equipment (equipment/material tracking)
-- - equipment_history (equipment assignment history)
-- - expenses (professional expenses)
-- - personal_expenses (personal expenses)
-- - client_costs (client cost tracking)
-- - one_time_tokens (temporary access tokens)
-- - salaries (salary records)
--
-- =====================================================

SET FOREIGN_KEY_CHECKS=0;

-- =====================================================
-- PROFILES TABLE
-- =====================================================
DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'assistante', 'directeur_general', 'assistante_direction', 'manager_general')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_profiles_email (email),
  INDEX idx_profiles_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER_PERMISSIONS TABLE
-- =====================================================
DROP TABLE IF EXISTS user_permissions;
CREATE TABLE user_permissions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  module VARCHAR(50) NOT NULL CHECK (module IN ('employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'expenses_personal', 'dashboard', 'organization', 'users')),
  can_read BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_module (user_id, module),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_user_permissions_user_id (user_id),
  INDEX idx_user_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
  id VARCHAR(36) PRIMARY KEY,
  `key` VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_settings_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default exchange rate
INSERT INTO settings (id, `key`, value, description)
VALUES (UUID(), 'exchange_rate_eur_dzd', '140', 'Taux de change EUR vers DZD');

-- =====================================================
-- EMPLOYEES TABLE
-- =====================================================
DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  manager_id VARCHAR(36),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  hire_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  photo_url TEXT,
  monthly_salary DECIMAL(15,2) DEFAULT 0 NOT NULL,
  recharge DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_employees_user_id (user_id),
  INDEX idx_employees_manager_id (manager_id),
  INDEX idx_employees_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add self-referencing foreign key after table creation
ALTER TABLE employees
  ADD CONSTRAINT fk_employees_manager
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  manager_id VARCHAR(36),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  payment_date INT CHECK (payment_date >= 1 AND payment_date <= 31),
  photo_url TEXT,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_clients_manager_id (manager_id),
  INDEX idx_clients_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CLIENT_COSTS TABLE
-- =====================================================
DROP TABLE IF EXISTS client_costs;
CREATE TABLE client_costs (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(15,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client_costs_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EMPLOYEE_CLIENT_RATES TABLE
-- =====================================================
DROP TABLE IF EXISTS employee_client_rates;
CREATE TABLE employee_client_rates (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  monthly_rate DECIMAL(15,2) DEFAULT 0 NOT NULL,
  start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_client_start (employee_id, client_id, start_date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_employee_client_rates_employee (employee_id),
  INDEX idx_employee_client_rates_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EQUIPMENT TABLE
-- =====================================================
DROP TABLE IF EXISTS equipment;
CREATE TABLE equipment (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(100),
  brand VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  numero_pro TEXT,
  qr_code VARCHAR(50) UNIQUE,
  purchase_date DATE,
  purchase_price DECIMAL(15,2),
  purchase_currency VARCHAR(10) DEFAULT 'DZD' CHECK (purchase_currency IN ('EUR', 'DZD')),
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')),
  assigned_employee_id VARCHAR(36),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_equipment_assigned_employee (assigned_employee_id),
  INDEX idx_equipment_status (status),
  INDEX idx_equipment_qr_code (qr_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EQUIPMENT_HISTORY TABLE
-- =====================================================
DROP TABLE IF EXISTS equipment_history;
CREATE TABLE equipment_history (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  employee_id VARCHAR(36) NOT NULL,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  returned_date TIMESTAMP NULL,
  assigned_by VARCHAR(36),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_equipment_history_equipment (equipment_id),
  INDEX idx_equipment_history_employee (employee_id),
  INDEX idx_equipment_history_assigned_by (assigned_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EXPENSES TABLE
-- =====================================================
DROP TABLE IF EXISTS expenses;
CREATE TABLE expenses (
  id VARCHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'DZD' CHECK (currency IN ('EUR', 'DZD')),
  date DATE NOT NULL,
  description TEXT,
  employee_id VARCHAR(36),
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_expenses_employee_id (employee_id),
  INDEX idx_expenses_date (date),
  INDEX idx_expenses_currency (currency),
  INDEX idx_expenses_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PERSONAL_EXPENSES TABLE
-- =====================================================
DROP TABLE IF EXISTS personal_expenses;
CREATE TABLE personal_expenses (
  id VARCHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'DZD' CHECK (currency IN ('EUR', 'DZD')),
  date DATE NOT NULL,
  description TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_personal_expenses_date (date),
  INDEX idx_personal_expenses_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SALARIES TABLE
-- =====================================================
DROP TABLE IF EXISTS salaries;
CREATE TABLE salaries (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL,
  base_salary DECIMAL(15,2) DEFAULT 0,
  bonuses DECIMAL(15,2) DEFAULT 0,
  deductions DECIMAL(15,2) DEFAULT 0,
  net_salary DECIMAL(15,2) DEFAULT 0,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_month_year (employee_id, month, year),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_salaries_employee (employee_id),
  INDEX idx_salaries_year_month (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ONE_TIME_TOKENS TABLE
-- =====================================================
DROP TABLE IF EXISTS one_time_tokens;
CREATE TABLE one_time_tokens (
  id VARCHAR(36) PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_one_time_tokens_token (token(255)),
  INDEX idx_one_time_tokens_expires (expires_at, used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Generate QR codes for equipment
DELIMITER //
CREATE TRIGGER equipment_before_insert
BEFORE INSERT ON equipment
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL THEN
    SET NEW.id = UUID();
  END IF;
  IF NEW.qr_code IS NULL THEN
    SET NEW.qr_code = CONCAT('QR-', SUBSTRING(MD5(CONCAT(RAND(), NOW())), 1, 12));
  END IF;
END//
DELIMITER ;

-- Track equipment assignment changes
DELIMITER //
CREATE TRIGGER equipment_assignment_after_insert
AFTER INSERT ON equipment
FOR EACH ROW
BEGIN
  IF NEW.assigned_employee_id IS NOT NULL THEN
    INSERT INTO equipment_history (id, equipment_id, employee_id, assigned_date, returned_date, assigned_by, notes)
    VALUES (UUID(), NEW.id, NEW.assigned_employee_id, NOW(), NULL, NULL, NULL);
  END IF;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER equipment_assignment_after_update
AFTER UPDATE ON equipment
FOR EACH ROW
BEGIN
  IF OLD.assigned_employee_id IS NOT NULL AND (NEW.assigned_employee_id IS NULL OR NEW.assigned_employee_id != OLD.assigned_employee_id) THEN
    UPDATE equipment_history
    SET returned_date = NOW()
    WHERE equipment_id = OLD.id
      AND employee_id = OLD.assigned_employee_id
      AND returned_date IS NULL;
  END IF;

  IF NEW.assigned_employee_id IS NOT NULL AND (OLD.assigned_employee_id IS NULL OR NEW.assigned_employee_id != OLD.assigned_employee_id) THEN
    INSERT INTO equipment_history (id, equipment_id, employee_id, assigned_date, returned_date, assigned_by, notes)
    VALUES (UUID(), NEW.id, NEW.assigned_employee_id, NOW(), NULL, NULL, NULL);
  END IF;
END//
DELIMITER ;

-- Auto-generate UUIDs for tables without triggers
DELIMITER //
CREATE TRIGGER profiles_before_insert BEFORE INSERT ON profiles FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER user_permissions_before_insert BEFORE INSERT ON user_permissions FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER settings_before_insert BEFORE INSERT ON settings FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER employees_before_insert BEFORE INSERT ON employees FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER clients_before_insert BEFORE INSERT ON clients FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER client_costs_before_insert BEFORE INSERT ON client_costs FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER employee_client_rates_before_insert BEFORE INSERT ON employee_client_rates FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER equipment_history_before_insert BEFORE INSERT ON equipment_history FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER expenses_before_insert BEFORE INSERT ON expenses FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER personal_expenses_before_insert BEFORE INSERT ON personal_expenses FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER salaries_before_insert BEFORE INSERT ON salaries FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
CREATE TRIGGER one_time_tokens_before_insert BEFORE INSERT ON one_time_tokens FOR EACH ROW BEGIN IF NEW.id IS NULL THEN SET NEW.id = UUID(); END IF; END//
DELIMITER ;

SET FOREIGN_KEY_CHECKS=1;

-- =====================================================
-- SAMPLE ADMIN USER (OPTIONAL)
-- =====================================================
-- NOTE: In MySQL, you need to handle authentication separately
-- This creates a profile entry, but you'll need to set up
-- authentication in your application layer
--
-- INSERT INTO profiles (id, email, first_name, last_name, role)
-- VALUES (UUID(), 'admin@demo.com', 'Admin', 'Système', 'admin');
--
-- Then grant all permissions:
-- INSERT INTO user_permissions (id, user_id, module, can_read, can_create, can_update, can_delete)
-- SELECT UUID(), p.id, m.module, TRUE, TRUE, TRUE, TRUE
-- FROM profiles p
-- CROSS JOIN (
--   SELECT 'dashboard' AS module UNION ALL
--   SELECT 'employees' UNION ALL
--   SELECT 'clients' UNION ALL
--   SELECT 'equipment' UNION ALL
--   SELECT 'salaries' UNION ALL
--   SELECT 'expenses_professional' UNION ALL
--   SELECT 'expenses_personal' UNION ALL
--   SELECT 'organization' UNION ALL
--   SELECT 'users'
-- ) m
-- WHERE p.email = 'admin@demo.com';

-- =====================================================
-- IMPORTANT SECURITY NOTES
-- =====================================================
--
-- MySQL does NOT support Row Level Security (RLS) like PostgreSQL.
-- You MUST implement access control in your application layer:
--
-- 1. Authentication: Handle user login/sessions in your app
-- 2. Authorization: Check user_permissions table before operations
-- 3. Data Filtering: Filter queries based on user role and permissions
--
-- Example application-level checks:
-- - Admins can see all data
-- - Managers can only see data they manage (via manager_id)
-- - Employees can only see their own data (via user_id)
--
-- NEVER trust client-side code for security!
-- Always validate permissions on the server.
--
-- =====================================================
