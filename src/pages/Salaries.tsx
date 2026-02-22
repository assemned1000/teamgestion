import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { Search } from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  monthly_salary: number;
  declared_salary: number;
  recharge: number;
  monthly_bonus: number;
  status: string;
  hire_date: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export const Salaries = () => {
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name, monthly_salary, declared_salary, recharge, monthly_bonus, status, hire_date')
      .eq('enterprise_id', currentEnterprise.id)
      .eq('status', 'Actif')
      .order('first_name', { ascending: true });

    if (data) setEmployees(data);

    const { data: expensesData } = await supabase
      .from('expenses')
      .select('id, name, amount, date')
      .eq('enterprise_id', currentEnterprise.id)
      .eq('type', 'Professionnel')
      .eq('currency', 'DZD')
      .order('date', { ascending: false });

    if (expensesData) setExpenses(expensesData);

    setLoading(false);
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

  const calculateSalaireLiquide = (emp: Employee) => {
    return emp.monthly_salary - emp.declared_salary;
  };

  const calculateSalaireLiquideProrata = (emp: Employee) => {
    const percentage = calculateWorkPercentage(emp.hire_date);
    return (emp.monthly_salary * percentage) - emp.declared_salary;
  };

  const calculateTotalLiquide = (emp: Employee) => {
    const salaireLiquide = calculateSalaireLiquide(emp);
    return salaireLiquide + emp.recharge + emp.monthly_bonus;
  };

  const calculateTotal = (emp: Employee) => {
    return emp.monthly_salary + emp.recharge + emp.monthly_bonus;
  };

  const calculateTotalLiquideAvecProrata = (emp: Employee) => {
    const salaireLiquideProrata = calculateSalaireLiquideProrata(emp);
    return salaireLiquideProrata + emp.recharge + emp.monthly_bonus;
  };

  const calculateTotalAvecProrata = (emp: Employee) => {
    const totalLiquideAvecProrata = calculateTotalLiquideAvecProrata(emp);
    return totalLiquideAvecProrata + emp.declared_salary;
  };

  const calculateTotalVirement = (emp: Employee) => {
    return emp.declared_salary;
  };

  const getRemarque = (emp: Employee) => {
    const percentage = calculateWorkPercentage(emp.hire_date);
    if (percentage >= 1) {
      return '';
    }

    const hire = new Date(emp.hire_date);
    const today = new Date();

    const isDeepCloserOrOmpleo = currentEnterprise?.slug === 'deep-closer' || currentEnterprise?.slug === 'ompleo';
    const transitionPaymentDate = new Date(2026, 1, 5);
    const isInTransitionPeriod = isDeepCloserOrOmpleo && today >= new Date(2025, 11, 25) && today < transitionPaymentDate;
    const isPostTransition = isDeepCloserOrOmpleo && today >= transitionPaymentDate;

    let periodEndDate: Date;
    let paymentDay: number;

    if (isInTransitionPeriod) {
      periodEndDate = new Date(2026, 1, 1);
      paymentDay = 1;
    } else if (isPostTransition) {
      periodEndDate = new Date(today.getFullYear(), today.getMonth(), 5);
      if (today.getDate() >= 5) {
        periodEndDate.setMonth(periodEndDate.getMonth() + 1);
      }
      paymentDay = 5;
    } else {
      periodEndDate = new Date(today.getFullYear(), today.getMonth(), 25);
      if (today.getDate() > 25) {
        periodEndDate.setMonth(periodEndDate.getMonth() + 1);
      }
      paymentDay = 25;
    }

    const hireFormatted = hire.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const paymentFormatted = `${String(paymentDay).padStart(2, '0')}/${String(periodEndDate.getMonth() + 1).padStart(2, '0')}/${periodEndDate.getFullYear()}`;

    return `Prorata de ${hireFormatted} jusqu'à ${paymentFormatted}`;
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = {
    monthly_salary: filteredEmployees.reduce((sum, emp) => sum + (emp.monthly_salary * calculateWorkPercentage(emp.hire_date)), 0),
    declared_salary: filteredEmployees.reduce((sum, emp) => sum + emp.declared_salary, 0),
    salaire_liquide: filteredEmployees.reduce((sum, emp) => sum + calculateSalaireLiquideProrata(emp), 0),
    recharge: filteredEmployees.reduce((sum, emp) => sum + emp.recharge, 0),
    bonus: filteredEmployees.reduce((sum, emp) => sum + emp.monthly_bonus, 0),
    total_virement: filteredEmployees.reduce((sum, emp) => sum + calculateTotalVirement(emp), 0),
    total_liquide: filteredEmployees.reduce((sum, emp) => sum + calculateTotalLiquide(emp), 0),
    total: filteredEmployees.reduce((sum, emp) => sum + calculateTotal(emp), 0),
    total_liquide_avec_prorata: filteredEmployees.reduce((sum, emp) => sum + calculateTotalLiquideAvecProrata(emp), 0),
    total_avec_prorata: filteredEmployees.reduce((sum, emp) => sum + calculateTotalAvecProrata(emp), 0),
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const grandTotals = {
    monthly_salary: totals.monthly_salary,
    declared_salary: totals.declared_salary,
    salaire_liquide: totals.salaire_liquide,
    recharge: totals.recharge,
    bonus: totals.bonus,
    total_virement: totals.total_virement,
    total_liquide: totals.total_liquide,
    total: totals.total,
    total_liquide_avec_prorata: totals.total_liquide_avec_prorata,
    total_avec_prorata: totals.total_avec_prorata + totalExpenses,
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#EAEAF0' }}>Salaires</h1>
        <p className="text-base" style={{ color: '#9AA0AB' }}>Vue d'ensemble des salaires des employés actifs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-elevated p-6">
          <p className="text-xs font-medium mb-3" style={{ color: '#9AA0AB' }}>SALAIRE DÉCLARÉ</p>
          <p className="text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
            {totals.declared_salary.toLocaleString()} DZD
          </p>
        </div>

        <div className="card-elevated p-6">
          <p className="text-xs font-medium mb-3" style={{ color: '#9AA0AB' }}>TOTAL LIQUIDE</p>
          <p className="text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
            {totals.total_liquide_avec_prorata.toLocaleString()} DZD
          </p>
        </div>

        <div className="card-elevated p-6">
          <p className="text-xs font-medium mb-3" style={{ color: '#9AA0AB' }}>FRAIS ENTREPRISE</p>
          <p className="text-3xl font-semibold mb-1" style={{ color: '#EAEAF0' }}>
            {totalExpenses.toLocaleString()} DZD
          </p>
        </div>

        <div className="card-elevated p-6">
          <p className="text-xs font-medium mb-3" style={{ color: '#9AA0AB' }}>TOTAL</p>
          <p className="text-3xl font-semibold mb-1" style={{ color: '#10B981' }}>
            {grandTotals.total_avec_prorata.toLocaleString()} DZD
          </p>
        </div>
      </div>

      <div className="card-surface p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: '#6B7280' }} />
            <input
              type="text"
              placeholder="Rechercher un employé..."
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
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#3B82F6' }}></div>
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Employé</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Salaire Mensuel</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Salaire Déclaré</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Salaire Liquide</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Rechargement</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Bonus</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Total virement</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Total liquide</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>TOTAL</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Remarque</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => (
                  <tr key={employee.id} style={{ borderBottom: index < filteredEmployees.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none' }}>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#EAEAF0' }}>
                      {employee.first_name} {employee.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-right" style={{ color: '#9AA0AB' }}>
                      {(employee.monthly_salary * calculateWorkPercentage(employee.hire_date)).toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-right" style={{ color: '#9AA0AB' }}>
                      {employee.declared_salary.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium" style={{ color: '#EAEAF0' }}>
                      {calculateSalaireLiquideProrata(employee).toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-right" style={{ color: '#9AA0AB' }}>
                      {employee.recharge.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-right" style={{ color: '#9AA0AB' }}>
                      {employee.monthly_bonus.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-right" style={{ color: '#9AA0AB' }}>
                      {calculateTotalVirement(employee).toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right" style={{ color: '#EAEAF0' }}>
                      {calculateTotalLiquideAvecProrata(employee).toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-right" style={{ color: '#10B981' }}>
                      {calculateTotalAvecProrata(employee).toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm italic" style={{ color: '#9AA0AB' }}>
                      {getRemarque(employee)}
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && expenses.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                      Aucun employé ou dépense trouvé
                    </td>
                  </tr>
                )}

                {expenses.map((expense) => (
                  <tr key={`expense-${expense.id}`} className="bg-surface hover:bg-elevated transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {expense.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-white text-right">-</td>
                    <td className="px-6 py-4 text-sm text-white text-right">-</td>
                    <td className="px-6 py-4 text-sm text-white text-right">-</td>
                    <td className="px-6 py-4 text-sm text-white text-right">-</td>
                    <td className="px-6 py-4 text-sm text-white text-right">-</td>
                    <td className="px-6 py-4 text-sm text-white text-right">-</td>
                    <td className="px-6 py-4 text-sm text-white text-right">-</td>
                    <td className="px-6 py-4 text-sm font-bold text-white text-right">
                      {expense.amount.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-white italic">
                      Dépense professionnelle
                    </td>
                  </tr>
                ))}

                {(filteredEmployees.length > 0 || expenses.length > 0) && (
                  <tr className="bg-gray-700 font-bold">
                    <td className="px-6 py-4 text-sm text-white">TOTAL GÉNÉRAL</td>
                    <td className="px-6 py-4 text-sm text-white text-right">
                      {grandTotals.monthly_salary.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-white text-right">
                      {grandTotals.declared_salary.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-white text-right">
                      {grandTotals.salaire_liquide.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-white text-right">
                      {grandTotals.recharge.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-white text-right">
                      {grandTotals.bonus.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-white text-right">
                      {grandTotals.total_virement.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white text-right">
                      {grandTotals.total_liquide_avec_prorata.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-500 text-right">
                      {grandTotals.total_avec_prorata.toLocaleString()} DZD
                    </td>
                    <td className="px-6 py-4 text-sm text-white"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
