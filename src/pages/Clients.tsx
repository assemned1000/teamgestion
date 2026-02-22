import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, FileEdit as Edit, Trash2, Search, X, Eye, Users, Euro, Download, Grid3x3, LayoutGrid, List, Upload, TrendingUp, DollarSign, Briefcase, RefreshCw } from 'lucide-react';
import { exportClientAsPDF, exportClientAsImage, ExportClientData } from '../utils/exportClient';
import { useEnterprise } from '../contexts/EnterpriseContext';

interface Client {
  id: string;
  name: string;
  contact_person: string | null;
  domain: string | null;
  contact_name: string | null;
  contact_type: 'numero' | 'email' | null;
  contact_value: string | null;
  manager_id: string | null;
  agency_fees: number;
  additional_monthly_fees: number;
  payment_date: number | null;
  payment_method: string | null;
  currency: string | null;
  notes: string | null;
  photo_url: string | null;
  is_paid: boolean | null;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  declared_salary: number;
  monthly_salary: number;
  recharge: number;
  monthly_bonus: number;
}

interface EmployeeRate {
  id: string;
  employee_id: string;
  client_id: string;
  monthly_rate: number;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

interface Manager {
  id: string;
  first_name: string;
  last_name: string;
}

interface ClientCost {
  id: string;
  client_id: string;
  name: string;
  price: number;
  payment_date: string | null;
  created_at: string;
}

export const Clients = () => {
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employeeRates, setEmployeeRates] = useState<EmployeeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignEmployeeModal, setShowAssignEmployeeModal] = useState(false);
  const [showAddCostModal, setShowAddCostModal] = useState(false);
  const [showEditEmployeeRateModal, setShowEditEmployeeRateModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editingEmployeeRate, setEditingEmployeeRate] = useState<EmployeeRate | null>(null);
  const [exchangeRate, setExchangeRate] = useState(140);
  const [exchangeRates, setExchangeRates] = useState({
    eur_dzd: 140,
    usd_dzd: 133,
    aed_dzd: 36,
  });
  const [currencies, setCurrencies] = useState(() => {
    const saved = localStorage.getItem(`clients_currencies_${currentEnterprise?.id || 'default'}`);
    return saved ? JSON.parse(saved) : {
      totalRevenue: 'eur' as 'eur' | 'usd' | 'aed' | 'dzd',
      paidRevenue: 'eur' as 'eur' | 'usd' | 'aed' | 'dzd',
    };
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [monthlyRate, setMonthlyRate] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [clientCosts, setClientCosts] = useState<ClientCost[]>([]);
  const [newCostName, setNewCostName] = useState('');
  const [newCostPrice, setNewCostPrice] = useState(0);
  const [newCostPaymentDate, setNewCostPaymentDate] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'grid'>('grid');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    domain: '',
    contact_name: '',
    contact_type: 'numero' as 'numero' | 'email',
    contact_value: '',
    manager_id: '',
    payment_date: '',
    payment_method: '',
    currency: '',
    notes: '',
    photo_url: '',
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

  useEffect(() => {
    if (currentEnterprise) {
      localStorage.setItem(`clients_currencies_${currentEnterprise.id}`, JSON.stringify(currencies));
    }
  }, [currencies, currentEnterprise?.id]);

  const loadData = async () => {
    if (!currentEnterprise) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [clientsRes, employeesRes, managersRes, managerGeneralsRes, ratesRes, settingsRes, costsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('enterprise_id', currentEnterprise.id).order('created_at', { ascending: false }),
      supabase.from('employees').select('id, first_name, last_name, position, declared_salary, monthly_salary, recharge, monthly_bonus').eq('enterprise_id', currentEnterprise.id),
      supabase.from('employees').select('id, first_name, last_name').eq('enterprise_id', currentEnterprise.id).eq('position', 'Manager').eq('status', 'Actif'),
      supabase.from('employees').select('id, first_name, last_name').eq('enterprise_id', currentEnterprise.id).eq('position', 'Manager général').eq('status', 'Actif'),
      supabase.from('employee_client_rates').select('*').eq('enterprise_id', currentEnterprise.id),
      supabase.from('settings').select('key, value').in('key', ['exchange_rate_eur_dzd', 'exchange_rate_usd_dzd', 'exchange_rate_aed_dzd']),
      supabase.from('client_costs').select('*').eq('enterprise_id', currentEnterprise.id).order('created_at', { ascending: true }),
    ]);

    if (clientsRes.data) setClients(clientsRes.data);
    if (employeesRes.data) setEmployees(employeesRes.data);

    const allManagers = [];
    if (managersRes.data) allManagers.push(...managersRes.data);
    if (managerGeneralsRes.data) allManagers.push(...managerGeneralsRes.data);
    setManagers(allManagers);

    if (ratesRes.data) setEmployeeRates(ratesRes.data);

    if (settingsRes.data) {
      const eurRate = settingsRes.data.find(s => s.key === 'exchange_rate_eur_dzd');
      const usdRate = settingsRes.data.find(s => s.key === 'exchange_rate_usd_dzd');
      const aedRate = settingsRes.data.find(s => s.key === 'exchange_rate_aed_dzd');

      const rates = {
        eur_dzd: eurRate ? parseFloat(eurRate.value) : 140,
        usd_dzd: usdRate ? parseFloat(usdRate.value) : 133,
        aed_dzd: aedRate ? parseFloat(aedRate.value) : 36,
      };

      setExchangeRates(rates);
      setExchangeRate(rates.eur_dzd);
    }

    if (costsRes.data) setClientCosts(costsRes.data);
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
        .from('client-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('client-photos')
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

    if (!currentEnterprise) {
      alert('Aucune entreprise sélectionnée');
      return;
    }

    const data = {
      ...formData,
      photo_url: photo_url || null,
      domain: formData.domain || null,
      contact_name: formData.contact_name || null,
      contact_type: formData.contact_type || null,
      contact_value: formData.contact_value || null,
      manager_id: formData.manager_id || null,
      payment_date: formData.payment_date ? parseInt(formData.payment_date) : null,
      payment_method: formData.payment_method || null,
      currency: currentEnterprise.slug === 'ompleo' ? 'dzd' : (formData.currency || null),
      enterprise_id: currentEnterprise.id,
    };

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', editingClient.id);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('clients').insert(data);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingClient(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    loadData();
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      contact_person: client.contact_person || '',
      domain: client.domain || '',
      contact_name: client.contact_name || '',
      contact_type: client.contact_type || 'numero',
      contact_value: client.contact_value || '',
      manager_id: client.manager_id || '',
      payment_date: client.payment_date ? client.payment_date.toString() : '',
      payment_method: client.payment_method || '',
      currency: client.currency || '',
      notes: client.notes || '',
      photo_url: client.photo_url || '',
    });
    setPhotoPreview(client.photo_url);
    setPhotoFile(null);
    setShowModal(true);
  };

  const openDetailModal = (client: Client) => {
    setViewingClient(client);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      domain: '',
      contact_name: '',
      contact_type: 'numero',
      contact_value: '',
      manager_id: '',
      payment_date: '',
      payment_method: '',
      currency: '',
      notes: '',
      photo_url: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return 'Non assigné';
    const manager = managers.find(m => m.id === managerId);
    return manager ? `${manager.first_name} ${manager.last_name}` : 'Inconnu';
  };

  const getClientEmployees = (clientId: string) => {
    return employees.filter(emp => {
      const rates = employeeRates.filter(r => r.client_id === clientId && r.employee_id === emp.id);
      return rates.length > 0;
    }).sort((a, b) => {
      const rateA = employeeRates.find(r => r.client_id === clientId && r.employee_id === a.id);
      const rateB = employeeRates.find(r => r.client_id === clientId && r.employee_id === b.id);

      const isActiveA = !rateA?.end_date;
      const isActiveB = !rateB?.end_date;

      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;

      return 0;
    });
  };

  const calculateProrata = (startDate: string, paymentDate: number, endDate?: string | null) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let periodEndDate = new Date(currentYear, currentMonth, paymentDate, 23, 59, 59, 999);

    if (periodEndDate <= today) {
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);
    }

    const periodStartDate = new Date(periodEndDate);
    periodStartDate.setMonth(periodStartDate.getMonth() - 1);
    periodStartDate.setHours(0, 0, 0, 0);

    if (start > periodEndDate) {
      return 0;
    }

    const actualStart = start > periodStartDate ? start : periodStartDate;
    actualStart.setHours(0, 0, 0, 0);

    let actualEnd = periodEndDate;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (end < periodStartDate) {
        return 0;
      }

      if (end < periodEndDate) {
        actualEnd = end;
      }
    }

    if (actualEnd <= actualStart) {
      return 0;
    }

    const endDateObj = endDate ? new Date(endDate) : null;
    if (start <= periodStartDate && (!endDateObj || endDateObj >= periodEndDate)) {
      return 1;
    }

    const workedMs = actualEnd.getTime() - actualStart.getTime();
    const totalPeriodMs = periodEndDate.getTime() - periodStartDate.getTime();

    if (totalPeriodMs <= 0) {
      return 0;
    }

    const ratio = workedMs / totalPeriodMs;

    return Math.max(0, Math.min(1, ratio));
  };

  const getEmployeeRate = (employeeId: string, clientId: string) => {
    const rate = employeeRates.find(r => r.employee_id === employeeId && r.client_id === clientId);
    if (!rate) return 0;

    const client = clients.find(c => c.id === clientId);
    if (!client || !client.payment_date) return rate.monthly_rate;

    const prorata = calculateProrata(rate.start_date, client.payment_date, rate.end_date);
    return rate.monthly_rate * prorata;
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;

    const fromCurrencyNormalized = fromCurrency?.toLowerCase() === 'euro' ? 'eur' : fromCurrency?.toLowerCase() || 'eur';
    const toCurrencyNormalized = toCurrency.toLowerCase();

    const toDZD = (amt: number, currency: string): number => {
      if (currency === 'dzd') return amt;
      if (currency === 'eur' || currency === 'euro') return amt * exchangeRates.eur_dzd;
      if (currency === 'usd') return amt * exchangeRates.usd_dzd;
      if (currency === 'aed') return amt * exchangeRates.aed_dzd;
      return amt * exchangeRates.eur_dzd;
    };

    const fromDZD = (amt: number, currency: string): number => {
      if (currency === 'dzd') return amt;
      if (currency === 'eur' || currency === 'euro') return amt / exchangeRates.eur_dzd;
      if (currency === 'usd') return amt / exchangeRates.usd_dzd;
      if (currency === 'aed') return amt / exchangeRates.aed_dzd;
      return amt / exchangeRates.eur_dzd;
    };

    const amountInDZD = toDZD(amount, fromCurrencyNormalized);
    return fromDZD(amountInDZD, toCurrencyNormalized);
  };

  const getCurrencyDisplay = (client: Client) => {
    const defaultCurrency = currentEnterprise?.slug === 'ompleo' ? 'dzd' : 'euro';
    const currency = (client.currency || defaultCurrency).toLowerCase();

    switch (currency) {
      case 'dzd':
        return 'DZD';
      case 'euro':
        return 'EUR';
      case 'usd':
        return 'USD';
      case 'aed':
        return 'AED';
      default:
        return 'EUR';
    }
  };

  const getClientMonthlyRevenue = (client: Client) => {
    const clientEmployees = getClientEmployees(client.id);
    const employeesRevenue = clientEmployees.reduce((sum, emp) => {
      return sum + getEmployeeRate(emp.id, client.id);
    }, 0);
    const additionalCosts = getTotalClientCosts(client.id);
    return employeesRevenue + additionalCosts;
  };

  const getClientMonthlyRevenueInClientCurrency = (client: Client) => {
    const defaultCurrency = currentEnterprise?.slug === 'ompleo' ? 'dzd' : 'euro';
    const clientCurrency = (client.currency || defaultCurrency).toLowerCase();

    const clientEmployees = getClientEmployees(client.id);
    const employeesRevenueEUR = clientEmployees.reduce((sum, emp) => {
      return sum + getEmployeeRate(emp.id, client.id);
    }, 0);

    const costsEUR = getTotalClientCosts(client.id);
    const totalRevenueEUR = employeesRevenueEUR + costsEUR;
    const totalRevenueInClientCurrency = convertCurrency(totalRevenueEUR, 'eur', clientCurrency);

    return totalRevenueInClientCurrency;
  };

  const getTotalMonthlyRevenueInEUR = () => {
    return clients.reduce((sum, client) => {
      const clientRevenue = getClientMonthlyRevenueInClientCurrency(client);
      const defaultCurrency = currentEnterprise?.slug === 'ompleo' ? 'dzd' : 'euro';
      const clientCurrency = (client.currency || defaultCurrency).toLowerCase();
      const convertedRevenue = convertCurrency(clientRevenue, clientCurrency, 'eur');
      return sum + convertedRevenue;
    }, 0);
  };

  const getTotalPaidMonthlyRevenueInEUR = () => {
    return clients.reduce((sum, client) => {
      if (client.is_paid) {
        const clientRevenue = getClientMonthlyRevenueInClientCurrency(client);
        const defaultCurrency = currentEnterprise?.slug === 'ompleo' ? 'dzd' : 'euro';
        const clientCurrency = (client.currency || defaultCurrency).toLowerCase();
        const convertedRevenue = convertCurrency(clientRevenue, clientCurrency, 'eur');
        return sum + convertedRevenue;
      }
      return sum;
    }, 0);
  };


  const toggleClientPaymentStatus = async (clientId: string, currentStatus: boolean | null) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('clients')
      .update({ is_paid: newStatus })
      .eq('id', clientId);

    if (error) {
      alert('Erreur lors de la mise à jour du statut de paiement');
      return;
    }

    setClients(clients.map(client =>
      client.id === clientId ? { ...client, is_paid: newStatus } : client
    ));
  };

  const resetAllClientsToUnpaid = async () => {
    if (!currentEnterprise) return;

    const { error } = await supabase
      .from('clients')
      .update({ is_paid: false })
      .eq('enterprise_id', currentEnterprise.id);

    if (error) {
      alert('Erreur lors de la réinitialisation des clients');
      return;
    }

    setClients(clients.map(client => ({ ...client, is_paid: false })));
    setShowResetConfirmModal(false);
  };

  const getCurrencyLabel = (currency: string): string => {
    const curr = currency.toLowerCase();
    if (curr === 'eur' || curr === 'euro') return 'EUR';
    if (curr === 'usd') return 'USD';
    if (curr === 'aed') return 'AED';
    if (curr === 'dzd') return 'DZD';
    return 'EUR';
  };

  const getClientEmployeesCount = (clientId: string) => {
    return getClientEmployees(clientId).length;
  };

  const getTotalEmployeeSalaryCost = (employee: Employee) => {
    return employee.monthly_salary + employee.recharge + employee.monthly_bonus;
  };

  const prepareClientExportData = (client: Client): ExportClientData => {
    const clientEmployees = getClientEmployees(client.id);
    const clientAdditionalCosts = clientCosts.filter(cost => cost.client_id === client.id);

    return {
      clientName: client.name,
      managerName: getManagerName(client.manager_id),
      contactPerson: client.contact_person || undefined,
      enterpriseName: currentEnterprise?.name || '',
      employees: clientEmployees.map(emp => {
        const rateData = employeeRates.find(r => r.employee_id === emp.id && r.client_id === client.id);
        const prorata = client.payment_date && rateData ? calculateProrata(rateData.start_date, client.payment_date, rateData.end_date) : 1;
        const isProrated = prorata < 0.999;

        return {
          name: emp.first_name + ' ' + emp.last_name,
          position: emp.position,
          rate: getEmployeeRate(emp.id, client.id),
          isProrated: isProrated,
        };
      }),
      additionalCosts: clientAdditionalCosts.map(cost => ({
        description: cost.name,
        amount: cost.price,
      })),
      totalRevenue: getClientMonthlyRevenue(client),
    };
  };

  const handleExportPDF = async (client: Client) => {
    const data = prepareClientExportData(client);
    await exportClientAsPDF(data);
  };

  const handleExportImage = async (client: Client) => {
    const data = prepareClientExportData(client);
    await exportClientAsImage(data);
  };

  const handleAssignEmployee = async () => {
    if (!viewingClient || !selectedEmployeeId || monthlyRate <= 0) {
      alert('Veuillez sélectionner un employé et saisir un tarif valide');
      return;
    }

    if (!currentEnterprise) {
      alert('Aucune entreprise sélectionnée');
      return;
    }

    const { error } = await supabase.from('employee_client_rates').insert({
      employee_id: selectedEmployeeId,
      client_id: viewingClient.id,
      monthly_rate: monthlyRate,
      start_date: startDate,
      enterprise_id: currentEnterprise.id,
    });

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    setShowAssignEmployeeModal(false);
    setSelectedEmployeeId('');
    setMonthlyRate(0);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEmployeeSearchTerm('');
    loadData();
  };

  const handleUpdateEmployeeRate = async () => {
    if (!editingEmployeeRate || monthlyRate <= 0) {
      alert('Veuillez saisir un tarif valide');
      return;
    }

    const { error } = await supabase
      .from('employee_client_rates')
      .update({
        monthly_rate: monthlyRate,
        start_date: startDate,
        end_date: endDate || null,
      })
      .eq('id', editingEmployeeRate.id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    setShowEditEmployeeRateModal(false);
    setEditingEmployeeRate(null);
    setMonthlyRate(0);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    loadData();
  };

  const handleUnassignEmployee = async (employeeId: string, clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet employé de ce client ?')) return;

    // Delete all employee_client_rates for this employee-client combination
    const { error: ratesError } = await supabase
      .from('employee_client_rates')
      .delete()
      .eq('employee_id', employeeId)
      .eq('client_id', clientId);

    if (ratesError) {
      alert('Erreur: ' + ratesError.message);
      return;
    }

    loadData();
  };

  const getAvailableEmployees = () => {
    if (!viewingClient) return [];
    const assignedEmployeeIds = getClientEmployees(viewingClient.id).map(e => e.id);
    return employees
      .filter(e => !assignedEmployeeIds.includes(e.id))
      .filter(e => {
        const searchLower = employeeSearchTerm.toLowerCase();
        const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
        const position = e.position.toLowerCase();
        return fullName.includes(searchLower) || position.includes(searchLower);
      });
  };

  const getClientCosts = (clientId: string) => {
    return clientCosts.filter(cost => cost.client_id === clientId);
  };

  const getTotalClientCosts = (clientId: string) => {
    return getClientCosts(clientId).reduce((sum, cost) => sum + cost.price, 0);
  };

  const handleCloseCostModal = () => {
    setShowAddCostModal(false);
    setNewCostName('');
    setNewCostPrice(0);
    setNewCostPaymentDate('');
  };

  const handleAddCost = async () => {
    if (!viewingClient || !newCostName || newCostPrice <= 0) {
      alert('Veuillez saisir un nom et un prix valide');
      return;
    }

    if (!currentEnterprise) {
      alert('Aucune entreprise sélectionnée');
      return;
    }

    const { error } = await supabase.from('client_costs').insert({
      client_id: viewingClient.id,
      name: newCostName,
      price: newCostPrice,
      payment_date: newCostPaymentDate || null,
      enterprise_id: currentEnterprise.id,
    });

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    handleCloseCostModal();
    loadData();
  };

  const handleDeleteCost = async (costId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce coût ?')) return;

    const { error } = await supabase.from('client_costs').delete().eq('id', costId);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    loadData();
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#EAEAF0' }}>Clients</h1>
        <p className="text-base" style={{ color: '#9AA0AB' }}>Gestion complète des clients</p>
      </div>

      <div className="card-surface p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-elevated p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <TrendingUp size={24} style={{ color: '#3B82F6' }} />
                </div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>Revenu Total</p>
              </div>
              <select
                value={currencies.totalRevenue}
                onChange={(e) => setCurrencies({...currencies, totalRevenue: e.target.value as 'eur' | 'usd' | 'aed' | 'dzd'})}
                className="px-2 py-1 text-xs font-medium outline-none"
                style={{
                  backgroundColor: '#0F1115',
                  color: '#EAEAF0',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <option value="eur">EUR</option>
                <option value="usd">USD</option>
                <option value="aed">AED</option>
                <option value="dzd">DZD</option>
              </select>
            </div>
            <p className="text-3xl font-bold mb-2" style={{ color: '#EAEAF0' }}>
              {convertCurrency(getTotalMonthlyRevenueInEUR(), 'eur', currencies.totalRevenue).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencyLabel(currencies.totalRevenue)}
            </p>
            <p className="text-sm" style={{ color: '#6B7280' }}>{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="card-elevated p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <DollarSign size={24} style={{ color: '#10B981' }} />
                </div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>Revenu Payé</p>
              </div>
              <select
                value={currencies.paidRevenue}
                onChange={(e) => setCurrencies({...currencies, paidRevenue: e.target.value as 'eur' | 'usd' | 'aed' | 'dzd'})}
                className="px-2 py-1 text-xs font-medium outline-none"
                style={{
                  backgroundColor: '#0F1115',
                  color: '#EAEAF0',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <option value="eur">EUR</option>
                <option value="usd">USD</option>
                <option value="aed">AED</option>
                <option value="dzd">DZD</option>
              </select>
            </div>
            <p className="text-3xl font-bold mb-2" style={{ color: '#10B981' }}>
              {convertCurrency(getTotalPaidMonthlyRevenueInEUR(), 'eur', currencies.paidRevenue).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencyLabel(currencies.paidRevenue)}
            </p>
            <p className="text-sm" style={{ color: '#6B7280' }}>{clients.filter(c => c.is_paid).length} client{clients.filter(c => c.is_paid).length !== 1 ? 's' : ''} payé{clients.filter(c => c.is_paid).length !== 1 ? 's' : ''}</p>
          </div>
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
                <Briefcase size={24} style={{ color: '#9AA0AB' }} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>Total Clients</p>
            </div>
            <p className="text-3xl font-bold mb-2" style={{ color: '#EAEAF0' }}>
              {clients.length}
            </p>
            <p className="text-sm" style={{ color: '#6B7280' }}>{clients.filter(c => c.is_paid).length} actifs</p>
          </div>
        </div>
      </div>

      <div className="card-surface p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un client..."
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
              onClick={() => setShowResetConfirmModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all bg-gray-900/50 border border-gray-700 hover:bg-gray-800 text-white"
              title="Réinitialiser tous les clients comme non payés"
            >
              <RefreshCw size={18} />
              <span className="hidden md:inline">Réinitialiser Paiements</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingClient(null);
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={18} />
              <span className="hidden md:inline">
                {currentEnterprise?.slug === 'ompleo' ? 'Nouvelle Entreprise' : 'Nouveau Client'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#3B82F6' }}></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-700/50 hover:border-gray-600/50 cursor-pointer hover:-translate-y-1 min-h-[420px] flex flex-col">
              <div className="relative">
                {client.photo_url ? (
                  <img
                    src={client.photo_url}
                    alt={client.name}
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center p-4">
                    <span className="text-2xl font-bold text-white text-center break-words line-clamp-3">
                      {client.name}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleClientPaymentStatus(client.id, client.is_paid);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
                      client.is_paid
                        ? 'bg-green-500/90 text-white border-green-400/50'
                        : 'bg-gray-500/90 text-white border-gray-400/50'
                    }`}
                  >
                    {client.is_paid ? 'Payé' : 'Non payé'}
                  </button>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2">
                  {client.name}
                </h3>
                {client.contact_person && (
                  <p className="text-xs text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-gray-700/50 rounded-full">{client.contact_person}</span>
                  </p>
                )}

                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4"></div>

                <div className="space-y-3 mb-5 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Employés</span>
                    <span className="font-bold text-white flex items-center gap-1.5 bg-gray-600/20 px-2.5 py-1 rounded-lg border border-gray-500/30">
                      <Users size={14} className="text-gray-300" />
                      {getClientEmployeesCount(client.id)}
                    </span>
                  </div>
                  {client.payment_method && (
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Paiement</span>
                      <span className="font-medium text-white text-sm capitalize">{client.payment_method}</span>
                    </div>
                  )}
                  {client.currency && (
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Devise</span>
                      <span className="font-medium text-white text-sm uppercase">{client.currency}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Revenu mensuel</span>
                      <span className="text-sm font-bold text-white flex items-center gap-1">
                        <Euro size={14} className="text-green-400" />
                        {getClientMonthlyRevenueInClientCurrency(client).toLocaleString()} {getCurrencyDisplay(client)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => openDetailModal(client)}
                    className="flex-1 px-3 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-900 rounded-xl transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
                  >
                    <Eye size={16} />
                    Détails
                  </button>
                  <button
                    onClick={() => openEditModal(client)}
                    className="px-3 py-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600/50"
                  >
                    <Edit size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="px-3 py-2.5 bg-red-600/20 hover:bg-red-600/30 rounded-xl transition-all border border-red-500/50"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-16 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
              <Briefcase size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg font-medium">Aucun client trouvé</p>
              <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-[#2d2d2d] rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {client.photo_url ? (
                    <img
                      src={client.photo_url}
                      alt={client.name}
                      className="w-16 h-16 rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
                      {client.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{client.name}</h3>
                    {client.contact_person && (
                      <p className="text-sm text-gray-300 mb-2">Domain: {client.contact_person}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-300">Manager</p>
                        <p className="font-medium text-white">{getManagerName(client.manager_id)}</p>
                      </div>
                      <div>
                        <p className="text-gray-300">Employés</p>
                        <p className="font-medium text-white flex items-center gap-1">
                          <Users size={16} className="text-white" />
                          {getClientEmployeesCount(client.id)}
                        </p>
                      </div>
                      {client.payment_method && (
                        <div>
                          <p className="text-gray-300">Paiement</p>
                          <p className="font-medium text-white capitalize">{client.payment_method}</p>
                        </div>
                      )}
                      {client.currency && (
                        <div>
                          <p className="text-gray-300">Devise</p>
                          <p className="font-medium text-white uppercase">{client.currency}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-300">Revenu mensuel</p>
                        <p className="font-bold text-white flex items-center gap-1">
                          <Euro size={16} className="text-white" />
                          {getClientMonthlyRevenueInClientCurrency(client).toLocaleString()} {getCurrencyDisplay(client)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300">Statut de paiement</p>
                        <button
                          onClick={() => toggleClientPaymentStatus(client.id, client.is_paid)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            client.is_paid
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {client.is_paid ? 'Payé' : 'Non payé'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDetailModal(client)}
                    className="p-2 text-white hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Voir détails"
                  >
                    <Eye size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => openEditModal(client)}
                    className="p-2 text-white hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="text-center py-12 bg-[#2d2d2d] rounded-xl shadow-sm">
              <p className="text-gray-300">Aucun client trouvé</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#2d2d2d] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-gray-700">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-200">Client</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-200">Domain</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-200">Manager</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-200">Employés</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-200">Revenu mensuel</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-200">Statut</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-600 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {client.photo_url ? (
                          <img
                            src={client.photo_url}
                            alt={client.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {client.name[0]}
                          </div>
                        )}
                        <span className="font-semibold text-white">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-300">{client.contact_person || '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-300">{getManagerName(client.manager_id)}</td>
                    <td className="py-4 px-6 text-sm text-gray-300">
                      <span className="flex items-center gap-1">
                        <Users size={16} className="text-white" />
                        {getClientEmployeesCount(client.id)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white flex items-center gap-1">
                        <Euro size={16} className="text-white" />
                        {getClientMonthlyRevenueInClientCurrency(client).toLocaleString()} {getCurrencyDisplay(client)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleClientPaymentStatus(client.id, client.is_paid)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          client.is_paid
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {client.is_paid ? 'Payé' : 'Non payé'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openDetailModal(client)}
                          className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Eye size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-300">Aucun client trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showDetailModal && viewingClient && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' }}>
            <div className="p-6">
              <div className="flex items-start gap-6 mb-6">
                {viewingClient.photo_url ? (
                  <img
                    src={viewingClient.photo_url}
                    alt={viewingClient.name}
                    className="w-32 h-32 rounded-full object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold shadow-xl" style={{ backgroundColor: '#1A1D24', color: '#EAEAF0' }}>
                    {viewingClient.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-2" style={{ color: '#EAEAF0' }}>{viewingClient.name}</h3>
                  <p className="text-base mb-6" style={{ color: '#9AA0AB' }}>Manager: {getManagerName(viewingClient.manager_id)}</p>
                  <div className="flex gap-4">
                    <div className="card-surface px-5 py-3 rounded-xl">
                      <p className="text-xs font-medium mb-1" style={{ color: '#9AA0AB' }}>Revenu mensuel</p>
                      <p className="text-2xl font-bold" style={{ color: '#EAEAF0' }}>
                        {getClientMonthlyRevenueInClientCurrency(viewingClient).toLocaleString()} {getCurrencyDisplay(viewingClient)}
                      </p>
                    </div>
                    {currentEnterprise?.slug !== 'ompleo' && (
                      <div className="card-surface px-5 py-3 rounded-xl">
                        <p className="text-xs font-medium mb-1" style={{ color: '#9AA0AB' }}>Employés assignés</p>
                        <p className="text-2xl font-bold" style={{ color: '#EAEAF0' }}>{getClientEmployeesCount(viewingClient.id)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(viewingClient.contact_person || viewingClient.payment_date || viewingClient.payment_method || viewingClient.currency) && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-4" style={{ color: '#EAEAF0' }}>Informations de Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingClient.contact_person && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#9AA0AB' }}>Domain</p>
                        <p className="font-medium" style={{ color: '#EAEAF0' }}>{viewingClient.contact_person}</p>
                      </div>
                    )}
                    {viewingClient.payment_date && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#9AA0AB' }}>Date de paiement</p>
                        <p className="font-medium" style={{ color: '#EAEAF0' }}>{viewingClient.payment_date} du mois</p>
                      </div>
                    )}
                    {viewingClient.payment_method && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#9AA0AB' }}>Moyen de paiement</p>
                        <p className="font-medium capitalize" style={{ color: '#EAEAF0' }}>{viewingClient.payment_method}</p>
                      </div>
                    )}
                    {viewingClient.currency && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#9AA0AB' }}>Devise</p>
                        <p className="font-medium uppercase" style={{ color: '#EAEAF0' }}>{viewingClient.currency}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="card-surface rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-lg flex items-center gap-2" style={{ color: '#EAEAF0' }}>
                    <Euro size={20} style={{ color: '#9AA0AB' }} />
                    {currentEnterprise?.slug === 'ompleo'
                      ? `Offre d'emploi (${getCurrencyDisplay(viewingClient)})`
                      : currentEnterprise?.slug === 'dubai'
                      ? `Service (${getCurrencyDisplay(viewingClient)})`
                      : `Autres Coûts (${getCurrencyDisplay(viewingClient)})`}
                  </h4>
                  <button
                    onClick={() => setShowAddCostModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm"
                    style={{ backgroundColor: '#1A1D24', color: '#EAEAF0' }}
                  >
                    <Plus size={16} />
                    Ajouter un coût
                  </button>
                </div>
                {getClientCosts(viewingClient.id).length === 0 ? (
                  <p style={{ color: '#9AA0AB' }}>
                    {currentEnterprise?.slug === 'ompleo'
                      ? "Aucune offre d'emploi"
                      : currentEnterprise?.slug === 'dubai'
                      ? "Aucun service"
                      : "Aucun coût supplémentaire"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getClientCosts(viewingClient.id).map((cost) => (
                      <div key={cost.id} className="card-elevated p-4 rounded-xl">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold" style={{ color: '#EAEAF0' }}>{cost.name}</p>
                            {cost.payment_date && (
                              <p className="text-sm mt-1" style={{ color: '#9AA0AB' }}>
                                Date de paiement: {new Date(cost.payment_date).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold" style={{ color: '#EAEAF0' }}>
                              {cost.price.toLocaleString()} {getCurrencyDisplay(viewingClient)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCost(cost.id)}
                            className="ml-4 p-2 rounded-lg transition-colors"
                            style={{ color: '#EF4444' }}
                            title={currentEnterprise?.slug === 'ompleo'
                              ? "Supprimer cette offre"
                              : currentEnterprise?.slug === 'dubai'
                              ? "Supprimer ce service"
                              : "Supprimer ce coût"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="card-elevated p-4 rounded-xl" style={{ borderWidth: '2px', borderColor: 'rgba(234, 234, 240, 0.1)' }}>
                      <div className="flex justify-between items-center">
                        <p className="font-bold" style={{ color: '#EAEAF0' }}>
                          {currentEnterprise?.slug === 'ompleo'
                            ? "Total Offres"
                            : currentEnterprise?.slug === 'dubai'
                            ? "Total Services"
                            : "Total Coûts"}
                        </p>
                        <p className="text-xl font-bold" style={{ color: '#EAEAF0' }}>
                          {getTotalClientCosts(viewingClient.id).toLocaleString()} {getCurrencyDisplay(viewingClient)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentEnterprise?.slug !== 'ompleo' && currentEnterprise?.slug !== 'dubai' && (
                <div className="card-surface rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg flex items-center gap-2" style={{ color: '#EAEAF0' }}>
                      <Users size={20} style={{ color: '#9AA0AB' }} />
                      Employés Assignés
                    </h4>
                    <button
                      onClick={() => setShowAssignEmployeeModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm"
                      style={{ backgroundColor: '#1A1D24', color: '#EAEAF0' }}
                    >
                      <Plus size={16} />
                      Assigner un employé
                    </button>
                  </div>
                {getClientEmployees(viewingClient.id).length === 0 ? (
                  <p style={{ color: '#9AA0AB' }}>Aucun employé assigné à ce client</p>
                ) : (
                  <div className="space-y-3">
                    {getClientEmployees(viewingClient.id).map((emp) => {
                      const rateData = employeeRates.find(r => r.employee_id === emp.id && r.client_id === viewingClient.id);
                      const rate = getEmployeeRate(emp.id, viewingClient.id);
                      const baseRate = rateData?.monthly_rate || 0;
                      const prorata = viewingClient.payment_date && rateData ? calculateProrata(rateData.start_date, viewingClient.payment_date, rateData.end_date) : 1;
                      const isProrated = prorata < 0.999;
                      const isInactive = rateData?.end_date ? true : false;
                      const salaryCost = getTotalEmployeeSalaryCost(emp);
                      const salaryCostEUR = salaryCost / exchangeRate;
                      const margin = rate - salaryCostEUR;

                      return (
                        <div key={emp.id} className={`card-elevated p-4 rounded-xl ${isInactive ? 'opacity-70' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold" style={{ color: isInactive ? '#9AA0AB' : '#EAEAF0' }}>
                                  {emp.first_name} {emp.last_name}
                                </p>
                                {isInactive && (
                                  <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#1A1D24', color: '#9AA0AB' }}>
                                    Inactif
                                  </span>
                                )}
                              </div>
                              <p className="text-sm" style={{ color: '#9AA0AB' }}>{emp.position}</p>
                              {rateData && (
                                <div className="text-xs mt-1" style={{ color: '#9AA0AB' }}>
                                  <p>Début: {new Date(rateData.start_date).toLocaleDateString('fr-FR')}</p>
                                  {rateData.end_date && (
                                    <p className="font-medium" style={{ color: '#EF4444' }}>
                                      Fin: {new Date(rateData.end_date).toLocaleDateString('fr-FR')}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium mb-1" style={{ color: '#9AA0AB' }}>Tarif mensuel</p>
                              <p className="text-lg font-bold" style={{ color: '#EAEAF0' }}>{rate.toLocaleString()} EUR</p>
                              {isProrated && (
                                <p className="text-xs font-medium" style={{ color: '#F59E0B' }}>
                                  Prorata: {(prorata * 100).toFixed(0)}% ({baseRate.toLocaleString()} EUR)
                                </p>
                              )}
                            </div>
                            <div className="ml-4 flex gap-2">
                              <button
                                onClick={() => {
                                  if (rateData) {
                                    setEditingEmployeeRate(rateData);
                                    setMonthlyRate(rateData.monthly_rate);
                                    setStartDate(rateData.start_date);
                                    setEndDate(rateData.end_date || '');
                                    setShowEditEmployeeRateModal(true);
                                  }
                                }}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: '#EAEAF0' }}
                                title="Modifier l'assignation"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleUnassignEmployee(emp.id, viewingClient.id)}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: '#EF4444' }}
                                title="Retirer cet employé"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 grid grid-cols-3 gap-2 text-sm" style={{ borderTop: '1px solid rgba(234, 234, 240, 0.1)' }}>
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>Coût salarial</p>
                              <p className="font-medium" style={{ color: '#EAEAF0' }}>{salaryCost.toLocaleString()} DZD</p>
                              <p className="text-xs" style={{ color: '#9AA0AB' }}>≈ {salaryCostEUR.toFixed(2)} EUR</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>Marge</p>
                              <p className={`font-bold`} style={{ color: margin >= 0 ? '#10B981' : '#EF4444' }}>
                                {margin.toFixed(2)} EUR
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>Taux de marge</p>
                              <p className={`font-bold`} style={{ color: margin >= 0 ? '#10B981' : '#EF4444' }}>
                                {rate > 0 ? ((margin / rate) * 100).toFixed(1) : '0'}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              )}

              {viewingClient.notes && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3" style={{ color: '#EAEAF0' }}>Notes</h4>
                  <p className="card-surface p-4 rounded-xl" style={{ color: '#9AA0AB' }}>{viewingClient.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid rgba(234, 234, 240, 0.1)' }}>
                <button
                  onClick={() => handleExportPDF(viewingClient)}
                  className="flex-1 px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1A1D24', color: '#EAEAF0' }}
                >
                  <Download size={18} />
                  Exporter PDF
                </button>
                <button
                  onClick={() => handleExportImage(viewingClient)}
                  className="flex-1 px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1A1D24', color: '#EAEAF0' }}
                >
                  <Download size={18} />
                  Exporter Image
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(viewingClient);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1A1D24', color: '#EAEAF0' }}
                >
                  <Edit size={18} />
                  Modifier
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 rounded-xl transition-colors"
                  style={{ border: '1px solid rgba(234, 234, 240, 0.1)', color: '#EAEAF0' }}
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
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' }}>
            <div className="sticky top-0 border-b border-gray-700 p-6 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #252932 0%, #1F2229 100%)' }}>
              <h2 className="text-2xl font-bold text-white">
                {currentEnterprise?.slug === 'ompleo'
                  ? (editingClient ? "Modifier l'entreprise" : 'Nouvelle entreprise')
                  : (editingClient ? 'Modifier le client' : 'Nouveau client')
                }
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {currentEnterprise?.slug === 'ompleo' ? "Nom de l'entreprise *" : "Nom du client *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                {currentEnterprise?.slug === 'ompleo' ? (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-200 mb-2">Domain</label>
                      <input
                        type="text"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-200 mb-2">Nom contact entreprise</label>
                      <input
                        type="text"
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-200 mb-2">Type de contact</label>
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="contact_type"
                            value="numero"
                            checked={formData.contact_type === 'numero'}
                            onChange={(e) => setFormData({ ...formData, contact_type: e.target.value as 'numero' | 'email' })}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-200">Numéro</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="contact_type"
                            value="email"
                            checked={formData.contact_type === 'email'}
                            onChange={(e) => setFormData({ ...formData, contact_type: e.target.value as 'numero' | 'email' })}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-200">Email</span>
                        </label>
                      </div>
                      <input
                        type={formData.contact_type === 'email' ? 'email' : 'tel'}
                        placeholder={formData.contact_type === 'email' ? 'email@exemple.com' : '+213 XX XX XX XX'}
                        value={formData.contact_value}
                        onChange={(e) => setFormData({ ...formData, contact_value: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Personne de contact</label>
                      <input
                        type="text"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Manager responsable</label>
                      <select
                        value={formData.manager_id}
                        onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                      >
                        <option value="">Non assigné</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.first_name} {manager.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-200 mb-2">Date de paiement</label>
                      <select
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                      >
                        <option value="">Sélectionner un jour</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>
                            {day} du mois
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Moyen paiement</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner un moyen</option>
                    <option value="virement bancaire">Virement bancaire</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Devise</label>
                  {currentEnterprise?.slug === 'ompleo' ? (
                    <input
                      type="text"
                      value="DZD"
                      disabled
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-400 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    >
                      <option value="">Sélectionner une devise</option>
                      <option value="euro">Euro</option>
                      <option value="usd">USD</option>
                      <option value="aed">AED</option>
                    </select>
                  )}
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
                  className="px-6 py-2 border border-gray-600 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1a1a1a] hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {editingClient ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignEmployeeModal && viewingClient && (
        <div className="fixed inset-0 bg-[#1a1a1a] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-[#1a1a1a] text-white p-6 rounded-t-xl flex justify-between items-center">
              <h2 className="text-xl font-bold">Assigner un employé à {viewingClient.name}</h2>
              <button onClick={() => setShowAssignEmployeeModal(false)} className="p-2 hover:bg-gray-600 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Rechercher un employé</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Rechercher par nom ou poste..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Employé *</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner un employé</option>
                    {getAvailableEmployees().map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.position}
                      </option>
                    ))}
                  </select>
                  {employees.filter(e => {
                    const assignedEmployeeIds = getClientEmployees(viewingClient.id).map(e => e.id);
                    return !assignedEmployeeIds.includes(e.id);
                  }).length === 0 ? (
                    <p className="text-sm text-gray-300 mt-1">Tous les employés sont déjà assignés à ce client</p>
                  ) : getAvailableEmployees().length === 0 && employeeSearchTerm ? (
                    <p className="text-sm text-gray-300 mt-1">Aucun employé trouvé pour "{employeeSearchTerm}"</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Tarif mensuel (EUR) *</label>
                  <input
                    type="number"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 3500"
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-300 mt-1">Le tarif mensuel facturé au client pour cet employé</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Date de début *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-300 mt-1">Date de début de travail avec ce client</p>
                </div>

                {selectedEmployeeId && monthlyRate > 0 && (
                  <div className="bg-[#1a1a1a] p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-200 mb-2">Aperçu</p>
                    <div className="space-y-1 text-sm">
                      {(() => {
                        const emp = employees.find(e => e.id === selectedEmployeeId);
                        if (!emp) return null;
                        const salaryCost = getTotalEmployeeSalaryCost(emp);
                        const salaryCostEUR = salaryCost / exchangeRate;
                        const margin = monthlyRate - salaryCostEUR;
                        const marginPercent = monthlyRate > 0 ? ((margin / monthlyRate) * 100).toFixed(1) : '0';

                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Coût salarial:</span>
                              <span className="font-medium">{salaryCost.toLocaleString()} DZD (≈ {salaryCostEUR.toFixed(2)} EUR)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Tarif client:</span>
                              <span className="font-medium">{monthlyRate.toLocaleString()} EUR</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-700">
                              <span className="text-gray-300 font-medium">Marge:</span>
                              <span className={`font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {margin.toFixed(2)} EUR ({marginPercent}%)
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowAssignEmployeeModal(false)}
                  className="px-6 py-2 border border-gray-600 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAssignEmployee}
                  disabled={!selectedEmployeeId || monthlyRate <= 0}
                  className="px-6 py-2 bg-[#1a1a1a] hover:bg-gray-600 text-white rounded-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Assigner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditEmployeeRateModal && editingEmployeeRate && viewingClient && (
        <div className="fixed inset-0 bg-[#1a1a1a] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-[#1a1a1a] text-white p-6 rounded-t-xl flex justify-between items-center">
              <h2 className="text-xl font-bold">Modifier l'assignation</h2>
              <button onClick={() => {
                setShowEditEmployeeRateModal(false);
                setEditingEmployeeRate(null);
                setMonthlyRate(0);
                setStartDate(new Date().toISOString().split('T')[0]);
                setEndDate('');
              }} className="p-2 hover:bg-gray-600 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Employé</label>
                  <div className="px-4 py-2 bg-gray-700 rounded-lg text-gray-200">
                    {(() => {
                      const emp = employees.find(e => e.id === editingEmployeeRate.employee_id);
                      return emp ? `${emp.first_name} ${emp.last_name} - ${emp.position}` : 'Inconnu';
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Tarif mensuel (EUR) *</label>
                  <input
                    type="number"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 3500"
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-300 mt-1">Le tarif mensuel facturé au client pour cet employé</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Date de début *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-300 mt-1">Date de début de travail avec ce client</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Date de fin (optionnelle)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-300 mt-1">Laisser vide si l'employé travaille toujours avec ce client</p>
                </div>

                {monthlyRate > 0 && (
                  <div className="bg-[#1a1a1a] p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-200 mb-2">Aperçu</p>
                    <div className="space-y-1 text-sm">
                      {(() => {
                        const emp = employees.find(e => e.id === editingEmployeeRate.employee_id);
                        if (!emp) return null;
                        const salaryCost = getTotalEmployeeSalaryCost(emp);
                        const salaryCostEUR = salaryCost / exchangeRate;
                        const margin = monthlyRate - salaryCostEUR;
                        const marginPercent = monthlyRate > 0 ? ((margin / monthlyRate) * 100).toFixed(1) : '0';

                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Coût salarial:</span>
                              <span className="font-medium">{salaryCost.toLocaleString()} DZD (≈ {salaryCostEUR.toFixed(2)} EUR)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Tarif client:</span>
                              <span className="font-medium">{monthlyRate.toLocaleString()} EUR</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-700">
                              <span className="text-gray-300 font-medium">Marge:</span>
                              <span className={`font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {margin.toFixed(2)} EUR ({marginPercent}%)
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditEmployeeRateModal(false);
                    setEditingEmployeeRate(null);
                    setMonthlyRate(0);
                    setStartDate(new Date().toISOString().split('T')[0]);
                    setEndDate('');
                  }}
                  className="px-6 py-2 border border-gray-600 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateEmployeeRate}
                  disabled={monthlyRate <= 0}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddCostModal && viewingClient && (
        <div className="fixed inset-0 bg-[#1a1a1a] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-[#1a1a1a] text-white p-6 rounded-t-xl flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {currentEnterprise?.slug === 'ompleo'
                  ? `Ajouter une offre d'emploi à ${viewingClient.name}`
                  : currentEnterprise?.slug === 'dubai'
                  ? `Ajouter un service à ${viewingClient.name}`
                  : `Ajouter un coût à ${viewingClient.name}`
                }
              </h2>
              <button onClick={handleCloseCostModal} className="p-2 hover:bg-gray-600 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {currentEnterprise?.slug === 'ompleo'
                      ? "Nom de l'offre *"
                      : currentEnterprise?.slug === 'dubai'
                      ? "Nom du service *"
                      : "Nom du coût *"}
                  </label>
                  <input
                    type="text"
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    placeholder={currentEnterprise?.slug === 'ompleo'
                      ? "Ex: Développeur Full Stack"
                      : currentEnterprise?.slug === 'dubai'
                      ? "Ex: Consulting"
                      : "Ex: Frais de gestion"}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Prix ({getCurrencyDisplay(viewingClient)}) *
                  </label>
                  <input
                    type="number"
                    value={newCostPrice || ''}
                    onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)}
                    placeholder={currentEnterprise?.slug === 'ompleo'
                      ? "Ex: 50000"
                      : "Ex: 5000"}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    {currentEnterprise?.slug === 'ompleo'
                      ? `Le montant mensuel de cette offre en ${getCurrencyDisplay(viewingClient)}`
                      : `Le montant de ce service en ${getCurrencyDisplay(viewingClient)}`
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Date de paiement
                  </label>
                  <input
                    type="date"
                    value={newCostPaymentDate}
                    onChange={(e) => setNewCostPaymentDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    Date à laquelle le paiement est prévu
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={handleCloseCostModal}
                  className="px-6 py-2 border border-gray-600 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddCost}
                  disabled={!newCostName || newCostPrice <= 0}
                  className="px-6 py-2 bg-[#1a1a1a] hover:bg-gray-600 text-white rounded-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResetConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowResetConfirmModal(false)}
        >
          <div
            className="card-elevated p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#EAEAF0' }}>
              Réinitialiser les paiements
            </h3>
            <p className="text-sm mb-6" style={{ color: '#9AA0AB' }}>
              Êtes-vous sûr de vouloir réinitialiser tous les clients comme non payés ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: '#2A2D35',
                  color: '#EAEAF0',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                Annuler
              </button>
              <button
                onClick={resetAllClientsToUnpaid}
                className="px-5 py-2.5 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: '#2A2D35',
                  color: '#EAEAF0',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
