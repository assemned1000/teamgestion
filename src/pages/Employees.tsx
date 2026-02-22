import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { Plus, Edit, Trash2, Search, X, Eye, DollarSign, Upload, Link2, Check, LayoutGrid, List, Grid3x3, Archive, RotateCcw, Users } from 'lucide-react';

interface Employee {
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
  monthly_salary: number;
  declared_salary: number;
  recharge: number;
  monthly_bonus: number;
  client_id: string | null;
  manager_id: string | null;
  user_id: string | null;
  notes: string | null;
  status: 'Actif' | 'En pause' | 'Sorti';
  exit_date: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  position?: string;
}

interface EmployeeRate {
  id: string;
  employee_id: string;
  client_id: string;
  monthly_rate: number;
  start_date: string;
  end_date: string | null;
}

export const Employees = () => {
  const { can } = useAuth();
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employeeRates, setEmployeeRates] = useState<EmployeeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'grid'>('grid');
  const [showArchived, setShowArchived] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    photo_url: '',
    personal_phone: '',
    professional_phone: '',
    emergency_phone: '',
    address: '',
    position: '',
    hire_date: '',
    contract_type: 'CDI' as 'CDD' | 'CDI' | 'Freelance',
    monthly_salary: 0,
    declared_salary: 0,
    recharge: 0,
    monthly_bonus: 0,
    client_id: '',
    manager_id: '',
    notes: '',
    status: 'Actif' as 'Actif' | 'En pause' | 'Sorti',
    exit_date: '',
  });
  const [customPosition, setCustomPosition] = useState('');

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
    const [employeesRes, clientsRes, managersRes, managerGeneralEmployees, ratesRes] = await Promise.all([
      supabase.from('employees').select('*').eq('enterprise_id', currentEnterprise.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').eq('enterprise_id', currentEnterprise.id),
      supabase.from('employees').select('id, first_name, last_name, position').eq('enterprise_id', currentEnterprise.id).eq('position', 'Manager').eq('status', 'Actif'),
      supabase.from('employees').select('id, first_name, last_name, position').eq('enterprise_id', currentEnterprise.id).eq('position', 'Manager général').eq('status', 'Actif'),
      supabase.from('employee_client_rates').select('*').eq('enterprise_id', currentEnterprise.id),
    ]);

    if (employeesRes.data) setEmployees(employeesRes.data);
    if (clientsRes.data) setClients(clientsRes.data);

    const allManagerOptions = [];
    if (managersRes.data) allManagerOptions.push(...managersRes.data);
    if (managerGeneralEmployees.data) allManagerOptions.push(...managerGeneralEmployees.data);
    setManagers(allManagerOptions);

    if (ratesRes.data) setEmployeeRates(ratesRes.data);
    setLoading(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let photo_url = formData.photo_url;

    if (photoFile) {
      const uploadedUrl = await uploadPhoto(photoFile);
      if (uploadedUrl) {
        photo_url = uploadedUrl;
      }
    }

    const finalPosition = formData.position === 'Autre' ? customPosition : formData.position;

    if (formData.position === 'Autre' && !customPosition) {
      alert('Veuillez entrer un nom de poste personnalisé');
      return;
    }

    if (!currentEnterprise) {
      alert('Aucune entreprise sélectionnée');
      return;
    }

    const data = {
      ...formData,
      position: finalPosition,
      photo_url: photo_url || null,
      client_id: formData.client_id || null,
      manager_id: formData.manager_id || null,
      exit_date: formData.exit_date || null,
      hire_date: formData.hire_date || null,
      enterprise_id: currentEnterprise.id,
    };

    if (editingEmployee) {
      const { error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', editingEmployee.id);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('employees').insert(data);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingEmployee(null);
    resetForm();
    loadData();
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver cet employé ?')) return;

    const { error } = await supabase
      .from('employees')
      .update({
        status: 'Sorti',
        exit_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    loadData();
  };

  const handleRestore = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir restaurer cet employé ?')) return;

    const { error } = await supabase
      .from('employees')
      .update({
        status: 'Actif',
        exit_date: null,
      })
      .eq('id', id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    loadData();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet employé ? Cette action est irréversible.')) return;

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    loadData();
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    const standardPositions = ['Manager général', 'Assistante de direction', 'Architecte', 'Closer', 'Superviseur', 'Manager', 'Assistant', 'Communité manager'];
    const isCustomPosition = !standardPositions.includes(employee.position);

    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      photo_url: employee.photo_url || '',
      personal_phone: employee.personal_phone || '',
      professional_phone: employee.professional_phone || '',
      emergency_phone: employee.emergency_phone || '',
      address: employee.address || '',
      position: isCustomPosition ? 'Autre' : employee.position,
      hire_date: employee.hire_date,
      contract_type: employee.contract_type,
      monthly_salary: employee.monthly_salary,
      declared_salary: employee.declared_salary,
      recharge: employee.recharge,
      monthly_bonus: employee.monthly_bonus,
      client_id: employee.client_id || '',
      manager_id: employee.manager_id || '',
      notes: employee.notes || '',
      status: employee.status,
      exit_date: employee.exit_date || '',
    });
    setCustomPosition(isCustomPosition ? employee.position : '');
    setPhotoPreview(employee.photo_url);
    setPhotoFile(null);
    setShowModal(true);
  };

  const openDetailModal = (employee: Employee) => {
    setViewingEmployee(employee);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      photo_url: '',
      personal_phone: '',
      professional_phone: '',
      emergency_phone: '',
      address: '',
      position: '',
      hire_date: '',
      contract_type: 'CDI',
      monthly_salary: 0,
      declared_salary: 0,
      recharge: 0,
      monthly_bonus: 0,
      client_id: '',
      manager_id: '',
      notes: '',
      status: 'Actif',
      exit_date: '',
    });
    setCustomPosition('');
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const filteredEmployees = employees
    .filter(emp => showArchived ? emp.status === 'Sorti' : emp.status !== 'Sorti')
    .filter(emp =>
      `${emp.first_name} ${emp.last_name} ${emp.position}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return 'Non assigné';
    const manager = managers.find(m => m.id === managerId);
    return manager ? `${manager.first_name} ${manager.last_name}` : 'Inconnu';
  };

  const getSalaireLiquide = (emp: Employee) => {
    return emp.monthly_salary - emp.declared_salary;
  };

  const getTotalLiquide = (emp: Employee) => {
    const salaireLiquide = getSalaireLiquide(emp);
    return salaireLiquide + emp.recharge + emp.monthly_bonus;
  };

  const getTotalSalary = (emp: Employee) => {
    return emp.monthly_salary + emp.recharge + emp.monthly_bonus;
  };

  const getEmployeeClients = (employeeId: string) => {
    const activeRates = employeeRates.filter(r => r.employee_id === employeeId && !r.end_date);
    return activeRates.map(rate => {
      const client = clients.find(c => c.id === rate.client_id);
      return {
        ...rate,
        client_name: client?.name || 'Inconnu',
      };
    });
  };

  const fallbackCopyToClipboard = (text: string): boolean => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      textArea.remove();
      return false;
    }
  };

  const handleCopyLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentEnterprise) {
      alert('Aucune entreprise sélectionnée');
      return;
    }

    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      console.log('Inserting token into database...');
      const { error } = await supabase
        .from('one_time_tokens')
        .insert({
          token,
          expires_at: expiresAt.toISOString(),
          enterprise_id: currentEnterprise.id,
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        alert(`Erreur lors de la création du lien.\n\nDétails: ${error.message}\n\nVeuillez réessayer ou contacter le support si le problème persiste.`);
        return;
      }

      console.log('Token created successfully, generating URL...');
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const publicFormUrl = `${baseUrl}/public-employee-form?token=${token}`;
      console.log('Base URL:', baseUrl);
      console.log('URL to copy:', publicFormUrl);

      let copySuccess = false;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(publicFormUrl);
          copySuccess = true;
          console.log('Copied using Clipboard API');
        } catch (clipboardErr: any) {
          console.error('Clipboard API failed:', clipboardErr);
          console.log('Trying fallback method...');
          copySuccess = fallbackCopyToClipboard(publicFormUrl);
          if (copySuccess) {
            console.log('Copied using fallback method');
          }
        }
      } else {
        console.log('Clipboard API not available, using fallback...');
        copySuccess = fallbackCopyToClipboard(publicFormUrl);
        if (copySuccess) {
          console.log('Copied using fallback method');
        }
      }

      if (copySuccess) {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      } else {
        console.error('All copy methods failed');
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      }
    } catch (err: any) {
      console.error('Failed to copy link:', err);
      alert(`Une erreur s'est produite lors de la génération du lien.\n\nVeuillez réessayer. Si le problème persiste, contactez le support technique.\n\nDétails: ${err.message || 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Employés</h1>
        <p className="text-gray-400 text-lg">Gestion complète des employés – Salaires en DZD</p>
      </div>

      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white focus:border-white outline-none text-white placeholder-gray-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-gray-900/50 border border-gray-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="Vue en grille"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'card'
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="Vue en cartes"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title="Vue en liste"
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                showArchived
                  ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg'
                  : 'bg-gray-900/50 border border-gray-700 hover:bg-gray-800 text-white'
              }`}
            >
              {showArchived ? 'Employés actifs' : 'Archives'}
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={linkCopied}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all touch-manipulation ${
                linkCopied
                  ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg cursor-default'
                  : 'bg-gray-900/50 border border-gray-700 hover:bg-gray-800 text-white'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {linkCopied ? (
                <>
                  <Check size={18} />
                  <span className="hidden md:inline">Lien copié!</span>
                </>
              ) : (
                <>
                  <Link2 size={18} />
                  <span className="hidden md:inline">Copier lien formulaire</span>
                </>
              )}
            </button>
            {can('employees', 'create') && (
              <button
                onClick={() => {
                  resetForm();
                  setEditingEmployee(null);
                  setShowModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={18} />
                <span className="hidden md:inline">Nouvel Employé</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-700/50 hover:border-gray-600/50 cursor-pointer hover:-translate-y-1 min-h-[420px] flex flex-col">
              <div className="relative">
                {employee.photo_url ? (
                  <img
                    src={employee.photo_url}
                    alt={`${employee.first_name} ${employee.last_name}`}
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {employee.first_name[0]}{employee.last_name[0]}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
                    employee.status === 'Actif' ? 'bg-green-500/90 text-white border-green-400/50' :
                    employee.status === 'En pause' ? 'bg-yellow-500/90 text-white border-yellow-400/50' :
                    'bg-red-500/90 text-white border-red-400/50'
                  }`}>
                    {employee.status}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-1">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{employee.position}</p>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4"></div>

                <div className="space-y-3 mb-5 flex-1">
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Clients</span>
                    {getEmployeeClients(employee.id).length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {getEmployeeClients(employee.id).map((clientRate, idx) => (
                          <span key={idx} className="font-medium text-white text-sm">
                            • {clientRate.client_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-medium text-gray-400 text-sm">Non assigné</span>
                    )}
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Manager</span>
                    <span className="font-medium text-white text-sm">{getManagerName(employee.manager_id)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => openDetailModal(employee)}
                    className="flex-1 px-3 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-900 rounded-xl transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
                  >
                    <Eye size={16} />
                    Détails
                  </button>
                  {can('employees', 'update') && (
                    <button
                      onClick={() => openEditModal(employee)}
                      className="px-3 py-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600/50"
                    >
                      <Edit size={16} className="text-white" />
                    </button>
                  )}
                  {can('employees', 'delete') && (
                    <>
                      {showArchived ? (
                        <>
                          <button
                            onClick={() => handleRestore(employee.id)}
                            className="px-3 py-2.5 bg-green-600/20 hover:bg-green-600/30 rounded-xl transition-all border border-green-500/50"
                            title="Restaurer"
                          >
                            <RotateCcw size={16} className="text-green-400" />
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(employee.id)}
                            className="px-3 py-2.5 bg-red-600/20 hover:bg-red-600/30 rounded-xl transition-all border border-red-500/50"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleArchive(employee.id)}
                          className="px-3 py-2.5 bg-orange-600/20 hover:bg-orange-600/30 rounded-xl transition-all border border-orange-500/50"
                          title="Archiver"
                        >
                          <Archive size={16} className="text-orange-400" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full text-center py-16 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
              <Users size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg font-medium">Aucun employé trouvé</p>
              <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-[#2d2d2d] rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {employee.photo_url ? (
                    <img
                      src={employee.photo_url}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      className="w-16 h-16 rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
                      {employee.first_name[0]}{employee.last_name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'Actif' ? 'bg-green-100 text-green-700' :
                        employee.status === 'En pause' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {employee.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-300">Poste</p>
                        <p className="font-medium text-white">{employee.position}</p>
                      </div>
                      <div>
                        <p className="text-gray-300">Clients</p>
                        {getEmployeeClients(employee.id).length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {getEmployeeClients(employee.id).map((clientRate, idx) => (
                              <p key={idx} className="font-medium text-white text-xs">• {clientRate.client_name}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="font-medium text-white">Aucun</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-300">Manager</p>
                        <p className="font-medium text-white">{getManagerName(employee.manager_id)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDetailModal(employee)}
                    className="p-2 text-white hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Voir détails"
                  >
                    <Eye size={18} className="text-white" />
                  </button>
                  {can('employees', 'update') && (
                    <button
                      onClick={() => openEditModal(employee)}
                      className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit size={18} className="text-white" />
                    </button>
                  )}
                  {can('employees', 'delete') && (
                    <>
                      {showArchived ? (
                        <>
                          <button
                            onClick={() => handleRestore(employee.id)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Restaurer"
                          >
                            <RotateCcw size={18} className="text-white" />
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(employee.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={18} className="text-white" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleArchive(employee.id)}
                          className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Archiver"
                        >
                          <Archive size={18} className="text-white" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 bg-[#2d2d2d] rounded-xl shadow-sm">
              <p className="text-gray-300">Aucun employé trouvé</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#2d2d2d] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Employé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Poste</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Clients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Salaire Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {employee.photo_url ? (
                          <img
                            src={employee.photo_url}
                            alt={`${employee.first_name} ${employee.last_name}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {employee.first_name[0]}{employee.last_name[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-white">{employee.first_name} {employee.last_name}</p>
                          <p className="text-xs text-gray-300">{employee.contract_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-white">{employee.position}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'Actif' ? 'bg-green-100 text-green-700' :
                        employee.status === 'En pause' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getEmployeeClients(employee.id).length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {getEmployeeClients(employee.id).map((clientRate, idx) => (
                            <p key={idx} className="text-sm text-white">• {clientRate.client_name}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-white">Aucun</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-white">{getManagerName(employee.manager_id)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-white">{getTotalSalary(employee).toLocaleString()} DZD</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openDetailModal(employee)}
                          className="p-1.5 text-white hover:text-white hover:bg-gray-700 rounded transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={16} className="text-white" />
                        </button>
                        {can('employees', 'update') && (
                          <button
                            onClick={() => openEditModal(employee)}
                            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          >
                            <Edit size={16} className="text-white" />
                          </button>
                        )}
                        {can('employees', 'delete') && (
                          <>
                            {showArchived ? (
                              <>
                                <button
                                  onClick={() => handleRestore(employee.id)}
                                  className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                  title="Restaurer"
                                >
                                  <RotateCcw size={16} className="text-white" />
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(employee.id)}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 size={16} className="text-white" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleArchive(employee.id)}
                                className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors"
                                title="Archiver"
                              >
                                <Archive size={16} className="text-white" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-300">Aucun employé trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showDetailModal && viewingEmployee && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' }}>
            <div className="sticky top-0 border-b border-gray-700 p-6 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)' }}>
              <h2 className="text-2xl font-bold text-white">Fiche Employé</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-6 mb-8">
                {viewingEmployee.photo_url ? (
                  <img
                    src={viewingEmployee.photo_url}
                    alt={`${viewingEmployee.first_name} ${viewingEmployee.last_name}`}
                    className="w-32 h-32 rounded-full object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 bg-[#1a1a1a] rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                    {viewingEmployee.first_name[0]}{viewingEmployee.last_name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {viewingEmployee.first_name} {viewingEmployee.last_name}
                  </h3>
                  <p className="text-lg text-gray-300 mb-2">{viewingEmployee.position}</p>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${
                    viewingEmployee.status === 'Actif' ? 'bg-green-100 text-green-700' :
                    viewingEmployee.status === 'En pause' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {viewingEmployee.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-white text-lg border-b pb-2">Informations Personnelles</h4>
                  {viewingEmployee.personal_phone && (
                    <div>
                      <p className="text-sm text-gray-300">Téléphone personnel</p>
                      <p className="font-medium text-white">{viewingEmployee.personal_phone}</p>
                    </div>
                  )}
                  {viewingEmployee.professional_phone && (
                    <div>
                      <p className="text-sm text-gray-300">Téléphone professionnel</p>
                      <p className="font-medium text-white">{viewingEmployee.professional_phone}</p>
                    </div>
                  )}
                  {viewingEmployee.emergency_phone && (
                    <div>
                      <p className="text-sm text-gray-300">Téléphone d'urgence</p>
                      <p className="font-medium text-white">{viewingEmployee.emergency_phone}</p>
                    </div>
                  )}
                  {viewingEmployee.address && (
                    <div>
                      <p className="text-sm text-gray-300">Adresse</p>
                      <p className="font-medium text-white">{viewingEmployee.address}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-white text-lg border-b pb-2">Informations Professionnelles</h4>
                  <div>
                    <p className="text-sm text-gray-300">Type de contrat</p>
                    <p className="font-medium text-white">{viewingEmployee.contract_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Date d'embauche</p>
                    <p className="font-medium text-white">{new Date(viewingEmployee.hire_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Manager / Superviseur</p>
                    <p className="font-medium text-white">{getManagerName(viewingEmployee.manager_id)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6 border border-gray-700">
                <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-white" />
                  Rémunération (DZD)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Salaire mensuel</p>
                    <p className="text-xl font-bold text-white">{viewingEmployee.monthly_salary.toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Salaire déclaré</p>
                    <p className="text-xl font-bold text-white">{viewingEmployee.declared_salary.toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Salaire liquide</p>
                    <p className="text-xl font-bold text-white">{getSalaireLiquide(viewingEmployee).toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Rechargement</p>
                    <p className="text-xl font-bold text-white">{viewingEmployee.recharge.toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Bonus mensuel</p>
                    <p className="text-xl font-bold text-white">{viewingEmployee.monthly_bonus.toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Total liquide</p>
                    <p className="text-xl font-bold text-white">{getTotalLiquide(viewingEmployee).toLocaleString()} DZD</p>
                  </div>
                  <div className="md:col-span-3">
                    <div className="bg-[#2d2d2d] rounded-lg p-4 border-2 border-gray-600">
                      <p className="text-sm text-gray-300 mb-1">Total</p>
                      <p className="text-3xl font-bold text-white">{getTotalSalary(viewingEmployee).toLocaleString()} DZD</p>
                    </div>
                  </div>
                </div>
              </div>

              {viewingEmployee.notes && (
                <div className="mb-6">
                  <h4 className="font-bold text-white text-lg mb-2">Notes</h4>
                  <p className="text-gray-300 bg-[#1a1a1a] p-4 rounded-lg">{viewingEmployee.notes}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(viewingEmployee);
                  }}
                  className="flex-1 px-6 py-3 bg-[#1a1a1a] hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={18} className="text-white" />
                  Modifier
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
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
                {editingEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6 flex justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={40} className="text-white" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Téléphone personnel</label>
                  <input
                    type="tel"
                    value={formData.personal_phone}
                    onChange={(e) => setFormData({ ...formData, personal_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Téléphone professionnel</label>
                  <input
                    type="tel"
                    value={formData.professional_phone}
                    onChange={(e) => setFormData({ ...formData, professional_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Téléphone d'urgence</label>
                  <input
                    type="tel"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Poste *</label>
                  <select
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner un poste</option>
                    <option value="Manager général">Manager général</option>
                    <option value="Manager">Manager</option>
                    <option value="Architecte">Architecte</option>
                    <option value="Assistant">Assistant</option>
                    <option value="Assistante de direction">Assistante de direction</option>
                    <option value="Superviseur">Superviseur</option>
                    <option value="Closer">Closer</option>
                    <option value="Communité manager">Communité manager</option>
                    <option value="Autre">Autre (Personnalisé)</option>
                  </select>
                </div>

                {formData.position === 'Autre' && can('dashboard', 'read') && can('employees', 'read') && can('clients', 'read') && can('equipment', 'read') && can('salaries', 'read') && can('expenses_professional', 'read') && can('expenses_personal', 'read') && can('organization', 'read') && can('users', 'read') && can('dashboard', 'create') && can('employees', 'create') && can('clients', 'create') && can('equipment', 'create') && can('salaries', 'create') && can('expenses_professional', 'create') && can('expenses_personal', 'create') && can('organization', 'create') && can('users', 'create') && can('dashboard', 'update') && can('employees', 'update') && can('clients', 'update') && can('equipment', 'update') && can('salaries', 'update') && can('expenses_professional', 'update') && can('expenses_personal', 'update') && can('organization', 'update') && can('users', 'update') && can('dashboard', 'delete') && can('employees', 'delete') && can('clients', 'delete') && can('equipment', 'delete') && can('salaries', 'delete') && can('expenses_professional', 'delete') && can('expenses_personal', 'delete') && can('organization', 'delete') && can('users', 'delete') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Poste personnalisé *</label>
                    <input
                      type="text"
                      required
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      placeholder="Entrez le nom du poste"
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Date d'embauche *</label>
                  <input
                    type="date"
                    required
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Type de contrat *</label>
                  <select
                    required
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as 'CDD' | 'CDI' | 'Freelance' })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Salaire mensuel (DZD) *</label>
                  <input
                    type="number"
                    required
                    value={formData.monthly_salary}
                    onChange={(e) => setFormData({ ...formData, monthly_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Salaire déclaré (DZD) *</label>
                  <input
                    type="number"
                    required
                    value={formData.declared_salary}
                    onChange={(e) => setFormData({ ...formData, declared_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Rechargement (DZD)</label>
                  <input
                    type="number"
                    value={formData.recharge}
                    onChange={(e) => setFormData({ ...formData, recharge: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Bonus mensuel (DZD)</label>
                  <input
                    type="number"
                    value={formData.monthly_bonus}
                    onChange={(e) => setFormData({ ...formData, monthly_bonus: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Non assigné</option>
                    {managers
                      .filter(manager => {
                        if (formData.position === 'Manager' || formData.position === 'Manager général') {
                          return manager.position === 'Manager général';
                        }
                        return true;
                      })
                      .map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.first_name} {manager.last_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Statut *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Actif' | 'En pause' | 'Sorti' })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="Actif">Actif</option>
                    <option value="En pause">En pause</option>
                    <option value="Sorti">Sorti</option>
                  </select>
                </div>

                {editingEmployee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Date de sortie</label>
                    <input
                      type="date"
                      value={formData.exit_date}
                      onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="px-6 py-2 bg-[#1a1a1a] hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {editingEmployee ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
