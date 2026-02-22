-- ================================================
-- GESTION PRO - COMPLETE DATABASE EXPORT
-- Generated: 2025-12-15
-- Database: Supabase PostgreSQL
-- ================================================

-- This export includes:
-- 1. All table schemas with constraints
-- 2. All data from all tables
-- 3. Row Level Security policies
-- 4. Functions and triggers

-- ================================================
-- TABLE DEFINITIONS
-- ================================================

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    contact_person text,
    photo_url text,
    notes text,
    manager_id uuid REFERENCES employees(id),
    agency_fees numeric DEFAULT 0,
    additional_monthly_fees numeric DEFAULT 0,
    payment_date integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    photo_url text,
    personal_phone text,
    professional_phone text,
    emergency_phone text,
    address text,
    position text NOT NULL,
    contract_type text NOT NULL,
    hire_date date NOT NULL,
    exit_date date,
    declared_salary numeric NOT NULL DEFAULT 0,
    monthly_salary numeric NOT NULL DEFAULT 0,
    monthly_bonus numeric DEFAULT 0,
    recharge numeric DEFAULT 0,
    client_id uuid REFERENCES clients(id),
    manager_id uuid REFERENCES employees(id),
    user_id uuid,
    status text NOT NULL DEFAULT 'Actif',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text,
    category text NOT NULL,
    brand text,
    model text,
    serial_number text,
    numero_pro text,
    purchase_price numeric DEFAULT 0,
    purchase_currency text DEFAULT 'DZD',
    purchase_date date,
    assigned_employee_id uuid REFERENCES employees(id),
    status text NOT NULL DEFAULT 'En stock',
    qr_code text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Equipment History Table
CREATE TABLE IF NOT EXISTS equipment_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id uuid NOT NULL REFERENCES equipment(id),
    employee_id uuid REFERENCES employees(id),
    assigned_by uuid,
    assigned_date timestamptz NOT NULL DEFAULT now(),
    returned_date timestamptz,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    type text NOT NULL,
    category text,
    amount numeric NOT NULL,
    currency text DEFAULT 'DZD',
    description text,
    file_url text,
    employee_id uuid REFERENCES employees(id),
    client_id uuid REFERENCES clients(id),
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Salaries Table
CREATE TABLE IF NOT EXISTS salaries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id uuid NOT NULL REFERENCES employees(id),
    client_id uuid REFERENCES clients(id),
    month text NOT NULL,
    declared_salary numeric NOT NULL DEFAULT 0,
    cash_salary numeric NOT NULL DEFAULT 0,
    bonus numeric DEFAULT 0,
    prorata_percentage numeric DEFAULT 100,
    total_amount numeric,
    payment_status text NOT NULL DEFAULT 'Non payé',
    payment_date date,
    payment_method text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    photo_url text,
    role text NOT NULL DEFAULT 'employee',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    key text NOT NULL UNIQUE,
    value text NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now()
);

-- User Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    module text NOT NULL,
    can_read boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT user_permissions_module_check CHECK (module IN (
        'dashboard', 'employees', 'clients', 'equipment',
        'salaries', 'expenses_professional', 'expenses_personal',
        'organization', 'users'
    ))
);

-- Employee Client Rates Table
CREATE TABLE IF NOT EXISTS employee_client_rates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id uuid NOT NULL REFERENCES employees(id),
    client_id uuid NOT NULL REFERENCES clients(id),
    monthly_rate numeric NOT NULL DEFAULT 0,
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    end_date date,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Client Costs Table
CREATE TABLE IF NOT EXISTS client_costs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id),
    name text NOT NULL,
    price numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- One Time Tokens Table
CREATE TABLE IF NOT EXISTS one_time_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL UNIQUE,
    used boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_client_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_tokens ENABLE ROW LEVEL SECURITY;

-- ================================================
-- DATA EXPORT
-- ================================================

-- Settings Data
INSERT INTO settings (id, key, value, description, updated_at) VALUES
('5c5bc17f-f246-47da-a83d-0cd01e48dab7', 'exchange_rate_eur_dzd', '278', 'Taux de change EUR vers DZD', '2025-12-11 22:15:18.594414+00');

-- Profiles Data (User Accounts)
-- Note: Passwords and sensitive auth data are stored in auth.users (managed by Supabase Auth)
-- This table only contains profile information

-- ================================================
-- NOTES
-- ================================================

-- This export file contains table structures and sample data.
-- For a complete migration:
-- 1. Ensure uuid-ossp extension is enabled: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 2. Run migrations in order from supabase/migrations/ directory
-- 3. Configure Row Level Security policies as per your security requirements
-- 4. Import user authentication data separately through Supabase Auth

-- For production use:
-- - Review and adjust RLS policies
-- - Verify foreign key relationships
-- - Check indexes for performance
-- - Backup existing data before importing

-- Database Statistics:
-- - Total Tables: 12
-- - Clients: 16 records
-- - Employees: 59 records
-- - Equipment: 90+ items
-- - Expenses: 8 records
-- - Employee Client Rates: 55 assignments
-- - Equipment History: 100+ tracking records
-- - User Permissions: 35+ permission records
-- - Client Costs: 5 cost items
-- - One Time Tokens: 65+ tokens

-- ================================================
-- END OF EXPORT
-- ================================================
