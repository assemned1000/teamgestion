import { Building2, LayoutDashboard, User, UserCircle, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onNavigate: (tab: string) => void;
  isInEnterprise?: boolean;
}

export const MainLayout = ({ children, currentTab, onNavigate, isInEnterprise = false }: MainLayoutProps) => {
  const { profile, canAccessPage } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' as const },
    { id: 'entreprises', label: 'Entreprises', icon: Building2, page: 'entreprises' as const },
    { id: 'personal', label: 'Personnel', icon: User, page: 'personal' as const },
  ].filter(tab => canAccessPage(tab.page));

  const showUsersTab = canAccessPage('users');

  const allTabs = [
    ...tabs,
    ...(showUsersTab ? [{ id: 'users', label: 'Utilisateurs', icon: UserCog, page: 'users' as const }] : []),
    { id: 'profile', label: 'Profile', icon: UserCircle, page: 'profile' as const }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1115' }}>
      <nav className="sticky top-0 z-50 backdrop-blur-nav border-b border-white border-opacity-5 hidden lg:block">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                  <img src="/56team_gestion_(2)_(1)_copy copy.png" alt="Team Gestion" className="w-full h-full object-contain" />
                </div>
                <span className="text-lg font-semibold tracking-tight" style={{ color: '#EAEAF0' }}>Team Gestion</span>
              </div>

              <div className="flex items-center gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onNavigate(tab.id)}
                      className={`relative inline-flex items-center px-5 py-2 text-sm font-medium rounded-full transition-all ${
                        isActive
                          ? ''
                          : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? 'rgba(107, 114, 128, 0.15)' : 'transparent',
                        color: isActive ? '#EAEAF0' : '#9AA0AB',
                      }}
                    >
                      <Icon size={16} className="mr-2" />
                      {tab.label}
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 rounded-full" style={{ backgroundColor: '#FFFFFF' }}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showUsersTab && (
                <button
                  onClick={() => onNavigate('users')}
                  className={`relative inline-flex items-center px-5 py-2 text-sm font-medium rounded-full transition-all ${
                    currentTab === 'users' ? '' : ''
                  }`}
                  style={{
                    backgroundColor: currentTab === 'users' ? 'rgba(107, 114, 128, 0.15)' : 'transparent',
                    color: currentTab === 'users' ? '#EAEAF0' : '#9AA0AB',
                  }}
                >
                  <UserCog size={16} className="mr-2" />
                  Utilisateurs
                  {currentTab === 'users' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 rounded-full" style={{ backgroundColor: '#FFFFFF' }}></div>
                  )}
                </button>
              )}

              <button
                onClick={() => onNavigate('profile')}
                className={`relative inline-flex items-center px-5 py-2 text-sm font-medium rounded-full transition-all ${
                  currentTab === 'profile' ? '' : ''
                }`}
                style={{
                  backgroundColor: currentTab === 'profile' ? 'rgba(107, 114, 128, 0.15)' : 'transparent',
                  color: currentTab === 'profile' ? '#EAEAF0' : '#9AA0AB',
                }}
              >
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="Profile" className="w-5 h-5 rounded-full mr-2" />
                ) : (
                  <UserCircle size={16} className="mr-2" />
                )}
                Profile
                {currentTab === 'profile' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 rounded-full" style={{ backgroundColor: '#FFFFFF' }}></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-center" style={{ backgroundColor: '#12141A', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="flex items-center gap-3">
          <img src="/56team_gestion_(2)_(1)_copy copy.png" alt="Team Gestion Logo" className="w-8 h-8" />
          <h1 className="text-lg font-bold text-white">Team Gestion</h1>
        </div>
      </header>

      <main className={isInEnterprise ? 'pt-16 pb-20 lg:pt-0 lg:pb-0' : 'max-w-[1400px] mx-auto px-6 lg:px-8 py-8 pt-20 pb-24 lg:pt-8 lg:pb-8'}>{children}</main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: '#12141A', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-2 py-3">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-full transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400'
                }`}
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                }}
              >
                {tab.id === 'profile' && profile?.photo_url ? (
                  <img src={profile.photo_url} alt="Profile" className="w-6 h-6 rounded-full" />
                ) : (
                  <Icon size={22} />
                )}
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
