import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Enterprise {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color_scheme: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface EnterpriseContextType {
  currentEnterprise: Enterprise | null;
  setCurrentEnterprise: (enterprise: Enterprise | null) => void;
  enterprises: Enterprise[];
  loading: boolean;
  getEnterpriseBySlug: (slug: string) => Enterprise | null;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export const EnterpriseProvider = ({ children }: { children: ReactNode }) => {
  const [currentEnterprise, setCurrentEnterprise] = useState<Enterprise | null>(null);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnterprises();
  }, []);

  useEffect(() => {
    if (!loading && enterprises.length > 0 && !currentEnterprise) {
      setCurrentEnterprise(enterprises[0]);
    }
  }, [loading, enterprises.length]);

  const loadEnterprises = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const isAdminOrDirecteur = profile?.role === 'admin' || profile?.role === 'directeur_general';

    if (isAdminOrDirecteur) {
      const { data, error } = await supabase
        .from('enterprises')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading enterprises:', error);
      } else if (data) {
        setEnterprises(data);
      }
    } else {
      const { data: accessData } = await supabase
        .from('user_enterprise_access')
        .select('enterprise_id')
        .eq('user_id', userId);

      if (accessData && accessData.length > 0) {
        const enterpriseIds = accessData.map(a => a.enterprise_id);

        const { data, error } = await supabase
          .from('enterprises')
          .select('*')
          .eq('is_active', true)
          .in('id', enterpriseIds)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading enterprises:', error);
        } else if (data) {
          setEnterprises(data);
        }
      }
    }

    setLoading(false);
  };

  const getEnterpriseBySlug = (slug: string): Enterprise | null => {
    return enterprises.find(e => e.slug === slug) || null;
  };

  const value = useMemo(() => ({
    currentEnterprise,
    setCurrentEnterprise,
    enterprises,
    loading,
    getEnterpriseBySlug,
  }), [currentEnterprise, enterprises, loading]);

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
};

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (context === undefined) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider');
  }
  return context;
};
