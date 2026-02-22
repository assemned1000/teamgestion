import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { Layout } from './Layout';
import { Dashboard } from '../pages/Dashboard';
import { Clients } from '../pages/Clients';
import { Employees } from '../pages/Employees';
import { Equipment } from '../pages/Equipment';
import { Salaries } from '../pages/Salaries';
import { Expenses } from '../pages/Expenses';
import { PersonalExpenses } from '../pages/PersonalExpenses';
import { Organization } from '../pages/Organization';

interface EnterpriseAppProps {
  enterpriseSlug: string;
}

const availablePages = [
  { path: 'dashboard', module: 'dashboard' },
  { path: 'employees', module: 'employees' },
  { path: 'clients', module: 'clients' },
  { path: 'equipment', module: 'equipment' },
  { path: 'salaries', module: 'salaries' },
  { path: 'expenses-professional', module: 'expenses_professional' },
  { path: 'expenses-personal', module: 'expenses_personal' },
  { path: 'organization', module: 'organization' },
];

const ENTERPRISE_AVAILABLE_MODULES: Record<string, string[]> = {
  'deep-closer': ['dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization'],
  'ompleo': ['dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization'],
  'dubai': ['dashboard', 'clients', 'expenses_professional'],
};

export const EnterpriseApp = ({ enterpriseSlug }: EnterpriseAppProps) => {
  const { can } = useAuth();
  const { currentEnterprise, setCurrentEnterprise, getEnterpriseBySlug, enterprises, loading } = useEnterprise();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (!loading && enterprises.length > 0) {
      const enterprise = getEnterpriseBySlug(enterpriseSlug);
      if (enterprise && (!currentEnterprise || currentEnterprise.slug !== enterpriseSlug)) {
        setCurrentEnterprise(enterprise);
      }
    }
  }, [enterpriseSlug, loading, enterprises, getEnterpriseBySlug, setCurrentEnterprise, currentEnterprise]);

  useEffect(() => {
    if (currentEnterprise && currentEnterprise.slug === enterpriseSlug) {
      const availableModules = ENTERPRISE_AVAILABLE_MODULES[enterpriseSlug] || [];
      const accessiblePages = availablePages.filter(page =>
        availableModules.includes(page.module) && can(page.module, 'read', currentEnterprise.id)
      );

      if (accessiblePages.length > 0) {
        const currentPageAccessible = accessiblePages.some(page => page.path === currentPage);
        if (!currentPageAccessible) {
          setCurrentPage(accessiblePages[0].path);
        }
      }
    }
  }, [currentEnterprise, enterpriseSlug, can, currentPage]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  if (loading || !currentEnterprise || currentEnterprise.slug !== enterpriseSlug) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#3B82F6' }}></div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <Employees />;
      case 'clients':
        return <Clients />;
      case 'equipment':
        return <Equipment />;
      case 'salaries':
        return <Salaries />;
      case 'expenses-professional':
        return <Expenses />;
      case 'expenses-personal':
        return <PersonalExpenses />;
      case 'organization':
        return <Organization />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handlePageChange}
    >
      {renderPage()}
    </Layout>
  );
};
