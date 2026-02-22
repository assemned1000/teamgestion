import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, User, Calendar, DollarSign, Tag, Hash } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_price: number;
  purchase_currency: string;
  purchase_date: string;
  assigned_employee_id: string | null;
  status: 'Assigné' | 'En stock' | 'Perdu' | 'Hors service';
  notes: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  personal_phone: string | null;
  professional_phone: string | null;
  photo_url: string | null;
}

export const PublicEquipmentView = () => {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    const params = new URLSearchParams(window.location.search);
    const equipmentId = params.get('id');

    if (!equipmentId) {
      setError('ID de matériel manquant');
      setLoading(false);
      return;
    }

    const { data: equipmentData, error: equipmentError } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', equipmentId)
      .maybeSingle();

    if (equipmentError || !equipmentData) {
      setError('Matériel introuvable');
      setLoading(false);
      return;
    }

    setEquipment(equipmentData);

    if (equipmentData.assigned_employee_id) {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position, personal_phone, professional_phone, photo_url')
        .eq('id', equipmentData.assigned_employee_id)
        .maybeSingle();

      if (employeeData) {
        setEmployee(employeeData);
      }
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigné':
        return 'bg-gray-700 text-white';
      case 'En stock':
        return 'bg-gray-700 text-white';
      case 'Perdu':
        return 'bg-red-100 text-red-700';
      case 'Hors service':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F1115' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6B7280' }}></div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0F1115' }}>
        <div className="card-elevated rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <Package style={{ color: '#EF4444' }} size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#EAEAF0' }}>Erreur</h1>
          <p style={{ color: '#9AA0AB' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#0F1115' }}>
      <div className="max-w-4xl mx-auto">
        <div className="card-elevated rounded-2xl overflow-hidden">
          <div className="p-8" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)' }}>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Package size={48} style={{ color: '#EAEAF0' }} />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#EAEAF0' }}>{equipment.name}</h1>
                <p className="text-lg mb-3" style={{ color: '#9AA0AB' }}>{equipment.category}</p>
                <span className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${getStatusColor(equipment.status)}`}>
                  {equipment.status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <h2 className="text-xl font-bold pb-2 mb-4" style={{ color: '#EAEAF0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Informations Techniques</h2>

                {equipment.brand && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <Tag size={20} style={{ color: '#9AA0AB' }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#6B7280' }}>Marque</p>
                      <p className="font-semibold text-lg" style={{ color: '#EAEAF0' }}>{equipment.brand}</p>
                    </div>
                  </div>
                )}

                {equipment.model && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <Package size={20} style={{ color: '#9AA0AB' }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#6B7280' }}>Modèle</p>
                      <p className="font-semibold text-lg" style={{ color: '#EAEAF0' }}>{equipment.model}</p>
                    </div>
                  </div>
                )}

                {equipment.serial_number && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <Hash size={20} style={{ color: '#9AA0AB' }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#6B7280' }}>Numéro de série</p>
                      <p className="font-mono font-semibold" style={{ color: '#EAEAF0' }}>{equipment.serial_number}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-bold pb-2 mb-4" style={{ color: '#EAEAF0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Informations d'Achat</h2>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <DollarSign size={20} style={{ color: '#9AA0AB' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Prix d'achat</p>
                    <p className="font-bold text-2xl" style={{ color: '#EAEAF0' }}>
                      {equipment.purchase_price.toLocaleString()} {equipment.purchase_currency}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Calendar size={20} style={{ color: '#9AA0AB' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Date d'achat</p>
                    <p className="font-semibold text-lg" style={{ color: '#EAEAF0' }}>
                      {new Date(equipment.purchase_date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {employee && (
              <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#EAEAF0' }}>
                  <User size={24} style={{ color: '#9AA0AB' }} />
                  Assignation
                </h2>
                <div className="flex flex-col md:flex-row gap-6">
                  {employee.photo_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={employee.photo_url}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        className="w-32 h-32 rounded-xl object-cover shadow-lg"
                        style={{ border: '2px solid rgba(255, 255, 255, 0.1)' }}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div>
                      <p className="text-sm" style={{ color: '#6B7280' }}>Nom complet</p>
                      <p className="font-bold text-lg" style={{ color: '#EAEAF0' }}>
                        {employee.first_name} {employee.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#6B7280' }}>Poste</p>
                      <p className="font-semibold" style={{ color: '#EAEAF0' }}>{employee.position}</p>
                    </div>
                    {employee.personal_phone && (
                      <div>
                        <p className="text-sm" style={{ color: '#6B7280' }}>Téléphone Personnel</p>
                        <p className="font-semibold" style={{ color: '#EAEAF0' }}>{employee.personal_phone}</p>
                      </div>
                    )}
                    {employee.professional_phone && (
                      <div>
                        <p className="text-sm" style={{ color: '#6B7280' }}>Téléphone Professionnel</p>
                        <p className="font-semibold" style={{ color: '#EAEAF0' }}>{employee.professional_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!employee && equipment.status === 'En stock' && (
              <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: '#EAEAF0' }}>
                  <User size={24} style={{ color: '#9AA0AB' }} />
                  Assignation
                </h2>
                <p style={{ color: '#9AA0AB' }}>Ce matériel n'est actuellement assigné à aucun employé</p>
              </div>
            )}

            {equipment.notes && (
              <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h2 className="text-xl font-bold mb-3" style={{ color: '#EAEAF0' }}>Notes</h2>
                <p className="leading-relaxed" style={{ color: '#9AA0AB' }}>{equipment.notes}</p>
              </div>
            )}

            <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <p className="text-sm text-center" style={{ color: '#6B7280' }}>
                ID: <span className="font-mono" style={{ color: '#9AA0AB' }}>{equipment.id}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
