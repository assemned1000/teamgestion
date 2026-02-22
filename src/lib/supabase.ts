import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          photo_url: string | null;
          role: 'admin' | 'manager' | 'employee';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      employees: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          photo_url: string | null;
          personal_phone: string | null;
          professional_phone: string | null;
          emergency_phone: string | null;
          address: string | null;
          position: string;
          hire_date: string;
          contract_type: 'CDD' | 'CDI' | 'Freelance';
          declared_salary: number;
          cash_salary: number;
          monthly_bonus: number;
          client_id: string | null;
          manager_id: string | null;
          user_id: string | null;
          notes: string | null;
          status: 'Actif' | 'En pause' | 'Sorti';
          exit_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
          manager_id: string | null;
          agency_fees: number;
          additional_monthly_fees: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          category: 'Téléphone' | 'PC' | 'Bureau' | 'Accessoires' | 'Autre';
          brand: string | null;
          model: string | null;
          serial_number: string | null;
          purchase_price: number;
          purchase_date: string | null;
          assigned_employee_id: string | null;
          status: 'En stock' | 'Assigné' | 'Perdu' | 'Hors service' | 'Vendu';
          qr_code: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['equipment']['Row'], 'id' | 'qr_code' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['equipment']['Insert']>;
      };
      salaries: {
        Row: {
          id: string;
          employee_id: string;
          client_id: string | null;
          month: string;
          declared_salary: number;
          cash_salary: number;
          bonus: number;
          prorata_percentage: number;
          total_amount: number;
          payment_status: 'Payé' | 'Non payé';
          payment_date: string | null;
          payment_method: 'Liquide' | 'Virement' | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['salaries']['Row'], 'id' | 'total_amount' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['salaries']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          date: string;
          type: 'Personnel' | 'Professionnel';
          category: string;
          amount: number;
          description: string | null;
          file_url: string | null;
          employee_id: string | null;
          client_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
    };
  };
};
