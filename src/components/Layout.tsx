import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEnterprise } from '../contexts/EnterpriseContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  DollarSign,
  FileText,
  Network,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Layout = ({ children, onNavigate, currentPage }: LayoutProps) => {
  const { can } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ENTERPRISE_MODULES: Record<string, string[]> = {
    'deep-closer': ['dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization'],
    'ompleo': ['dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization'],
    'dubai': ['dashboard', 'clients', 'expenses_professional'],
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard', module: 'dashboard' },
    { icon: Users, label: 'Employés', path: 'employees', module: 'employees' },
    { icon: Briefcase, label: 'Clients', path: 'clients', module: 'clients' },
    { icon: Package, label: 'Matériel', path: 'equipment', module: 'equipment' },
    { icon: DollarSign, label: 'Salaires', path: 'salaries', module: 'salaries' },
    { icon: FileText, label: 'Dépenses Professionnelles', path: 'expenses-professional', module: 'expenses_professional' },
    { icon: Network, label: 'Organisation', path: 'organization', module: 'organization' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!currentEnterprise) return false;

    const enterpriseModules = ENTERPRISE_MODULES[currentEnterprise.slug] || [];
    const isModuleAllowedForEnterprise = enterpriseModules.includes(item.module);
    const hasPermission = can(item.module, 'read', currentEnterprise.id);

    return isModuleAllowedForEnterprise && hasPermission;
  });

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#0F1115' }}>
      <aside className={`${sidebarOpen ? 'w-80' : 'w-20'} text-white transition-all duration-300 flex-col hidden lg:flex`} style={{ backgroundColor: '#12141A', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="p-4 flex flex-col items-center" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {sidebarOpen ? (
            currentEnterprise?.logo_url ? (
              <img src={currentEnterprise.logo_url} alt={`${currentEnterprise.name} Logo`} className="w-20 h-20 object-contain mb-3" />
            ) : (
              <img src="/56team_gestion_(2)_(1)_copy copy.png" alt="Team Gestion Logo" className="w-20 h-20 mb-3" />
            )
          ) : (
            currentEnterprise?.logo_url ? (
              <img src={currentEnterprise.logo_url} alt={`${currentEnterprise.name} Logo`} className="w-10 h-10 object-contain mb-3" />
            ) : (
              <img src="/56team_gestion_(2)_(1)_copy copy.png" alt="Team Gestion Logo" className="w-10 h-10 mb-3" />
            )
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-900 rounded-full transition-colors">
            <Menu size={20} className="text-white" />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredMenuItems.length === 0 && sidebarOpen ? (
              <li className="text-gray-400 text-sm p-3">
                Aucun menu disponible. Contactez l'administrateur pour obtenir des permissions.
              </li>
            ) : (
              filteredMenuItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => onNavigate(item.path)}
                    className={`w-full flex items-center gap-3 p-3 rounded-full transition-all ${
                      currentPage === item.path
                        ? 'text-white shadow-lg'
                        : 'hover:text-white text-gray-400'
                    }`}
                    style={{
                      backgroundColor: currentPage === item.path ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                    }}
                  >
                    <item.icon size={20} />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        </nav>
      </aside>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-80 text-white"
            style={{ backgroundColor: '#12141A', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex flex-col items-center" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {currentEnterprise?.logo_url ? (
                <img src={currentEnterprise.logo_url} alt={`${currentEnterprise.name} Logo`} className="w-20 h-20 object-contain mb-3" />
              ) : (
                <img src="/56team_gestion_(2)_(1)_copy copy.png" alt="Team Gestion Logo" className="w-20 h-20 mb-3" />
              )}
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                <X size={20} className="text-white" />
              </button>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-2">
                {filteredMenuItems.length === 0 ? (
                  <li className="text-gray-400 text-sm p-3">
                    Aucun menu disponible. Contactez l'administrateur pour obtenir des permissions.
                  </li>
                ) : (
                  filteredMenuItems.map((item) => (
                    <li key={item.path}>
                      <button
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center gap-3 p-3 rounded-full transition-all ${
                          currentPage === item.path
                            ? 'text-white shadow-lg'
                            : 'hover:text-white text-gray-400'
                        }`}
                        style={{
                          backgroundColor: currentPage === item.path ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                        }}
                      >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: '#12141A', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <Menu size={24} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            {currentEnterprise?.logo_url ? (
              <img src={currentEnterprise.logo_url} alt={`${currentEnterprise.name} Logo`} className="w-10 h-10 object-contain" />
            ) : (
              <img src="/56team_gestion_(2)_(1)_copy copy.png" alt="Team Gestion Logo" className="w-10 h-10" />
            )}
            <h1 className="text-xl font-bold text-white">{currentEnterprise?.name || 'Team Gestion'}</h1>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
