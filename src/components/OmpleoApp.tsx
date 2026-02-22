import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { Layout } from './Layout';
import { Dashboard } from '../pages/Dashboard';
import { Employees } from '../pages/Employees';
import { Clients } from '../pages/Clients';
import { Equipment } from '../pages/Equipment';
import { Salaries } from '../pages/Salaries';
import { Expenses } from '../pages/Expenses';
import { PersonalExpenses } from '../pages/PersonalExpenses';
import { Organization } from '../pages/Organization';

const availablePages = [
  { path: 'dashboard', module: 'dashboard' },
  { path: 'employees', module: 'employees' },
  { path: 'clients', module: 'clients' },
  { path: 'equipment', module: 'equipment' },
  { path: 'salaries', module: 'salaries' },
  { path: 'expenses-professional', module: 'expenses_professional' },
  { path: 'organization', module: 'organization' },
];

const OMPLEO_MODULES = ['dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization'];

export const OmpleoApp = () => {
  const { can } = useAuth();
  const { currentEnterprise, setCurrentEnterprise, getEnterpriseBySlug, enterprises, loading } = useEnterprise();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (!loading && enterprises.length > 0) {
      const enterprise = getEnterpriseBySlug('ompleo');
      if (enterprise) {
        setCurrentEnterprise(enterprise);
      }
    }
  }, [loading, enterprises, getEnterpriseBySlug, setCurrentEnterprise]);

  useEffect(() => {
    if (currentEnterprise) {
      const accessiblePages = availablePages.filter(page =>
        OMPLEO_MODULES.includes(page.module) && can(page.module, 'read', currentEnterprise.id)
      );

      if (accessiblePages.length > 0) {
        const currentPageAccessible = accessiblePages.some(page => page.path === currentPage);
        if (!currentPageAccessible) {
          setCurrentPage(accessiblePages[0].path);
        }
      }
    }
  }, [currentEnterprise, can, currentPage]);

  const hasAccess = (module: string): boolean => {
    return currentEnterprise ? can(module, 'read', currentEnterprise.id) : false;
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return hasAccess('dashboard') ? <Dashboard /> : <Dashboard />;
      case 'employees':
        return hasAccess('employees') ? <Employees /> : <div className="p-8 text-white">Accès refusé</div>;
      case 'clients':
        return hasAccess('clients') ? <Clients /> : <div className="p-8 text-white">Accès refusé</div>;
      case 'equipment':
        return hasAccess('equipment') ? <Equipment /> : <div className="p-8 text-white">Accès refusé</div>;
      case 'salaries':
        return hasAccess('salaries') ? <Salaries /> : <div className="p-8 text-white">Accès refusé</div>;
      case 'expenses-professional':
        return hasAccess('expenses_professional') ? <Expenses /> : <div className="p-8 text-white">Accès refusé</div>;
      case 'expenses-personal':
        return hasAccess('expenses_personal') ? <PersonalExpenses /> : <div className="p-8 text-white">Accès refusé</div>;
      case 'organization':
        return hasAccess('organization') ? <Organization /> : <div className="p-8 text-white">Accès refusé</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout onNavigate={setCurrentPage} currentPage={currentPage}>
      {renderPage()}
    </Layout>
  );
};
