import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { DollarSign, TrendingUp, Users, Briefcase, Package, ArrowRightLeft, X } from 'lucide-react';

interface ExchangeRates {
  eur_dzd: number;
  usd_dzd: number;
  aed_dzd: number;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalClients: number;
  totalEquipment: number;
  assignedEquipment: number;

  totalEnterpriseRevenue: number;
  totalSalaries: number;
  totalProfessionalExpenses: number;
  totalOperatingCosts: number;
  netProfit: number;
  personalExpenses: number;
  finalProfit: number;
}

export const MainDashboard = () => {
  const { accessibleEnterprises } = useAuth();
  const { enterprises } = useEnterprise();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    eur_dzd: 140,
    usd_dzd: 133,
    aed_dzd: 36,
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalClients: 0,
    totalEquipment: 0,
    assignedEquipment: 0,
    totalEnterpriseRevenue: 0,
    totalSalaries: 0,
    totalProfessionalExpenses: 0,
    totalOperatingCosts: 0,
    netProfit: 0,
    personalExpenses: 0,
    finalProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [currencies, setCurrencies] = useState(() => {
    const saved = localStorage.getItem('mainDashboard_currencies');
    return saved ? JSON.parse(saved) : {
      revenue: 'EUR',
      salaries: 'EUR',
      expenses: 'EUR',
      operatingCosts: 'EUR',
      netProfit: 'EUR',
      personalExpenses: 'EUR',
      finalProfit: 'EUR',
    };
  });
  const [baseCurrency, setBaseCurrency] = useState(() =>
    localStorage.getItem('mainDashboard_baseCurrency') || 'EUR'
  );
  const [tempExchangeRates, setTempExchangeRates] = useState<ExchangeRates>({
    eur_dzd: 140,
    usd_dzd: 133,
    aed_dzd: 36,
  });
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('mainDashboard_baseCurrency', baseCurrency);
  }, [baseCurrency]);

  useEffect(() => {
    localStorage.setItem('mainDashboard_currencies', JSON.stringify(currencies));
  }, [currencies]);

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    loadExchangeRates();
  }, []);

  useEffect(() => {
    if (selectedMonth && accessibleEnterprises.length > 0 && enterprises.length > 0) {
      loadDashboardData();
    }
  }, [selectedMonth, exchangeRates.eur_dzd, exchangeRates.usd_dzd, exchangeRates.aed_dzd, accessibleEnterprises.join(','), enterprises.map(e => e.id).join(',')]);

  const loadExchangeRates = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['exchange_rate_eur_dzd', 'exchange_rate_usd_dzd', 'exchange_rate_aed_dzd']);

    if (!error && data) {
      const rates: ExchangeRates = {
        eur_dzd: 140,
        usd_dzd: 133,
        aed_dzd: 36,
      };

      data.forEach((setting) => {
        if (setting.key === 'exchange_rate_eur_dzd') {
          rates.eur_dzd = parseFloat(setting.value);
        } else if (setting.key === 'exchange_rate_usd_dzd') {
          rates.usd_dzd = parseFloat(setting.value);
        } else if (setting.key === 'exchange_rate_aed_dzd') {
          rates.aed_dzd = parseFloat(setting.value);
        }
      });

      setExchangeRates(rates);
    }
  };

  const calculateWorkPercentage = (hireDate: string, enterpriseSlug?: string) => {
    const hire = new Date(hireDate);
    const today = new Date();

    const isDeepCloserOrOmpleo = enterpriseSlug === 'deep-closer' || enterpriseSlug === 'ompleo';
    const transitionPaymentDate = new Date(2026, 1, 5);
    const isInTransitionPeriod = isDeepCloserOrOmpleo && today >= new Date(2025, 11, 25) && today < transitionPaymentDate;
    const isPostTransition = isDeepCloserOrOmpleo && today >= transitionPaymentDate;

    let nextPaymentDate: Date;
    let lastPaymentDate: Date;
    let periodEndDate: Date;

    if (isInTransitionPeriod) {
      nextPaymentDate = new Date(2026, 1, 5);
      periodEndDate = new Date(2026, 1, 1);
      lastPaymentDate = new Date(2025, 11, 25);
    } else if (isPostTransition) {
      nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), 5);
      if (today.getDate() >= 5) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      periodEndDate = nextPaymentDate;
      lastPaymentDate = new Date(nextPaymentDate);
      lastPaymentDate.setMonth(lastPaymentDate.getMonth() - 1);
    } else {
      nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), 25);
      if (today.getDate() > 25) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      periodEndDate = nextPaymentDate;
      lastPaymentDate = new Date(nextPaymentDate);
      lastPaymentDate.setMonth(lastPaymentDate.getMonth() - 1);
    }

    if (hire >= periodEndDate) {
      return 0;
    }

    const totalDays = Math.ceil((periodEndDate.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    const workedDays = hire <= lastPaymentDate
      ? totalDays
      : Math.ceil((periodEndDate.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24));

    if (isInTransitionPeriod) {
      return workedDays / 30;
    }

    return workedDays / totalDays;
  };

  const calculateTotalAvecProrata = (employee: any, enterpriseSlug?: string) => {
    const percentage = calculateWorkPercentage(employee.hire_date, enterpriseSlug);
    const salaireLiquideProrata = (employee.monthly_salary * percentage) - employee.declared_salary;
    const totalLiquideAvecProrata = salaireLiquideProrata + employee.recharge + employee.monthly_bonus;
    return totalLiquideAvecProrata + employee.declared_salary;
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

  const loadDashboardData = async () => {
    setLoading(true);

    if (accessibleEnterprises.length === 0) {
      setLoading(false);
      return;
    }

    const [
      employeesRes,
      clientsRes,
      equipmentRes,
      enterpriseExpensesRes,
      personalExpensesRes,
      ratesRes,
      clientCostsRes,
    ] = await Promise.all([
      supabase.from('employees').select('*').in('enterprise_id', accessibleEnterprises),
      supabase.from('clients').select('*').in('enterprise_id', accessibleEnterprises),
      supabase.from('equipment').select('*').in('enterprise_id', accessibleEnterprises),
      supabase.from('expenses').select('*').in('enterprise_id', accessibleEnterprises),
      supabase.from('expenses').select('*').is('enterprise_id', null).eq('type', 'Personnel'),
      supabase.from('employee_client_rates').select('*').in('enterprise_id', accessibleEnterprises),
      supabase.from('client_costs').select('*').in('enterprise_id', accessibleEnterprises),
    ]);

    const accessibleEnterprisesData = enterprises.filter(e => accessibleEnterprises.includes(e.id));
    const employees = employeesRes.data || [];
    const clients = clientsRes.data || [];
    const equipment = equipmentRes.data || [];
    const enterpriseExpenses = enterpriseExpensesRes.data || [];
    const personalExpensesData = personalExpensesRes.data || [];
    const expenses = [...enterpriseExpenses, ...personalExpensesData];
    const rates = ratesRes.data || [];
    const clientCosts = clientCostsRes.data || [];

    const activeEmployees = employees.filter(e => e.status === 'Actif');
    const assignedEquipment = equipment.filter(e => e.status === 'Assigné');

    const convertToEUR = (amount: number, currency: string) => {
      if (currency === 'EUR') return amount;
      if (currency === 'DZD') return amount / exchangeRates.eur_dzd;
      if (currency === 'USD') return amount * (exchangeRates.usd_dzd / exchangeRates.eur_dzd);
      if (currency === 'AED') return amount * (exchangeRates.aed_dzd / exchangeRates.eur_dzd);
      return amount;
    };

    let totalRevenueEUR = 0;
    let totalSalariesEUR = 0;
    let totalProfessionalExpensesEUR = 0;

    accessibleEnterprisesData.forEach(enterprise => {
      const enterpriseEmployees = employees.filter(e => e.enterprise_id === enterprise.id);
      const enterpriseClients = clients.filter(c => c.enterprise_id === enterprise.id);
      const enterpriseExpenses = expenses.filter(e => e.enterprise_id === enterprise.id && e.type === 'Professionnel');

      const activEnterpriseEmployees = enterpriseEmployees.filter(e => e.status === 'Actif');
      const salariesDZD = activEnterpriseEmployees.reduce((sum, emp) => sum + calculateTotalAvecProrata(emp, enterprise.slug), 0);
      totalSalariesEUR += salariesDZD / exchangeRates.eur_dzd;

      const professionalExpenses = enterpriseExpenses.reduce((sum, exp) => {
        return sum + convertToEUR(exp.amount, exp.currency);
      }, 0);
      totalProfessionalExpensesEUR += professionalExpenses;

      const revenue = enterpriseClients.reduce((sum, client) => {
        const clientEmployees = enterpriseEmployees.filter(emp => {
          const empRates = rates.filter(r => r.client_id === client.id && r.employee_id === emp.id);
          return empRates.length > 0;
        });

        const employeesRevenue = clientEmployees.reduce((empSum, emp) => {
          const rate = rates.find(r => r.employee_id === emp.id && r.client_id === client.id);
          if (!rate) return empSum;

          const rateAmount = convertToEUR(rate.monthly_rate, rate.currency || 'EUR');

          if (!client.payment_date) {
            return empSum + rateAmount;
          }

          const prorata = calculateProrata(rate.start_date, client.payment_date, rate.end_date);
          return empSum + (rateAmount * prorata);
        }, 0);

        const additionalCosts = clientCosts
          .filter(cost => cost.client_id === client.id)
          .reduce((costSum, cost) => {
            return costSum + convertToEUR(cost.price, cost.currency || 'EUR');
          }, 0);

        return sum + employeesRevenue + additionalCosts;
      }, 0);

      totalRevenueEUR += revenue;
    });

    const personalExpenses = expenses.filter(e => e.type === 'Personnel');
    const personalExpensesEUR = personalExpenses.reduce((sum, exp) => {
      return sum + convertToEUR(exp.amount, exp.currency);
    }, 0);

    const totalOperatingCostsEUR = totalSalariesEUR + totalProfessionalExpensesEUR;
    const netProfitEUR = totalRevenueEUR - totalOperatingCostsEUR;
    const finalProfitEUR = netProfitEUR - personalExpensesEUR;

    setStats({
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      totalClients: clients.length,
      totalEquipment: equipment.length,
      assignedEquipment: assignedEquipment.length,
      totalEnterpriseRevenue: totalRevenueEUR,
      totalSalaries: totalSalariesEUR,
      totalProfessionalExpenses: totalProfessionalExpensesEUR,
      totalOperatingCosts: totalOperatingCostsEUR,
      netProfit: netProfitEUR,
      personalExpenses: personalExpensesEUR,
      finalProfit: finalProfitEUR,
    });

    setLoading(false);
  };


  const convertFromEUR = (amountEUR: number, targetCurrency: string) => {
    if (targetCurrency === 'EUR') return amountEUR;
    if (targetCurrency === 'DZD') return amountEUR * exchangeRates.eur_dzd;
    if (targetCurrency === 'USD') return amountEUR / (exchangeRates.usd_dzd / exchangeRates.eur_dzd);
    if (targetCurrency === 'AED') return amountEUR / (exchangeRates.aed_dzd / exchangeRates.eur_dzd);
    return amountEUR;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'AED': 'AED',
      'DZD': 'DA',
    };
    return symbols[currency] || '';
  };

  const openExchangeModal = () => {
    setTempExchangeRates({ ...exchangeRates });
    setBaseCurrency('EUR');
    setInputValues({});
    setShowExchangeModal(true);
  };

  const getRelativeRate = (fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return 1;

    const rates: Record<string, number> = {
      'EUR': tempExchangeRates.eur_dzd,
      'USD': tempExchangeRates.usd_dzd,
      'AED': tempExchangeRates.aed_dzd,
      'DZD': 1,
    };

    if (toCurrency === 'DZD') {
      return rates[fromCurrency];
    }

    if (fromCurrency === 'DZD') {
      return 1 / rates[toCurrency];
    }

    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    return fromRate / toRate;
  };

  const getInputValue = (currency: string): string => {
    const key = `${baseCurrency}_${currency}`;
    if (inputValues[key] !== undefined) {
      return inputValues[key];
    }
    return getRelativeRate(baseCurrency, currency).toString();
  };

  const updateRelativeRate = (targetCurrency: string, inputValue: string) => {
    const key = `${baseCurrency}_${targetCurrency}`;
    setInputValues(prev => ({ ...prev, [key]: inputValue }));

    const newRate = parseFloat(inputValue);
    if (isNaN(newRate) || newRate <= 0) return;

    const rates: Record<string, number> = {
      'EUR': tempExchangeRates.eur_dzd,
      'USD': tempExchangeRates.usd_dzd,
      'AED': tempExchangeRates.aed_dzd,
      'DZD': 1,
    };

    const newRates = { ...tempExchangeRates };

    if (targetCurrency === 'DZD') {
      if (baseCurrency === 'EUR') newRates.eur_dzd = newRate;
      if (baseCurrency === 'USD') newRates.usd_dzd = newRate;
      if (baseCurrency === 'AED') newRates.aed_dzd = newRate;
    } else if (baseCurrency === 'DZD') {
      if (targetCurrency === 'EUR') newRates.eur_dzd = 1 / newRate;
      if (targetCurrency === 'USD') newRates.usd_dzd = 1 / newRate;
      if (targetCurrency === 'AED') newRates.aed_dzd = 1 / newRate;
    } else {
      const baseRateToDZD = rates[baseCurrency];
      const newTargetRateToDZD = baseRateToDZD / newRate;

      if (targetCurrency === 'EUR') newRates.eur_dzd = newTargetRateToDZD;
      if (targetCurrency === 'USD') newRates.usd_dzd = newTargetRateToDZD;
      if (targetCurrency === 'AED') newRates.aed_dzd = newTargetRateToDZD;
    }

    setTempExchangeRates(newRates);
  };

  const handleBaseCurrencyChange = (newBase: string) => {
    setBaseCurrency(newBase);
    setInputValues({});
  };

  const getOtherCurrencies = () => {
    const allCurrencies = ['EUR', 'USD', 'AED', 'DZD'];
    return allCurrencies.filter(c => c !== baseCurrency);
  };

  const handleSaveExchangeRates = async () => {
    console.log('Saving exchange rates:', tempExchangeRates);

    if (tempExchangeRates.eur_dzd <= 0 || tempExchangeRates.usd_dzd <= 0 || tempExchangeRates.aed_dzd <= 0) {
      console.error('Invalid rates detected:', tempExchangeRates);
      alert('Tous les taux de change doivent être supérieurs à 0');
      return;
    }

    try {
      const updates = [
        { key: 'exchange_rate_eur_dzd', value: tempExchangeRates.eur_dzd.toString() },
        { key: 'exchange_rate_usd_dzd', value: tempExchangeRates.usd_dzd.toString() },
        { key: 'exchange_rate_aed_dzd', value: tempExchangeRates.aed_dzd.toString() },
      ];

      console.log('Updates to save:', updates);

      const { error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      console.log('Exchange rates saved successfully');
      setExchangeRates({ ...tempExchangeRates });
      setShowExchangeModal(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error saving exchange rates:', error);
      alert('Erreur lors de la sauvegarde des taux de change');
    }
  };

  return (
    <div className="px-4 lg:px-0">
      <div className="mb-6 lg:mb-10 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
        <div>
          <h1 className="text-2xl lg:text-4xl font-bold tracking-tight mb-1 lg:mb-2" style={{ color: '#EAEAF0' }}>Dashboard</h1>
          <p className="text-sm lg:text-base" style={{ color: '#9AA0AB' }}>Vue d'ensemble de toutes les entreprises</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium outline-none w-full sm:w-auto"
            style={{
              backgroundColor: '#1A1D24',
              color: '#EAEAF0',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          />
          <button
            onClick={openExchangeModal}
            className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap"
            style={{ backgroundColor: '#6B7280', color: '#EAEAF0' }}
          >
            <ArrowRightLeft size={16} />
            <span className="hidden sm:inline">Taux d'échange</span>
            <span className="sm:hidden">Taux</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6B7280' }}></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-10">
            <div className="card-elevated p-4 lg:p-6">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>REVENU TOTAL</p>
                <select
                  value={currencies.revenue}
                  onChange={(e) => setCurrencies({...currencies, revenue: e.target.value})}
                  className="px-2 py-1 text-xs font-medium outline-none"
                  style={{
                    backgroundColor: '#0F1115',
                    color: '#EAEAF0',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="DZD">DZD</option>
                </select>
              </div>
              <p className="text-2xl lg:text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                {convertFromEUR(stats.totalEnterpriseRevenue, currencies.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.revenue)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={14} style={{ color: '#9CA3AF' }} />
                <span className="text-xs" style={{ color: '#9AA0AB' }}>Toutes entreprises</span>
              </div>
            </div>

            <div className="card-elevated p-4 lg:p-6">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>SALAIRES</p>
                <select
                  value={currencies.salaries}
                  onChange={(e) => setCurrencies({...currencies, salaries: e.target.value})}
                  className="px-2 py-1 text-xs font-medium outline-none"
                  style={{
                    backgroundColor: '#0F1115',
                    color: '#EAEAF0',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="DZD">DZD</option>
                </select>
              </div>
              <p className="text-2xl lg:text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                {convertFromEUR(stats.totalSalaries, currencies.salaries).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.salaries)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Users size={14} style={{ color: '#F59E0B' }} />
                <span className="text-xs" style={{ color: '#9AA0AB' }}>{stats.activeEmployees} employés</span>
              </div>
            </div>

            <div className="card-elevated p-4 lg:p-6">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>DÉPENSES PRO</p>
                <select
                  value={currencies.expenses}
                  onChange={(e) => setCurrencies({...currencies, expenses: e.target.value})}
                  className="px-2 py-1 text-xs font-medium outline-none"
                  style={{
                    backgroundColor: '#0F1115',
                    color: '#EAEAF0',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="DZD">DZD</option>
                </select>
              </div>
              <p className="text-2xl lg:text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                {convertFromEUR(stats.totalProfessionalExpenses, currencies.expenses).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.expenses)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Briefcase size={14} style={{ color: '#EF4444' }} />
                <span className="text-xs" style={{ color: '#9AA0AB' }}>Professionnel</span>
              </div>
            </div>

            <div className="card-elevated p-4 lg:p-6">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>FRAIS TOTAUX</p>
                <select
                  value={currencies.operatingCosts}
                  onChange={(e) => setCurrencies({...currencies, operatingCosts: e.target.value})}
                  className="px-2 py-1 text-xs font-medium outline-none"
                  style={{
                    backgroundColor: '#0F1115',
                    color: '#EAEAF0',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="DZD">DZD</option>
                </select>
              </div>
              <p className="text-2xl lg:text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                {convertFromEUR(stats.totalOperatingCosts, currencies.operatingCosts).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.operatingCosts)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <DollarSign size={14} style={{ color: '#6B7280' }} />
                <span className="text-xs" style={{ color: '#9AA0AB' }}>Opérationnel</span>
              </div>
            </div>
          </div>

          <div className={`mb-6 lg:mb-10 p-4 lg:p-8 rounded-2xl ${stats.netProfit >= 0 ? 'glow-positive' : 'glow-warning'}`} style={{ background: 'linear-gradient(135deg, #1E212A 0%, #181B22 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium" style={{ color: '#9AA0AB' }}>BÉNÉFICE NET</p>
                  <select
                    value={currencies.netProfit}
                    onChange={(e) => setCurrencies({...currencies, netProfit: e.target.value})}
                    className="px-2 py-1 text-xs font-medium outline-none"
                    style={{
                      backgroundColor: '#0F1115',
                      color: '#EAEAF0',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="DZD">DZD</option>
                  </select>
                </div>
                <p className={`text-3xl lg:text-6xl font-bold mb-3`} style={{ color: stats.netProfit >= 0 ? '#10B981' : '#F59E0B' }}>
                  {convertFromEUR(stats.netProfit, currencies.netProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.netProfit)}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-xs lg:text-sm" style={{ color: '#9AA0AB' }}>
                    Marge: <span className="font-semibold" style={{ color: '#EAEAF0' }}>
                      {stats.totalEnterpriseRevenue > 0 ? ((stats.netProfit / stats.totalEnterpriseRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </span>
                </div>
              </div>
              <div className="hidden lg:block">
                <TrendingUp size={80} style={{ color: stats.netProfit >= 0 ? '#10B981' : '#F59E0B', opacity: 0.2 }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="card-surface p-4 lg:p-6">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>DÉPENSES PERSONNEL</p>
                <select
                  value={currencies.personalExpenses}
                  onChange={(e) => setCurrencies({...currencies, personalExpenses: e.target.value})}
                  className="px-2 py-1 text-xs font-medium outline-none"
                  style={{
                    backgroundColor: '#0F1115',
                    color: '#EAEAF0',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="DZD">DZD</option>
                </select>
              </div>
              <p className="text-2xl lg:text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                {convertFromEUR(stats.personalExpenses, currencies.personalExpenses).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.personalExpenses)}
              </p>
              <span className="text-xs" style={{ color: '#9AA0AB' }}>Dépenses personnelles</span>
            </div>

            <div className="card-surface p-4 lg:p-6">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>BÉNÉFICE FINAL</p>
                <select
                  value={currencies.finalProfit}
                  onChange={(e) => setCurrencies({...currencies, finalProfit: e.target.value})}
                  className="px-2 py-1 text-xs font-medium outline-none"
                  style={{
                    backgroundColor: '#0F1115',
                    color: '#EAEAF0',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="DZD">DZD</option>
                </select>
              </div>
              <p className={`text-3xl font-semibold mb-1`} style={{ color: stats.finalProfit >= 0 ? '#10B981' : '#EF4444' }}>
                {convertFromEUR(stats.finalProfit, currencies.finalProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.finalProfit)}
              </p>
              <span className="text-xs" style={{ color: '#9AA0AB' }}>Après dépenses personnelles</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-surface p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(107, 114, 128, 0.2)' }}>
                  <Users size={24} style={{ color: '#9CA3AF' }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold" style={{ color: '#EAEAF0' }}>{stats.activeEmployees}</p>
                  <p className="text-sm" style={{ color: '#9AA0AB' }}>Employés actifs</p>
                </div>
              </div>
            </div>

            <div className="card-surface p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <Briefcase size={24} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold" style={{ color: '#EAEAF0' }}>{stats.totalClients}</p>
                  <p className="text-sm" style={{ color: '#9AA0AB' }}>Clients actifs</p>
                </div>
              </div>
            </div>

            <div className="card-surface p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                  <Package size={24} style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold" style={{ color: '#EAEAF0' }}>{stats.assignedEquipment}/{stats.totalEquipment}</p>
                  <p className="text-sm" style={{ color: '#9AA0AB' }}>Équipements assignés</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showExchangeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="card-elevated w-full max-w-lg">
            <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h2 className="text-2xl font-semibold" style={{ color: '#EAEAF0' }}>
                Taux d'échange
              </h2>
              <button onClick={() => setShowExchangeModal(false)} className="p-2 rounded-lg transition-colors" style={{ color: '#9AA0AB' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#9AA0AB' }}>
                  Devise de base
                </label>
                <select
                  value={baseCurrency}
                  onChange={(e) => handleBaseCurrencyChange(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-medium outline-none"
                  style={{
                    backgroundColor: '#0F1115',
                    color: '#EAEAF0',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="AED">AED</option>
                  <option value="DZD">DZD (DA)</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
                <p className="text-xs mb-4" style={{ color: '#9AA0AB' }}>
                  Taux de change par rapport à {baseCurrency}
                </p>

                {getOtherCurrencies().map((currency) => (
                  <div key={currency} className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#9AA0AB' }}>
                      {baseCurrency} → {currency}
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: '#9AA0AB' }}>1 {baseCurrency} =</span>
                      <input
                        type="number"
                        step="any"
                        value={getInputValue(currency)}
                        onChange={(e) => updateRelativeRate(currency, e.target.value)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium outline-none"
                        style={{
                          backgroundColor: '#0F1115',
                          color: '#EAEAF0',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      />
                      <span className="text-sm" style={{ color: '#9AA0AB' }}>{currency}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExchangeModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
                  style={{ backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9AA0AB' }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveExchangeRates}
                  className="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
                  style={{ backgroundColor: '#10B981', color: '#EAEAF0' }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
