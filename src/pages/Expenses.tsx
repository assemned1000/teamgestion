import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

interface Expense {
  id: string;
  date: string;
  type: 'Personnel' | 'Professionnel';
  name: string;
  category: string | null;
  amount: number;
  currency: string;
  description: string | null;
  file_url: string | null;
  employee_id: string | null;
  client_id: string | null;
  payment_method: string | null;
  payment_date: string | null;
  is_paid: boolean;
}

export const Expenses = () => {
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState(() =>
    localStorage.getItem('expenses_displayCurrency') || 'dzd'
  );
  const [tableCurrency, setTableCurrency] = useState(() =>
    localStorage.getItem('expenses_tableCurrency') || 'default'
  );
  const [exchangeRates, setExchangeRates] = useState({
    eur_dzd: 140,
    usd_dzd: 133,
    aed_dzd: 36,
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Professionnel' as 'Personnel' | 'Professionnel',
    name: '',
    amount: 0,
    currency: 'DZD',
    description: '',
    payment_method: 'cash',
    payment_date: '',
    is_paid: false,
  });

  useEffect(() => {
    localStorage.setItem('expenses_displayCurrency', displayCurrency);
  }, [displayCurrency]);

  useEffect(() => {
    localStorage.setItem('expenses_tableCurrency', tableCurrency);
  }, [tableCurrency]);

  useEffect(() => {
    if (!enterpriseLoading) {
      if (currentEnterprise) {
        loadData();
        loadExchangeRates();
      } else {
        setLoading(false);
      }
    }
  }, [currentEnterprise?.id, enterpriseLoading]);

  const loadExchangeRates = async () => {
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setExchangeRates({
        eur_dzd: data.eur_dzd,
        usd_dzd: data.usd_dzd,
        aed_dzd: data.aed_dzd,
      });
    }
  };

  const loadData = async () => {
    if (!currentEnterprise) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('enterprise_id', currentEnterprise.id)
      .order('date', { ascending: false });

    if (expensesData) setExpenses(expensesData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentEnterprise) {
      alert('Aucune entreprise sélectionnée');
      return;
    }

    const data = {
      ...formData,
      date: formData.payment_date || new Date().toISOString().split('T')[0],
      file_url: null,
      enterprise_id: currentEnterprise.id,
      payment_date: formData.payment_date || null,
    };

    if (editingExpense) {
      const { error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', editingExpense.id);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('expenses').insert(data);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingExpense(null);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    loadData();
  };

  const togglePaidStatus = async (expense: Expense) => {
    const { error } = await supabase
      .from('expenses')
      .update({ is_paid: !expense.is_paid })
      .eq('id', expense.id);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    loadData();
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      type: expense.type,
      name: expense.name,
      amount: expense.amount,
      currency: expense.currency || 'DZD',
      description: expense.description || '',
      payment_method: expense.payment_method || 'cash',
      payment_date: expense.payment_date || '',
      is_paid: expense.is_paid || false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Professionnel',
      name: '',
      amount: 0,
      currency: 'DZD',
      description: '',
      payment_method: 'cash',
      payment_date: '',
      is_paid: false,
    });
  };

  const getCurrencyDisplay = (currency: string): string => {
    const curr = currency?.toUpperCase() || 'DZD';
    if (curr === 'EUR') return 'EUR';
    if (curr === 'USD') return 'USD';
    if (curr === 'AED') return 'AED';
    return 'DZD';
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;

    const fromCurr = fromCurrency?.toLowerCase() || 'dzd';
    const toCurr = toCurrency?.toLowerCase() || 'dzd';

    const toDZD = (amt: number, currency: string): number => {
      if (currency === 'dzd') return amt;
      if (currency === 'eur') return amt * exchangeRates.eur_dzd;
      if (currency === 'usd') return amt * exchangeRates.usd_dzd;
      if (currency === 'aed') return amt * exchangeRates.aed_dzd;
      return amt;
    };

    const fromDZD = (amt: number, currency: string): number => {
      if (currency === 'dzd') return amt;
      if (currency === 'eur') return amt / exchangeRates.eur_dzd;
      if (currency === 'usd') return amt / exchangeRates.usd_dzd;
      if (currency === 'aed') return amt / exchangeRates.aed_dzd;
      return amt;
    };

    const amountInDZD = toDZD(amount, fromCurr);
    return fromDZD(amountInDZD, toCurr);
  };

  const getTableAmount = (expense: Expense) => {
    if (tableCurrency === 'default') {
      return {
        amount: expense.amount,
        currency: getCurrencyDisplay(expense.currency)
      };
    }
    const convertedAmount = convertCurrency(expense.amount, expense.currency?.toLowerCase() || 'dzd', tableCurrency);
    return {
      amount: convertedAmount,
      currency: getCurrencyDisplay(tableCurrency)
    };
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = expense.type === 'Professionnel';
    return matchesSearch && matchesType;
  });

  const totalInDisplayCurrency = filteredExpenses.reduce((sum, expense) => {
    const expenseCurrency = expense.currency?.toLowerCase() || 'dzd';
    const convertedAmount = convertCurrency(expense.amount, expenseCurrency, displayCurrency);
    return sum + convertedAmount;
  }, 0);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#EAEAF0' }}>Dépenses Professionnelles</h1>
          <p className="text-base" style={{ color: '#9AA0AB' }}>Gestion des dépenses professionnelles</p>
        </div>
        <select
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value)}
          className="px-4 py-2.5 text-sm font-medium outline-none"
          style={{
            backgroundColor: '#1A1D24',
            color: '#EAEAF0',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <option value="dzd">DZD (DA)</option>
          <option value="eur">EUR (€)</option>
          <option value="usd">USD ($)</option>
          <option value="aed">AED</option>
        </select>
      </div>

      <div className="card-elevated p-8 mb-8">
        <p className="text-xs font-medium mb-2" style={{ color: '#9AA0AB' }}>TOTAL DES DÉPENSES</p>
        <p className="text-5xl font-semibold mb-3" style={{ color: '#EAEAF0' }}>
          {totalInDisplayCurrency.toLocaleString()} {getCurrencyDisplay(displayCurrency)}
        </p>
        <p className="text-sm" style={{ color: '#9AA0AB' }}>{filteredExpenses.length} dépense(s) professionnelle(s)</p>
      </div>

      <div className="card-surface p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: '#6B7280' }} />
            <input
              type="text"
              placeholder="Rechercher..."
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
          <button
            onClick={() => {
              resetForm();
              setEditingExpense(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
            style={{ backgroundColor: '#6B7280', color: '#EAEAF0' }}
          >
            <Plus size={18} />
            Nouvelle Dépense
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#3B82F6' }}></div>
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="p-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: '#EAEAF0' }}>Liste des dépenses</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#9AA0AB' }}>Afficher en:</span>
                <select
                  value={tableCurrency}
                  onChange={(e) => setTableCurrency(e.target.value)}
                  className="px-3 py-1.5 text-sm outline-none"
                  style={{
                    backgroundColor: '#0F1115',
                    color: '#EAEAF0',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <option value="default">Devise d'origine</option>
                  <option value="dzd">DZD</option>
                  <option value="eur">EUR</option>
                  <option value="usd">USD</option>
                  <option value="aed">AED</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Paiement</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Date Paiement</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Montant</th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr key={expense.id} style={{ borderBottom: index < filteredExpenses.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none' }}>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#EAEAF0' }}>{expense.name}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#9AA0AB' }}>{expense.description || '-'}</td>
                    <td className="px-6 py-4 text-sm capitalize" style={{ color: '#9AA0AB' }}>
                      {expense.payment_method === 'virement bancaire' ? 'Virement' : 'Cash'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#9AA0AB' }}>
                      {expense.payment_date ? new Date(expense.payment_date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right" style={{ color: '#EAEAF0' }}>
                      {(() => {
                        const { amount, currency } = getTableAmount(expense);
                        return `${amount.toLocaleString()} ${currency}`;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => togglePaidStatus(expense)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          expense.is_paid
                            ? 'text-green-100 hover:opacity-80'
                            : 'text-red-100 hover:opacity-80'
                        }`}
                        style={{ backgroundColor: expense.is_paid ? '#10B981' : '#EF4444' }}
                      >
                        {expense.is_paid ? 'Payé' : 'Non payé'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-2 rounded-lg transition-colors hover:opacity-80"
                          style={{ color: '#9AA0AB' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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

            {filteredExpenses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">Aucune dépense</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-elevated bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Loyer bureau, Déplacement Paris, Formation équipe..."
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-elevated text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Date de Paiement *</label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-elevated text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Montant *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-elevated text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Devise *</label>
                  <select
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-elevated text-white"
                  >
                    <option value="DZD">DZD</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Moyen de Paiement *</label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-elevated text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="virement bancaire">Virement bancaire</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_paid}
                      onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-elevated text-gray-600 focus:ring-2 focus:ring-gray-500"
                    />
                    <span className="text-sm font-medium text-gray-200">Dépense payée</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Détails supplémentaires..."
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-elevated text-white"
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
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {editingExpense ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
