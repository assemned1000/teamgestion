import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EnterpriseProvider, useEnterprise } from './contexts/EnterpriseContext';
import { LoginForm } from './components/Auth/LoginForm';
import { MainLayout } from './components/MainLayout';
import { EnterpriseApp } from './components/EnterpriseApp';
import { MainDashboard } from './pages/MainDashboard';
import { Entreprises } from './pages/Entreprises';
import { Personal } from './pages/Personal';
import { Profile } from './pages/Profile';
import { Users } from './pages/Users';
import { PublicEmployeeForm } from './pages/PublicEmployeeForm';
import { PublicEquipmentView } from './pages/PublicEquipmentView';
import { useState, useEffect } from 'react';

const AppContent = () => {
  const { user, loading, canAccessPage } = useAuth();
  const { enterprises, loading: enterpriseLoading, setCurrentEnterprise } = useEnterprise();
  const [currentTab, setCurrentTab] = useState<string>('');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !enterpriseLoading && user && !currentTab) {
      const availableTabs = ['dashboard', 'entreprises', 'personal', 'users'] as const;
      const firstAccessibleTab = availableTabs.find(tab => canAccessPage(tab));

      if (firstAccessibleTab === 'dashboard' && !canAccessPage('entreprises') && enterprises.length > 0) {
        setCurrentTab('entreprises');
        if (enterprises[0]) {
          setSelectedEntreprise(enterprises[0].slug);
        }
      } else if (firstAccessibleTab) {
        setCurrentTab(firstAccessibleTab);
      }
    }
  }, [loading, enterpriseLoading, user, canAccessPage, currentTab, enterprises]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (!currentTab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    setSelectedEntreprise(null);
    if (tab !== 'entreprises') {
      setCurrentEnterprise(null);
    }
  };

  const handleSelectEntreprise = (entrepriseId: string) => {
    setSelectedEntreprise(entrepriseId);
  };

  const renderContent = () => {
    if (currentTab === 'entreprises' && selectedEntreprise) {
      return <EnterpriseApp enterpriseSlug={selectedEntreprise} />;
    }

    if (currentTab === 'entreprises') {
      return <Entreprises onSelectEntreprise={handleSelectEntreprise} />;
    }

    if (currentTab === 'dashboard') {
      return <MainDashboard />;
    }

    if (currentTab === 'personal') {
      return <Personal />;
    }

    if (currentTab === 'profile') {
      return <Profile />;
    }

    if (currentTab === 'users') {
      return <Users />;
    }

    return null;
  };

  const isInEnterprise = currentTab === 'entreprises' && selectedEntreprise !== null;

  return (
    <MainLayout currentTab={currentTab} onNavigate={handleNavigate} isInEnterprise={isInEnterprise}>
      {renderContent()}
    </MainLayout>
  );
};

function App() {
  const [publicRoute, setPublicRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      if (path === '/public-employee-form') {
        setPublicRoute('employee');
      } else if (path === '/equipment-view') {
        setPublicRoute('equipment');
      } else {
        setPublicRoute(null);
      }
    };
    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  if (publicRoute === 'employee') {
    return <PublicEmployeeForm />;
  }

  if (publicRoute === 'equipment') {
    return <PublicEquipmentView />;
  }

  return (
    <AuthProvider>
      <EnterpriseProvider>
        <AppContent />
      </EnterpriseProvider>
    </AuthProvider>
  );
}

export default App;
