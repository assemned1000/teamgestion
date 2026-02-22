import { Building2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Enterprise {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface EntreprisesProps {
  onSelectEntreprise: (entrepriseId: string) => void;
}

export const Entreprises = ({ onSelectEntreprise }: EntreprisesProps) => {
  const { canAccessEnterprise } = useAuth();
  const [entreprises, setEntreprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    const { data, error } = await supabase
      .from('enterprises')
      .select('*')
      .order('name');

    if (!error && data) {
      const accessibleEnterprises = data.filter(ent => canAccessEnterprise(ent.id));
      setEntreprises(accessibleEnterprises);
    }
    setLoading(false);
  };

  const getGradient = () => {
    return 'linear-gradient(135deg, #3F4451 0%, #2D3139 100%)';
  };

  const getDescription = (slug: string) => {
    const descriptions: Record<string, string> = {
      'deep-closer': 'Gestion complète des employés, clients et matériel',
      'ompleo': 'Gestion complète des employés, clients et matériel',
      'dubai': 'Gestion complète des clients et dépenses',
    };
    return descriptions[slug] || 'Gestion d\'entreprise';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6B7280' }}></div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ color: '#EAEAF0' }}>Entreprises</h1>
          <p className="text-base" style={{ color: '#9AA0AB' }}>Sélectionnez l'entreprise que vous souhaitez gérer</p>
        </div>

        {entreprises.length === 0 ? (
          <div className="card-surface text-center py-12">
            <Building2 size={48} className="mx-auto mb-4" style={{ color: '#6B7280' }} />
            <p className="text-lg font-medium" style={{ color: '#EAEAF0' }}>Aucune entreprise accessible</p>
            <p className="text-sm mt-2" style={{ color: '#9AA0AB' }}>Contactez l'administrateur pour obtenir l'accès aux entreprises</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entreprises.map((entreprise) => (
              <div
                key={entreprise.id}
                className="card-elevated overflow-hidden card-hover cursor-pointer flex flex-col"
                onClick={() => onSelectEntreprise(entreprise.slug)}
              >
                <div className="h-40 relative overflow-hidden flex items-center justify-center p-4" style={{ background: getGradient() }}>
                  {entreprise.logo_url ? (
                    <img
                      src={entreprise.logo_url}
                      alt={`${entreprise.name} logo`}
                      className="h-full w-auto object-contain"
                      style={{ maxHeight: '140px' }}
                    />
                  ) : (
                    <Building2 size={64} style={{ color: '#FFFFFF', opacity: 0.5 }} />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-2xl font-semibold mb-2" style={{ color: '#EAEAF0' }}>{entreprise.name}</h2>
                  <p className="text-sm mb-6 flex-grow" style={{ color: '#9AA0AB' }}>{getDescription(entreprise.slug)}</p>
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all" style={{ backgroundColor: '#6B7280', color: '#EAEAF0' }}>
                    <span>Accéder</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
