import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

interface Expense {
  id: string;
  date: string;
  type: 'Personnel' | 'Professionnel';
  name: string;
  category: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_date: string | null;
  is_paid: boolean;
  description: string | null;
  file_url: string | null;
  employee_id: string | null;
  client_id: string | null;
}

export const Personal = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState(() =>
    localStorage.getItem('personal_displayCurrency') || 'dzd'
  );
  const [tableCurrency, setTableCurrency] = useState(() =>
    localStorage.getItem('personal_tableCurrency') || 'default'
  );
  const [exchangeRates, setExchangeRates] = useState({
    eur_dzd: 140,
    usd_dzd: 133,
    aed_dzd: 36,
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Personnel' as 'Personnel' | 'Professionnel',
    name: '',
    amount: 0,
    currency: 'DZD',
    payment_method: 'cash',
    payment_date: '',
    is_paid: false,
    description: '',
  });

  useEffect(() => {
    localStorage.setItem('personal_displayCurrency', displayCurrency);
  }, [displayCurrency]);

  useEffect(() => {
    localStorage.setItem('personal_tableCurrency', tableCurrency);
  }, [tableCurrency]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [expensesRes, settingsRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false }),
      supabase.from('settings').select('key, value').in('key', ['exchange_rate_eur_dzd', 'exchange_rate_usd_dzd', 'exchange_rate_aed_dzd']),
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data);

    if (settingsRes.data) {
      const eurRate = settingsRes.data.find(s => s.key === 'exchange_rate_eur_dzd');
      const usdRate = settingsRes.data.find(s => s.key === 'exchange_rate_usd_dzd');
      const aedRate = settingsRes.data.find(s => s.key === 'exchange_rate_aed_dzd');

      setExchangeRates({
        eur_dzd: eurRate ? parseFloat(eurRate.value) : 140,
        usd_dzd: usdRate ? parseFloat(usdRate.value) : 133,
        aed_dzd: aedRate ? parseFloat(aedRate.value) : 36,
      });
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      date: formData.payment_date || new Date().toISOString().split('T')[0],
      file_url: null,
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

  const togglePaymentStatus = async (expense: Expense) => {
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
      payment_method: expense.payment_method || 'cash',
      payment_date: expense.payment_date || '',
      is_paid: expense.is_paid || false,
      description: expense.description || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Personnel',
      name: '',
      amount: 0,
      currency: 'DZD',
      payment_method: 'cash',
      payment_date: '',
      is_paid: false,
      description: '',
    });
  };

  const getCurrencyDisplay = (currency: string) => {
    const curr = currency?.toUpperCase();
    if (curr === 'DZD') return 'DZD';
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
    const matchesType = expense.type === 'Personnel';
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
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#EAEAF0' }}>Dépenses Personnelles</h1>
          <p className="text-base" style={{ color: '#9AA0AB' }}>Gestion des dépenses personnelles</p>
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
        <p className="text-sm" style={{ color: '#9AA0AB' }}>{filteredExpenses.length} dépense(s) personnelle(s)</p>
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
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Date de paiement</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Montant</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr key={expense.id} style={{ borderBottom: index < filteredExpenses.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none' }}>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#EAEAF0' }}>{expense.name}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#9AA0AB' }}>{expense.description || '-'}</td>
                    <td className="px-6 py-4 text-sm capitalize" style={{ color: '#9AA0AB' }}>{expense.payment_method || 'cash'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#9AA0AB' }}>
                      {expense.payment_date ? new Date(expense.payment_date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => togglePaymentStatus(expense)}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                        style={{
                          backgroundColor: expense.is_paid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: expense.is_paid ? '#22C55E' : '#EF4444',
                          border: `1px solid ${expense.is_paid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = expense.is_paid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = expense.is_paid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                        }}
                      >
                        {expense.is_paid ? 'Payé' : 'Non payé'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right" style={{ color: '#EAEAF0' }}>
                      {(() => {
                        const { amount, currency } = getTableAmount(expense);
                        return `${amount.toLocaleString()} ${currency}`;
                      })()}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: '#1b1e26', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div className="sticky top-0 p-6 flex justify-between items-center" style={{ backgroundColor: '#1b1e26', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h2 className="text-2xl font-semibold" style={{ color: '#EAEAF0' }}>
                {editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg transition-colors" style={{ color: '#9AA0AB' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6" style={{ backgroundColor: '#1b1e26' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#EAEAF0' }}>Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Courses, Restaurant, Loisirs..."
                    className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
                    style={{
                      backgroundColor: '#0F1115',
                      color: '#EAEAF0',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#EAEAF0' }}>Montant *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
                    style={{
                      backgroundColor: '#0F1115',
                      color: '#EAEAF0',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#EAEAF0' }}>Devise *</label>
                  <select
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
                    style={{
                      backgroundColor: '#0F1115',
                      color: '#EAEAF0',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <option value="DZD">DZD</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#EAEAF0' }}>Moyen de paiement *</label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
                    style={{
                      backgroundColor: '#0F1115',
                      color: '#EAEAF0',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <option value="cash">Cash</option>
                    <option value="virement bancaire">Virement bancaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#EAEAF0' }}>Date de paiement *</label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
                    style={{
                      backgroundColor: '#0F1115',
                      color: '#EAEAF0',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#EAEAF0' }}>Statut de paiement</label>
                  <div className="flex items-center gap-4 h-10">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_paid: false })}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                      style={{
                        backgroundColor: !formData.is_paid ? '#EF4444' : '#2A2D35',
                        color: !formData.is_paid ? '#FFFFFF' : '#9AA0AB'
                      }}
                    >
                      Non payé
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_paid: true })}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                      style={{
                        backgroundColor: formData.is_paid ? '#22C55E' : '#2A2D35',
                        color: formData.is_paid ? '#FFFFFF' : '#9AA0AB'
                      }}
                    >
                      Payé
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#EAEAF0' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Détails supplémentaires..."
                    className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
                    style={{
                      backgroundColor: '#0F1115',
                      color: '#EAEAF0',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: '#2A2D35',
                    color: '#EAEAF0',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF'
                  }}
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
