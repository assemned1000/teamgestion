import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { Euro, Users, Briefcase, DollarSign, Monitor, TrendingUp } from 'lucide-react';

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

  managementFeesDZD: number;
  professionalExpensesDZD: number;
  personalExpensesDZD: number;

  clientRevenueEUR: number;
  professionalExpensesEUR: number;
  personalExpensesEUR: number;
  salariesEUR: number;
  operatingCostsEUR: number;

  netProfitEUR: number;

  totalClientRevenueWithoutProrata: number;
  totalClientRevenueWithProrata: number;
  paidClientRevenue: number;
}

export const Dashboard = () => {
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalClients: 0,
    totalEquipment: 0,
    assignedEquipment: 0,
    managementFeesDZD: 0,
    professionalExpensesDZD: 0,
    personalExpensesDZD: 0,
    clientRevenueEUR: 0,
    professionalExpensesEUR: 0,
    personalExpensesEUR: 0,
    salariesEUR: 0,
    operatingCostsEUR: 0,
    netProfitEUR: 0,
    totalClientRevenueWithoutProrata: 0,
    totalClientRevenueWithProrata: 0,
    paidClientRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    eur_dzd: 140,
    usd_dzd: 133,
    aed_dzd: 36,
  });
  const [currencies, setCurrencies] = useState(() => {
    const saved = localStorage.getItem(`dashboard_currencies_${currentEnterprise?.id || 'default'}`);
    return saved ? JSON.parse(saved) : {
      revenue: 'EUR',
      salaries: 'EUR',
      expenses: 'EUR',
      operatingCosts: 'EUR',
      netProfit: 'EUR',
    };
  });

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (currentEnterprise) {
      localStorage.setItem(`dashboard_currencies_${currentEnterprise.id}`, JSON.stringify(currencies));
    }
  }, [currencies, currentEnterprise?.id]);

  useEffect(() => {
    if (!enterpriseLoading) {
      if (selectedMonth && currentEnterprise) {
        loadDashboardData();
      } else if (selectedMonth) {
        setLoading(false);
      }
    }
  }, [selectedMonth, currentEnterprise?.id, enterpriseLoading]);

  const convertFromEUR = (amountEUR: number, targetCurrency: string): number => {
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

  const calculateWorkPercentage = (hireDate: string) => {
    const hire = new Date(hireDate);
    const today = new Date();

    const isDeepCloserOrOmpleo = currentEnterprise?.slug === 'deep-closer' || currentEnterprise?.slug === 'ompleo';
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

  const calculateTotalAvecProrata = (employee: any) => {
    const percentage = calculateWorkPercentage(employee.hire_date);
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
    if (!currentEnterprise) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [
      employeesRes,
      clientsRes,
      equipmentRes,
      expensesRes,
      ratesRes,
      clientCostsRes,
      settingsRes,
    ] = await Promise.all([
      supabase.from('employees').select('*').eq('enterprise_id', currentEnterprise.id),
      supabase.from('clients').select('*').eq('enterprise_id', currentEnterprise.id),
      supabase.from('equipment').select('*').eq('enterprise_id', currentEnterprise.id),
      supabase.from('expenses').select('*').eq('enterprise_id', currentEnterprise.id),
      supabase.from('employee_client_rates').select('*').eq('enterprise_id', currentEnterprise.id),
      supabase.from('client_costs').select('*').eq('enterprise_id', currentEnterprise.id),
      supabase.from('settings').select('key, value').in('key', ['exchange_rate_eur_dzd', 'exchange_rate_usd_dzd', 'exchange_rate_aed_dzd']),
    ]);

    const employees = employeesRes.data || [];
    const clients = clientsRes.data || [];
    const equipment = equipmentRes.data || [];
    const expenses = expensesRes.data || [];
    const rates = ratesRes.data || [];
    const clientCosts = clientCostsRes.data || [];

    const currentRates: ExchangeRates = {
      eur_dzd: 140,
      usd_dzd: 133,
      aed_dzd: 36,
    };

    if (settingsRes.data) {
      settingsRes.data.forEach((setting) => {
        if (setting.key === 'exchange_rate_eur_dzd') {
          currentRates.eur_dzd = parseFloat(setting.value);
        } else if (setting.key === 'exchange_rate_usd_dzd') {
          currentRates.usd_dzd = parseFloat(setting.value);
        } else if (setting.key === 'exchange_rate_aed_dzd') {
          currentRates.aed_dzd = parseFloat(setting.value);
        }
      });
    }

    setExchangeRates(currentRates);

    const activeEmployees = employees.filter(e => e.status === 'Actif');
    const assignedEquipment = equipment.filter(e => e.status === 'Assigné');

    const monthlySalariesDZD = activeEmployees.reduce((sum, emp) => sum + calculateTotalAvecProrata(emp), 0);

    const convertToEUR = (amount: number, currency: string) => {
      if (currency === 'EUR') return amount;
      if (currency === 'DZD') return amount / currentRates.eur_dzd;
      if (currency === 'USD') return amount * (currentRates.usd_dzd / currentRates.eur_dzd);
      if (currency === 'AED') return amount * (currentRates.aed_dzd / currentRates.eur_dzd);
      return amount;
    };

    const convertToDZD = (amount: number, currency: string) => {
      if (currency === 'DZD') return amount;
      if (currency === 'EUR') return amount * currentRates.eur_dzd;
      if (currency === 'USD') return amount * currentRates.usd_dzd;
      if (currency === 'AED') return amount * currentRates.aed_dzd;
      return amount;
    };

    const professionalExpenses = expenses.filter(e => e.type === 'Professionnel');
    const personalExpenses = expenses.filter(e => e.type === 'Personnel');

    const professionalExpensesDZD = professionalExpenses.reduce((sum, e) => sum + convertToDZD(e.amount, e.currency), 0);
    const personalExpensesDZD = personalExpenses.reduce((sum, e) => sum + convertToDZD(e.amount, e.currency), 0);

    const professionalExpensesEUR = professionalExpenses.reduce((sum, e) => sum + convertToEUR(e.amount, e.currency), 0);
    const personalExpensesEUR = personalExpenses.reduce((sum, e) => sum + convertToEUR(e.amount, e.currency), 0);

    const managementFeesDZD = monthlySalariesDZD + professionalExpensesDZD;

    const clientRevenueEUR = clients.reduce((sum, client) => {
      const clientEmployees = employees.filter(emp => {
        const empRates = rates.filter(r => r.client_id === client.id && r.employee_id === emp.id);
        return empRates.length > 0;
      });

      const employeesRevenueEUR = clientEmployees.reduce((empSum, emp) => {
        const rate = rates.find(r => r.employee_id === emp.id && r.client_id === client.id);
        if (!rate) return empSum;

        if (!client.payment_date) {
          return empSum + rate.monthly_rate;
        }

        const prorata = calculateProrata(rate.start_date, client.payment_date, rate.end_date);
        return empSum + (rate.monthly_rate * prorata);
      }, 0);

      const additionalCosts = clientCosts
        .filter(cost => cost.client_id === client.id)
        .reduce((costSum, cost) => costSum + cost.price, 0);
      const revenueEUR = employeesRevenueEUR + additionalCosts;
      return sum + revenueEUR;
    }, 0);

    const managementFeesEUR = managementFeesDZD / currentRates.eur_dzd;
    const salariesEUR = monthlySalariesDZD / currentRates.eur_dzd;
    const operatingCostsEUR = (monthlySalariesDZD + professionalExpensesDZD) / currentRates.eur_dzd;
    const netProfitEUR = clientRevenueEUR - managementFeesEUR;

    const totalClientRevenueWithoutProrata = clients.reduce((sum, client) => {
      const clientEmployees = employees.filter(emp => {
        const empRates = rates.filter(r => r.client_id === client.id && r.employee_id === emp.id);
        return empRates.length > 0;
      });

      const employeesRevenueEUR = clientEmployees.reduce((empSum, emp) => {
        const rate = rates.find(r => r.employee_id === emp.id && r.client_id === client.id);
        if (!rate) return empSum;
        return empSum + rate.monthly_rate;
      }, 0);

      const additionalCosts = clientCosts
        .filter(cost => cost.client_id === client.id)
        .reduce((costSum, cost) => costSum + cost.price, 0);
      return sum + employeesRevenueEUR + additionalCosts;
    }, 0);

    const totalClientRevenueWithProrata = clientRevenueEUR;

    const paidClientRevenue = clients.reduce((sum, client) => {
      if (!client.is_paid) return sum;

      const clientEmployees = employees.filter(emp => {
        const empRates = rates.filter(r => r.client_id === client.id && r.employee_id === emp.id);
        return empRates.length > 0;
      });

      const employeesRevenueEUR = clientEmployees.reduce((empSum, emp) => {
        const rate = rates.find(r => r.employee_id === emp.id && r.client_id === client.id);
        if (!rate) return empSum;

        if (!client.payment_date) {
          return empSum + rate.monthly_rate;
        }

        const prorata = calculateProrata(rate.start_date, client.payment_date, rate.end_date);
        return empSum + (rate.monthly_rate * prorata);
      }, 0);

      const additionalCosts = clientCosts
        .filter(cost => cost.client_id === client.id)
        .reduce((costSum, cost) => costSum + cost.price, 0);
      return sum + employeesRevenueEUR + additionalCosts;
    }, 0);

    setStats({
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      totalClients: clients.length,
      totalEquipment: equipment.length,
      assignedEquipment: assignedEquipment.length,
      managementFeesDZD,
      professionalExpensesDZD,
      personalExpensesDZD,
      clientRevenueEUR,
      professionalExpensesEUR,
      personalExpensesEUR,
      salariesEUR,
      operatingCostsEUR,
      netProfitEUR,
      totalClientRevenueWithoutProrata,
      totalClientRevenueWithProrata,
      paidClientRevenue,
    });

    setLoading(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#EAEAF0' }}>Dashboard</h1>
          <p className="text-base" style={{ color: '#9AA0AB' }}>Vue d'ensemble de l'entreprise{currentEnterprise ? ` - ${currentEnterprise.name}` : ''}</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2.5 text-sm font-medium outline-none"
          style={{
            backgroundColor: '#1A1D24',
            color: '#EAEAF0',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6B7280' }}></div>
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${currentEnterprise?.slug === 'dubai' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-6`}>
          <div className="card-elevated p-6">
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
            <p className="text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
              {convertFromEUR(stats.totalClientRevenueWithProrata, currencies.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.revenue)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Euro size={14} style={{ color: '#9CA3AF' }} />
              <span className="text-xs" style={{ color: '#9AA0AB' }}>Client revenue</span>
            </div>
          </div>

          {currentEnterprise?.slug !== 'dubai' && (
            <>
              <div className="card-elevated p-6">
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
                <p className="text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                  {convertFromEUR(stats.salariesEUR, currencies.salaries).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.salaries)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Users size={14} style={{ color: '#F59E0B' }} />
                  <span className="text-xs" style={{ color: '#9AA0AB' }}>{stats.activeEmployees} employés</span>
                </div>
              </div>

              <div className="card-elevated p-6">
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
                <p className="text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                  {convertFromEUR(stats.professionalExpensesEUR, currencies.expenses).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.expenses)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Briefcase size={14} style={{ color: '#EF4444' }} />
                  <span className="text-xs" style={{ color: '#9AA0AB' }}>Professionnel</span>
                </div>
              </div>

              <div className="card-elevated p-6">
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
                <p className="text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                  {convertFromEUR(stats.operatingCostsEUR, currencies.operatingCosts).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.operatingCosts)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <DollarSign size={14} style={{ color: '#6B7280' }} />
                  <span className="text-xs" style={{ color: '#9AA0AB' }}>Opérationnel</span>
                </div>
              </div>
            </>
          )}

          {currentEnterprise?.slug === 'dubai' && (
            <>
              <div className="card-elevated p-6">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>FRAIS TOTAUX</p>
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
                <p className="text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
                  {convertFromEUR(stats.professionalExpensesEUR, currencies.expenses).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.expenses)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Briefcase size={14} style={{ color: '#EF4444' }} />
                  <span className="text-xs" style={{ color: '#9AA0AB' }}>Dépenses professionnelles</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Benefice Net - separate row */}
        <div className="mt-6">
          <div className={`p-8 rounded-2xl ${stats.netProfitEUR >= 0 ? 'glow-positive' : 'glow-warning'}`} style={{ background: 'linear-gradient(135deg, #1E212A 0%, #181B22 100%)' }}>
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
                <p className="text-6xl font-bold mb-3" style={{ color: stats.netProfitEUR >= 0 ? '#10B981' : '#F59E0B' }}>
                  {convertFromEUR(stats.netProfitEUR, currencies.netProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(currencies.netProfit)}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: '#9AA0AB' }}>
                    Marge: <span className="font-semibold" style={{ color: '#EAEAF0' }}>
                      {stats.totalClientRevenueWithProrata > 0 ? ((stats.netProfitEUR / stats.totalClientRevenueWithProrata) * 100).toFixed(1) : 0}%
                    </span>
                  </span>
                </div>
              </div>
              <div className="hidden lg:block">
                <TrendingUp size={80} style={{ color: stats.netProfitEUR >= 0 ? '#10B981' : '#F59E0B', opacity: 0.2 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats cards for Deep Closer and Ompleo */}
        {!loading && currentEnterprise?.slug !== 'dubai' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>EMPLOYÉS ACTIFS</p>
                  <p className="text-3xl font-semibold mt-2" style={{ color: '#EAEAF0' }}>{stats.activeEmployees}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                  <Users size={24} style={{ color: '#F97316' }} />
                </div>
              </div>
            </div>

            <div className="card-elevated p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>CLIENTS ACTIFS</p>
                  <p className="text-3xl font-semibold mt-2" style={{ color: '#EAEAF0' }}>{stats.totalClients}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <Briefcase size={24} style={{ color: '#10B981' }} />
                </div>
              </div>
            </div>

            <div className="card-elevated p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#9AA0AB' }}>ÉQUIPEMENTS ASSIGNÉS</p>
                  <p className="text-3xl font-semibold mt-2" style={{ color: '#EAEAF0' }}>{stats.assignedEquipment}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <Monitor size={24} style={{ color: '#3B82F6' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
};
