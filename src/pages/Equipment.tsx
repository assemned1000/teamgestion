import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { Plus, FileEdit as Edit, Trash2, Search, X, Eye, QrCode, Package, User, Grid3x3, LayoutGrid, List, History, Calendar } from 'lucide-react';

interface Equipment {
  id: string;
  name: string | null;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  numero_pro: string | null;
  purchase_price: number;
  purchase_currency: string;
  purchase_date: string;
  assigned_employee_id: string | null;
  status: 'Assigné' | 'En stock' | 'Perdu' | 'Hors service' | 'Vendu';
  notes: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  photo_url: string | null;
}

interface EquipmentHistory {
  id: string;
  equipment_id: string;
  employee_id: string | null;
  assigned_date: string;
  returned_date: string | null;
  assigned_by: string | null;
  assigned_by_profile?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  notes: string | null;
  created_at: string;
}

export const Equipment = () => {
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'grid'>('grid');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [equipmentHistory, setEquipmentHistory] = useState<EquipmentHistory[]>([]);
  const [allEquipmentHistory, setAllEquipmentHistory] = useState<EquipmentHistory[]>([]);
  const [editingHistory, setEditingHistory] = useState<EquipmentHistory | null>(null);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [historyFormData, setHistoryFormData] = useState({
    employee_id: '',
    assigned_date: '',
    returned_date: '',
    notes: '',
  });

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    category: '',
    serial_number: '',
    numero_pro: '',
    purchase_price: 0,
    purchase_currency: 'DZD',
    purchase_date: '',
    assigned_employee_id: '',
    status: 'En stock' as 'Assigné' | 'En stock' | 'Perdu' | 'Hors service' | 'Vendu',
    notes: '',
  });

  useEffect(() => {
    if (!enterpriseLoading) {
      if (currentEnterprise) {
        loadData();
      } else {
        setLoading(false);
      }
    }
  }, [currentEnterprise?.id, enterpriseLoading]);

  const loadData = async () => {
    if (!currentEnterprise) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [equipmentRes, employeesRes, historyRes] = await Promise.all([
      supabase.from('equipment').select('*').eq('enterprise_id', currentEnterprise.id).order('created_at', { ascending: false }),
      supabase.from('employees').select('id, first_name, last_name, position, photo_url').eq('enterprise_id', currentEnterprise.id),
      supabase.from('equipment_history').select('*').eq('enterprise_id', currentEnterprise.id).order('assigned_date', { ascending: false }),
    ]);

    if (equipmentRes.data) setEquipment(equipmentRes.data);
    if (employeesRes.data) setEmployees(employeesRes.data);
    if (historyRes.data) setAllEquipmentHistory(historyRes.data);
    setLoading(false);
  };

  const loadEquipmentHistory = async (equipmentId: string) => {
    const { data, error } = await supabase
      .from('equipment_history')
      .select(`
        *,
        assigned_by_profile:profiles!equipment_history_assigned_by_fkey(id, first_name, last_name)
      `)
      .eq('equipment_id', equipmentId)
      .order('assigned_date', { ascending: false });

    if (error) {
      console.error('Error loading history:', error);
      return;
    }

    setEquipmentHistory(data || []);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentEnterprise) {
      alert('Aucune entreprise sélectionnée');
      return;
    }

    const data = {
      ...formData,
      assigned_employee_id: formData.assigned_employee_id || null,
      status: formData.assigned_employee_id ? 'Assigné' as const : formData.status,
      enterprise_id: currentEnterprise.id,
    };

    if (editingEquipment) {
      const { error } = await supabase
        .from('equipment')
        .update(data)
        .eq('id', editingEquipment.id);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('equipment').insert(data);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingEquipment(null);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) return;

    const { error } = await supabase.from('equipment').delete().eq('id', id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    loadData();
  };

  const openEditModal = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormData({
      brand: eq.brand || '',
      model: eq.model || '',
      category: eq.category,
      serial_number: eq.serial_number || '',
      numero_pro: eq.numero_pro || '',
      purchase_price: eq.purchase_price,
      purchase_currency: eq.purchase_currency,
      purchase_date: eq.purchase_date,
      assigned_employee_id: eq.assigned_employee_id || '',
      status: eq.status,
      notes: eq.notes || '',
    });
    setShowModal(true);
  };

  const openDetailModal = (eq: Equipment) => {
    setViewingEquipment(eq);
    setShowDetailModal(true);
  };

  const openHistoryModal = async (eq: Equipment) => {
    setViewingEquipment(eq);
    await loadEquipmentHistory(eq.id);
    setShowHistoryModal(true);
  };

  const handleHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!viewingEquipment) return;

    const data = {
      equipment_id: viewingEquipment.id,
      employee_id: historyFormData.employee_id || null,
      assigned_date: historyFormData.assigned_date,
      returned_date: historyFormData.returned_date || null,
      notes: historyFormData.notes || null,
    };

    if (editingHistory) {
      const { error } = await supabase
        .from('equipment_history')
        .update(data)
        .eq('id', editingHistory.id);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('equipment_history').insert(data);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    }

    setShowHistoryForm(false);
    setEditingHistory(null);
    resetHistoryForm();
    await loadEquipmentHistory(viewingEquipment.id);
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement d\'historique ?')) return;

    const { error } = await supabase.from('equipment_history').delete().eq('id', id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    if (viewingEquipment) {
      await loadEquipmentHistory(viewingEquipment.id);
    }
  };

  const openEditHistoryModal = (history: EquipmentHistory) => {
    setEditingHistory(history);
    setHistoryFormData({
      employee_id: history.employee_id || '',
      assigned_date: history.assigned_date.split('T')[0],
      returned_date: history.returned_date ? history.returned_date.split('T')[0] : '',
      notes: history.notes || '',
    });
    setShowHistoryForm(true);
  };

  const resetHistoryForm = () => {
    setHistoryFormData({
      employee_id: '',
      assigned_date: '',
      returned_date: '',
      notes: '',
    });
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      category: '',
      serial_number: '',
      numero_pro: '',
      purchase_price: 0,
      purchase_currency: 'DZD',
      purchase_date: '',
      assigned_employee_id: '',
      status: 'En stock',
      notes: '',
    });
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return 'Non assigné';
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Inconnu';
  };

  const getCurrentAssignmentDate = (equipmentId: string, employeeId: string | null) => {
    if (!employeeId) return null;
    const history = allEquipmentHistory
      .filter(h => h.equipment_id === equipmentId && h.employee_id === employeeId && !h.returned_date)
      .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime());
    return history.length > 0 ? history[0].assigned_date : null;
  };

  const generateQRCodeURL = (equipmentId: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const qrData = `${baseUrl}/equipment-view?id=${equipmentId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  };

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = `${eq.name} ${eq.category} ${eq.brand} ${eq.model} ${eq.serial_number}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || eq.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

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
      case 'Vendu':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#EAEAF0' }}>Matériel</h1>
        <p className="text-base" style={{ color: '#9AA0AB' }}>Gestion complète du matériel avec QR codes</p>
      </div>

      <div className="card-surface p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: '#6B7280' }} />
            <input
              type="text"
              placeholder="Rechercher du matériel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: '#0F1115',
                color: '#EAEAF0',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: '#1A1D24',
                color: '#EAEAF0',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <option value="all">Toutes les catégories</option>
              <option value="Téléphone">Téléphone</option>
              <option value="PC">PC</option>
              <option value="Bureau">Bureau</option>
              <option value="Accessoires">Accessoires</option>
              <option value="Autre">Autre</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: '#1A1D24',
                color: '#EAEAF0',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="Assigné">Assigné</option>
              <option value="En stock">En stock</option>
              <option value="Perdu">Perdu</option>
              <option value="Hors service">Hors service</option>
              <option value="Vendu">Vendu</option>
            </select>
            <div className="flex gap-1 rounded-xl p-1.5" style={{ backgroundColor: '#1A1D24', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="p-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'grid' ? '#111827' : '#6B7280'
                }}
                title="Vue en grille"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className="p-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: viewMode === 'card' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'card' ? '#111827' : '#6B7280'
                }}
                title="Vue en cartes"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'list' ? '#111827' : '#6B7280'
                }}
                title="Vue en liste"
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingEquipment(null);
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-medium transition-all whitespace-nowrap shadow-lg"
            >
              <Plus size={18} />
              <span className="hidden md:inline">Nouveau Matériel</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#3B82F6' }}></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((eq) => (
            <div key={eq.id} className="card-elevated rounded-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1 min-h-[420px] flex flex-col">
              <div className="relative">
                <div className="w-full h-56 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <Package className="text-white" size={64} />
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
                    eq.status === 'Assigné' ? 'bg-gray-500/90 text-white border-gray-400/50' :
                    eq.status === 'En stock' ? 'bg-green-500/90 text-white border-green-400/50' :
                    eq.status === 'Perdu' ? 'bg-red-500/90 text-white border-red-400/50' :
                    eq.status === 'Hors service' ? 'bg-gray-400/90 text-white border-gray-300/50' :
                    'bg-green-500/90 text-white border-green-400/50'
                  }`}>
                    {eq.status}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold mb-2" style={{ color: '#EAEAF0' }}>
                  {eq.category}
                </h3>
                {eq.brand && (
                  <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
                    <span className="px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>{eq.brand} {eq.model && `- ${eq.model}`}</span>
                  </p>
                )}

                <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' }}></div>

                <div className="space-y-3 mb-5 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs uppercase tracking-wide" style={{ color: '#6B7280' }}>Assigné à</span>
                    <span className="font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ color: '#EAEAF0', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <User size={14} style={{ color: '#9AA0AB' }} />
                      {getEmployeeName(eq.assigned_employee_id) === 'Non assigné' ? 'N/A' : getEmployeeName(eq.assigned_employee_id).split(' ')[0]}
                    </span>
                  </div>
                  {eq.assigned_employee_id && getCurrentAssignmentDate(eq.id, eq.assigned_employee_id) && (
                    <div className="flex flex-col text-sm">
                      <span className="text-xs uppercase tracking-wide mb-1.5" style={{ color: '#6B7280' }}>Date d'attribution</span>
                      <span className="font-medium text-sm" style={{ color: '#EAEAF0' }}>{new Date(getCurrentAssignmentDate(eq.id, eq.assigned_employee_id)!).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {eq.numero_pro && (
                    <div className="flex flex-col text-sm">
                      <span className="text-xs uppercase tracking-wide mb-1.5" style={{ color: '#6B7280' }}>N° Pro</span>
                      <span className="font-medium text-sm" style={{ color: '#EAEAF0' }}>{eq.numero_pro}</span>
                    </div>
                  )}
                  <div className="pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide" style={{ color: '#6B7280' }}>Prix d'achat</span>
                      <span className="text-sm font-bold" style={{ color: '#EAEAF0' }}>
                        {eq.purchase_price.toLocaleString()} {eq.purchase_currency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => openDetailModal(eq)}
                    className="flex-1 px-3 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-900 rounded-xl transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
                  >
                    <Eye size={16} />
                    Détails
                  </button>
                  <button
                    onClick={() => openEditModal(eq)}
                    className="px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  >
                    <Edit size={16} style={{ color: '#9AA0AB' }} />
                  </button>
                  <button
                    onClick={() => handleDelete(eq.id)}
                    className="px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                  >
                    <Trash2 size={16} style={{ color: '#EF4444' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredEquipment.length === 0 && (
            <div className="col-span-full text-center py-16 card-elevated rounded-2xl">
              <Package size={48} className="mx-auto mb-4" style={{ color: '#6B7280' }} />
              <p className="text-lg font-medium mb-2" style={{ color: '#9AA0AB' }}>Aucun matériel trouvé</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-6">
          {filteredEquipment.map((eq) => (
            <div key={eq.id} className="card-surface p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1A1D24' }}>
                    <Package size={28} style={{ color: '#EAEAF0' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(eq.status)}`}>
                        {eq.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Catégorie</p>
                        <p className="font-medium" style={{ color: '#EAEAF0' }}>{eq.category}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Marque / Modèle</p>
                        <p className="font-medium" style={{ color: '#EAEAF0' }}>
                          {eq.brand && eq.model ? `${eq.brand} ${eq.model}` : eq.brand || eq.model || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Assigné à</p>
                        <p className="font-medium flex items-center gap-1" style={{ color: '#EAEAF0' }}>
                          <User size={14} />
                          {getEmployeeName(eq.assigned_employee_id)}
                        </p>
                        {eq.assigned_employee_id && getCurrentAssignmentDate(eq.id, eq.assigned_employee_id) && (
                          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                            {new Date(getCurrentAssignmentDate(eq.id, eq.assigned_employee_id)!).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Prix d'achat</p>
                        <p className="font-bold" style={{ color: '#EAEAF0' }}>
                          {eq.purchase_price.toLocaleString()} {eq.purchase_currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDetailModal(eq)}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: '#3B82F6' }}
                    title="Voir détails"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => openEditModal(eq)}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: '#9AA0AB' }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(eq.id)}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredEquipment.length === 0 && (
            <div className="text-center py-16 card-surface">
              <Package size={48} className="mx-auto mb-4" style={{ color: '#6B7280' }} />
              <p className="text-lg font-medium" style={{ color: '#9AA0AB' }}>Aucun matériel trouvé</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Matériel</th>
                  <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Catégorie</th>
                  <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Marque / Modèle</th>
                  <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Statut</th>
                  <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Assigné à</th>
                  <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Prix d'achat</th>
                  <th className="text-right py-4 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((eq, index) => (
                  <tr key={eq.id} style={{ borderBottom: index < filteredEquipment.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none' }}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1A1D24' }}>
                          <Package size={20} style={{ color: '#EAEAF0' }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm" style={{ color: '#EAEAF0' }}>{eq.category}</td>
                    <td className="py-4 px-6 text-sm" style={{ color: '#9AA0AB' }}>
                      {eq.brand && eq.model ? `${eq.brand} ${eq.model}` : eq.brand || eq.model || 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(eq.status)}`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm" style={{ color: '#9AA0AB' }}>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        {getEmployeeName(eq.assigned_employee_id)}
                      </div>
                      {eq.assigned_employee_id && getCurrentAssignmentDate(eq.id, eq.assigned_employee_id) && (
                        <div className="text-xs mt-1" style={{ color: '#6B7280' }}>
                          {new Date(getCurrentAssignmentDate(eq.id, eq.assigned_employee_id)!).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-sm" style={{ color: '#EAEAF0' }}>
                        {eq.purchase_price.toLocaleString()} {eq.purchase_currency}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openDetailModal(eq)}
                          className="p-2 rounded-lg transition-colors hover:opacity-80"
                          style={{ color: '#3B82F6' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(eq)}
                          className="p-2 rounded-lg transition-colors hover:opacity-80"
                          style={{ color: '#9AA0AB' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(eq.id)}
                          className="p-2 rounded-lg transition-colors hover:opacity-80"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEquipment.length === 0 && (
              <div className="text-center py-16">
                <Package size={48} className="mx-auto mb-4" style={{ color: '#6B7280' }} />
                <p className="text-lg font-medium" style={{ color: '#9AA0AB' }}>Aucun matériel trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showDetailModal && viewingEquipment && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' }}>
            <div className="sticky top-0 border-b border-gray-700 p-6 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)' }}>
              <h2 className="text-2xl font-bold text-white">Fiche Matériel</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-32 h-32 bg-elevated rounded-xl flex items-center justify-center shadow-xl">
                  <Package className="text-white" size={60} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{viewingEquipment.name}</h3>
                  <p className="text-lg text-gray-300 mb-2">{viewingEquipment.category}</p>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${getStatusColor(viewingEquipment.status)}`}>
                    {viewingEquipment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-white text-lg border-b pb-2">Informations Techniques</h4>
                  {viewingEquipment.brand && (
                    <div>
                      <p className="text-sm text-gray-400">Marque</p>
                      <p className="font-medium text-white">{viewingEquipment.brand}</p>
                    </div>
                  )}
                  {viewingEquipment.model && (
                    <div>
                      <p className="text-sm text-gray-400">Modèle</p>
                      <p className="font-medium text-white">{viewingEquipment.model}</p>
                    </div>
                  )}
                  {viewingEquipment.serial_number && (
                    <div>
                      <p className="text-sm text-gray-400">Numéro de série</p>
                      <p className="font-medium text-white font-mono">{viewingEquipment.serial_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-400">ID Matériel</p>
                    <p className="font-medium text-white font-mono text-xs">{viewingEquipment.id}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-white text-lg border-b pb-2">Informations d'Achat</h4>
                  <div>
                    <p className="text-sm text-gray-400">Prix d'achat</p>
                    <p className="font-bold text-white text-xl">
                      {viewingEquipment.purchase_price.toLocaleString()} {viewingEquipment.purchase_currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Date d'achat</p>
                    <p className="font-medium text-white">
                      {new Date(viewingEquipment.purchase_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-elevated rounded-lg p-6 mb-6 border border-gray-700">
                <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <User size={20} className="text-white" />
                  Assignation
                </h4>
                {viewingEquipment.assigned_employee_id ? (
                  <div>
                    <p className="text-gray-300 mb-2">Ce matériel est actuellement assigné à :</p>
                    <p className="font-bold text-lg text-white">{getEmployeeName(viewingEquipment.assigned_employee_id)}</p>
                  </div>
                ) : (
                  <p className="text-gray-300">Ce matériel n'est pas assigné à un employé</p>
                )}
              </div>

              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 mb-6 border border-gray-700">
                <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <QrCode size={20} className="text-gray-300" />
                  QR Code
                </h4>
                <div className="flex flex-col items-center">
                  <img
                    src={generateQRCodeURL(viewingEquipment.id)}
                    alt="QR Code"
                    className="w-64 h-64 bg-surface p-4 rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-300 mt-4 text-center">
                    Scannez ce code pour accéder rapidement aux informations de ce matériel
                  </p>
                </div>
              </div>

              {viewingEquipment.notes && (
                <div className="mb-6">
                  <h4 className="font-bold text-white text-lg mb-2">Notes</h4>
                  <p className="text-gray-300 bg-elevated p-4 rounded-lg">{viewingEquipment.notes}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openHistoryModal(viewingEquipment);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <History size={18} className="text-white" />
                  Historique
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(viewingEquipment);
                  }}
                  className="flex-1 px-6 py-3 bg-elevated hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={18} className="text-white" />
                  Modifier
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' }}>
            <div className="sticky top-0 border-b border-gray-700 p-6 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)' }}>
              <h2 className="text-2xl font-bold text-white">
                {editingEquipment ? 'Modifier le matériel' : 'Nouveau matériel'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Marque *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Modèle *</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Catégorie *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="Téléphone">Téléphone</option>
                    <option value="PC">PC</option>
                    <option value="Bureau">Bureau</option>
                    <option value="Accessoires">Accessoires</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Numéro de série</label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Numéro pro</label>
                  <input
                    type="text"
                    value={formData.numero_pro}
                    onChange={(e) => setFormData({ ...formData, numero_pro: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Date d'achat *</label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Prix d'achat *</label>
                  <input
                    type="number"
                    required
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Devise *</label>
                  <select
                    required
                    value={formData.purchase_currency}
                    onChange={(e) => setFormData({ ...formData, purchase_currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="DZD">DZD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Employé assigné</label>
                  <select
                    value={formData.assigned_employee_id}
                    onChange={(e) => setFormData({ ...formData, assigned_employee_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="">Non assigné</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Statut *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="En stock">En stock</option>
                    <option value="Assigné">Assigné</option>
                    <option value="Perdu">Perdu</option>
                    <option value="Hors service">Hors service</option>
                    <option value="Vendu">Vendu</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-elevated hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {editingEquipment ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && viewingEquipment && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' }}>
            <div className="sticky top-0 border-b border-gray-700 p-6 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)' }}>
              <div>
                <h2 className="text-2xl font-bold text-white">Historique d'Assignation</h2>
                <p className="text-gray-300 text-sm mt-1">{viewingEquipment.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setShowHistoryForm(false);
                  setEditingHistory(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg text-white"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <button
                  onClick={() => {
                    resetHistoryForm();
                    setEditingHistory(null);
                    setShowHistoryForm(true);
                  }}
                  className="flex items-center gap-2 bg-elevated hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus size={20} className="text-white" />
                  Ajouter un Enregistrement
                </button>
              </div>

              {showHistoryForm && (
                <div className="bg-elevated rounded-lg p-6 mb-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {editingHistory ? 'Modifier l\'Enregistrement' : 'Nouvel Enregistrement'}
                  </h3>
                  <form onSubmit={handleHistorySubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Employé
                        </label>
                        <select
                          value={historyFormData.employee_id}
                          onChange={(e) =>
                            setHistoryFormData({ ...historyFormData, employee_id: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-surface text-white"
                        >
                          <option value="">Non assigné</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.first_name} {employee.last_name} - {employee.position}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date d'assignation *
                        </label>
                        <input
                          type="date"
                          required
                          value={historyFormData.assigned_date}
                          onChange={(e) =>
                            setHistoryFormData({ ...historyFormData, assigned_date: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-surface text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date de retour
                        </label>
                        <input
                          type="date"
                          value={historyFormData.returned_date}
                          onChange={(e) =>
                            setHistoryFormData({ ...historyFormData, returned_date: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-surface text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                        <textarea
                          value={historyFormData.notes}
                          onChange={(e) =>
                            setHistoryFormData({ ...historyFormData, notes: e.target.value })
                          }
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-surface text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowHistoryForm(false);
                          setEditingHistory(null);
                        }}
                        className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-elevated hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        {editingHistory ? 'Mettre à jour' : 'Créer'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {equipmentHistory.length === 0 ? (
                  <div className="text-center py-12 bg-elevated rounded-lg border border-gray-700">
                    <p className="text-gray-400">Aucun historique d'assignation</p>
                  </div>
                ) : (
                  equipmentHistory.map((history) => {
                    const employee = employees.find((e) => e.id === history.employee_id);
                    return (
                      <div
                        key={history.id}
                        className="bg-elevated rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            {employee?.photo_url && (
                              <div className="flex-shrink-0">
                                <img
                                  src={employee.photo_url}
                                  alt={`${employee.first_name} ${employee.last_name}`}
                                  className="w-16 h-16 rounded-lg object-cover shadow-md border border-gray-600"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <User size={20} className="text-white" />
                                <h4 className="font-bold text-white text-lg">
                                  {employee
                                    ? `${employee.first_name} ${employee.last_name}`
                                    : 'Non assigné'}
                                </h4>
                              </div>
                              {employee && (
                                <p className="text-gray-400 text-sm mb-3">{employee.position}</p>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                  <Calendar size={16} className="text-white" />
                                  <div>
                                    <p className="text-gray-400 text-xs">Date d'assignation</p>
                                    <p className="text-white font-medium">
                                      {new Date(history.assigned_date).toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User size={16} className="text-white" />
                                  <div>
                                    <p className="text-gray-400 text-xs">Assigné par</p>
                                    <p className="text-white font-medium">
                                      {history.assigned_by_profile
                                        ? `${history.assigned_by_profile.first_name} ${history.assigned_by_profile.last_name}`
                                        : 'Système'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar size={16} className="text-white" />
                                  <div>
                                    <p className="text-gray-400 text-xs">Date de retour</p>
                                    <p className="text-white font-medium">
                                      {history.returned_date
                                        ? new Date(history.returned_date).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                          })
                                        : 'En cours'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {history.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                  <p className="text-gray-400 text-xs mb-1">Notes</p>
                                  <p className="text-gray-300 text-sm">{history.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditHistoryModal(history)}
                              className="p-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} className="text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteHistory(history.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setShowHistoryForm(false);
                    setEditingHistory(null);
                  }}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
