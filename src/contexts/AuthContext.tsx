import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  photo_url: string | null;
  role: 'admin' | 'directeur_general' | 'manager_general' | 'manager' | 'assistante_direction' | 'assistante' | 'employee';
}

interface Permission {
  module: string;
  enterprise_id: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface AppPermission {
  can_access_dashboard: boolean;
  can_access_entreprises: boolean;
  can_access_personal: boolean;
  can_access_users: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  permissions: Permission[];
  appPermissions: AppPermission | null;
  accessibleEnterprises: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'admin' | 'directeur_general' | 'manager_general' | 'manager' | 'assistante_direction' | 'assistante' | 'employee') => Promise<void>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  can: (module: string, action: 'read' | 'create' | 'update' | 'delete', enterpriseId?: string) => boolean;
  canAccessPage: (page: 'dashboard' | 'entreprises' | 'personal' | 'users') => boolean;
  canAccessEnterprise: (enterpriseId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [appPermissions, setAppPermissions] = useState<AppPermission | null>(null);
  const [accessibleEnterprises, setAccessibleEnterprises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setPermissions([]);
          setAppPermissions(null);
          setAccessibleEnterprises([]);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      await loadPermissions(userId);
      await loadAppPermissions(userId);
      await loadEnterpriseAccess(userId);
    }
    setLoading(false);
  };

  const loadPermissions = async (userId: string) => {
    const { data } = await supabase
      .from('user_permissions')
      .select('module, enterprise_id, can_read, can_create, can_update, can_delete')
      .eq('user_id', userId);

    if (data) {
      setPermissions(data as Permission[]);
    }
  };

  const loadAppPermissions = async (userId: string) => {
    const { data } = await supabase
      .from('user_app_permissions')
      .select('can_access_dashboard, can_access_entreprises, can_access_personal, can_access_users')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setAppPermissions(data as AppPermission);
    }
  };

  const loadEnterpriseAccess = async (userId: string) => {
    const { data } = await supabase
      .from('user_enterprise_access')
      .select('enterprise_id')
      .eq('user_id', userId);

    if (data) {
      setAccessibleEnterprises(data.map(item => item.enterprise_id));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: 'admin' | 'directeur_general' | 'manager_general' | 'manager' | 'assistante_direction' | 'assistante' | 'employee') => {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
        });

      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshPermissions = async () => {
    if (user) {
      await loadPermissions(user.id);
      await loadAppPermissions(user.id);
      await loadEnterpriseAccess(user.id);
    }
  };

  const can = (module: string, action: 'read' | 'create' | 'update' | 'delete', enterpriseId?: string): boolean => {
    if (profile?.role === 'admin') {
      return true;
    }

    if (!enterpriseId) {
      const permission = permissions.find(p => p.module === module);
      if (!permission) return false;

      switch (action) {
        case 'read': return permission.can_read;
        case 'create': return permission.can_create;
        case 'update': return permission.can_update;
        case 'delete': return permission.can_delete;
        default: return false;
      }
    }

    const permission = permissions.find(p => p.module === module && p.enterprise_id === enterpriseId);
    if (!permission) return false;

    switch (action) {
      case 'read': return permission.can_read;
      case 'create': return permission.can_create;
      case 'update': return permission.can_update;
      case 'delete': return permission.can_delete;
      default: return false;
    }
  };

  const canAccessPage = (page: 'dashboard' | 'entreprises' | 'personal' | 'users'): boolean => {
    if (profile?.role === 'admin') {
      return true;
    }

    if (!appPermissions) return false;

    switch (page) {
      case 'dashboard': return appPermissions.can_access_dashboard;
      case 'entreprises': return appPermissions.can_access_entreprises;
      case 'personal': return appPermissions.can_access_personal;
      case 'users': return appPermissions.can_access_users;
      default: return false;
    }
  };

  const canAccessEnterprise = (enterpriseId: string): boolean => {
    if (profile?.role === 'admin') {
      return true;
    }

    return accessibleEnterprises.includes(enterpriseId);
  };

  const value = useMemo(() => ({
    user,
    profile,
    permissions,
    appPermissions,
    accessibleEnterprises,
    loading,
    signIn,
    signUp,
    signOut,
    refreshPermissions,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'manager_general' || profile?.role === 'manager',
    isEmployee: profile?.role === 'employee',
    can,
    canAccessPage,
    canAccessEnterprise,
  }), [user, profile, permissions, appPermissions, accessibleEnterprises, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
