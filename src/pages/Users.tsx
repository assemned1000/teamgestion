import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Search, X, Shield, UserCog, CheckSquare, Square, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  photo_url: string | null;
  role: 'admin' | 'manager' | 'employee' | 'assistante' | 'directeur_general' | 'assistante_direction' | 'manager_general';
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

interface Enterprise {
  id: string;
  name: string;
  slug: string;
}

interface Permission {
  id: string;
  user_id: string;
  enterprise_id: string;
  module: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface AppPermission {
  user_id: string;
  can_access_dashboard: boolean;
  can_access_entreprises: boolean;
  can_access_personal: boolean;
  can_access_users: boolean;
}

interface EnterpriseAccess {
  user_id: string;
  enterprise_id: string;
}

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees', label: 'Employés' },
  { id: 'clients', label: 'Clients' },
  { id: 'equipment', label: 'Matériel' },
  { id: 'salaries', label: 'Salaires' },
  { id: 'expenses_professional', label: 'Dépenses Professionnelles' },
  { id: 'expenses_personal', label: 'Dépenses Personnelles' },
  { id: 'organization', label: 'Organisation' },
];

const ENTERPRISE_MODULES: Record<string, string[]> = {
  'deep-closer': ['dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization'],
  'ompleo': ['dashboard', 'employees', 'clients', 'equipment', 'salaries', 'expenses_professional', 'organization'],
  'dubai': ['dashboard', 'clients', 'expenses_professional'],
};

export const Users = () => {
  const { refreshPermissions } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [appPermissions, setAppPermissions] = useState<AppPermission[]>([]);
  const [enterpriseAccess, setEnterpriseAccess] = useState<EnterpriseAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedEnterprises, setExpandedEnterprises] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'employee' as 'admin' | 'manager' | 'employee' | 'assistante' | 'directeur_general' | 'assistante_direction' | 'manager_general',
    employee_id: '',
  });

  const [userAppPerms, setUserAppPerms] = useState({
    can_access_dashboard: false,
    can_access_entreprises: false,
    can_access_personal: false,
    can_access_users: false,
  });

  const [userEnterprises, setUserEnterprises] = useState<string[]>([]);

  const [userPermissions, setUserPermissions] = useState<Record<string, Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }>>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [usersRes, employeesRes, enterprisesRes, permissionsRes, appPermsRes, enterpriseAccessRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('id, first_name, last_name, photo_url'),
      supabase.from('enterprises').select('*').order('name'),
      supabase.from('user_permissions').select('*'),
      supabase.from('user_app_permissions').select('*'),
      supabase.from('user_enterprise_access').select('*'),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (employeesRes.data) setEmployees(employeesRes.data);
    if (enterprisesRes.data) setEnterprises(enterprisesRes.data);
    if (permissionsRes.data) setPermissions(permissionsRes.data);
    if (appPermsRes.data) setAppPermissions(appPermsRes.data);
    if (enterpriseAccessRes.data) setEnterpriseAccess(enterpriseAccessRes.data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser && !formData.password) {
      alert('Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            role: formData.role,
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        if (formData.employee_id) {
          await supabase
            .from('employees')
            .update({ user_id: editingUser.id })
            .eq('id', formData.employee_id);
        }

      } else {
        const { data: currentSession } = await supabase.auth.getSession();

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone || null,
              role: formData.role,
            },
          },
        });

        if (authError) {
          if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
            throw new Error('Cet email est déjà utilisé. Veuillez utiliser un autre email.');
          }
          throw authError;
        }
        if (!authData.user) throw new Error('Erreur lors de la création de l\'utilisateur');

        const userId = authData.user.id;

        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          role: formData.role,
        });

        if (profileError) throw profileError;

        await supabase.auth.signOut();

        if (currentSession.session) {
          await supabase.auth.setSession({
            access_token: currentSession.session.access_token,
            refresh_token: currentSession.session.refresh_token,
          });
        }

        if (formData.employee_id) {
          const selectedEmployee = employees.find(e => e.id === formData.employee_id);
          if (selectedEmployee) {
            await supabase
              .from('profiles')
              .update({ photo_url: selectedEmployee.photo_url })
              .eq('id', userId);

            await supabase
              .from('employees')
              .update({ user_id: userId })
              .eq('id', formData.employee_id);
          }
        }

        await supabase.from('user_app_permissions').upsert({
          user_id: userId,
          can_access_dashboard: userAppPerms.can_access_dashboard,
          can_access_entreprises: userAppPerms.can_access_entreprises,
          can_access_personal: userAppPerms.can_access_personal,
          can_access_users: userAppPerms.can_access_users,
        }, { onConflict: 'user_id' });

        let enterprisesToGrant = [...userEnterprises];

        Object.keys(userPermissions).forEach(entId => {
          const hasAnyPermission = MODULES.some(module => {
            const perms = userPermissions[entId]?.[module.id];
            return perms && (perms.read || perms.create || perms.update || perms.delete);
          });
          if (hasAnyPermission && !enterprisesToGrant.includes(entId)) {
            enterprisesToGrant.push(entId);
          }
        });

        if (userAppPerms.can_access_dashboard && userEnterprises.length === 0) {
          enterprisesToGrant = enterprises.map(e => e.id);
        }

        if (enterprisesToGrant.length > 0) {
          await supabase
            .from('user_enterprise_access')
            .insert(enterprisesToGrant.map(entId => ({ user_id: userId, enterprise_id: entId })));
        }

        const permsToInsert: any[] = [];
        enterprisesToGrant.forEach(entId => {
          const enterprise = enterprises.find(e => e.id === entId);
          const availableModules = enterprise ? (ENTERPRISE_MODULES[enterprise.slug] || []) : [];

          MODULES.forEach(module => {
            if (!availableModules.includes(module.id)) return;

            const perms = userPermissions[entId]?.[module.id];

            if (!userAppPerms.can_access_entreprises && userAppPerms.can_access_dashboard) {
              permsToInsert.push({
                user_id: userId,
                enterprise_id: entId,
                module: module.id,
                can_read: true,
                can_create: false,
                can_update: false,
                can_delete: false,
              });
            } else if (perms && (perms.read || perms.create || perms.update || perms.delete)) {
              permsToInsert.push({
                user_id: userId,
                enterprise_id: entId,
                module: module.id,
                can_read: perms.read,
                can_create: perms.create,
                can_update: perms.update,
                can_delete: perms.delete,
              });
            }
          });
        });

        if (permsToInsert.length > 0) {
          await supabase.from('user_permissions').insert(permsToInsert);
        }
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      resetPermissions();
      await loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      role: user.role,
      employee_id: '',
    });
    setShowModal(true);
  };

  const openPermissionsModal = (userId: string) => {
    setSelectedUserId(userId);

    const appPerm = appPermissions.find(p => p.user_id === userId);
    setUserAppPerms({
      can_access_dashboard: appPerm?.can_access_dashboard || false,
      can_access_entreprises: appPerm?.can_access_entreprises || false,
      can_access_personal: appPerm?.can_access_personal || false,
      can_access_users: appPerm?.can_access_users || false,
    });

    const userEntAccess = enterpriseAccess.filter(ea => ea.user_id === userId).map(ea => ea.enterprise_id);
    setUserEnterprises(userEntAccess);

    const userPerms = permissions.filter(p => p.user_id === userId);

    const permsMap: Record<string, Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }>> = {};

    enterprises.forEach(enterprise => {
      permsMap[enterprise.id] = {};
      MODULES.forEach(module => {
        const perm = userPerms.find(p => p.enterprise_id === enterprise.id && p.module === module.id);
        permsMap[enterprise.id][module.id] = {
          read: perm?.can_read || false,
          create: perm?.can_create || false,
          update: perm?.can_update || false,
          delete: perm?.can_delete || false,
        };
      });
    });

    setUserPermissions(permsMap);
    setShowPermissionsModal(true);
  };

  const toggleEnterprise = (enterpriseId: string) => {
    const isCurrentlyChecked = userEnterprises.includes(enterpriseId);

    if (isCurrentlyChecked) {
      // Unchecking - remove enterprise
      setUserEnterprises(prev => prev.filter(id => id !== enterpriseId));
    } else {
      // Checking - add enterprise and set all permissions to true
      setUserEnterprises(prev => [...prev, enterpriseId]);

      const enterprise = enterprises.find(e => e.id === enterpriseId);
      if (enterprise) {
        const availableModules = ENTERPRISE_MODULES[enterprise.slug] || [];
        const newPerms: Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }> = {};

        MODULES.forEach(module => {
          if (availableModules.includes(module.id)) {
            newPerms[module.id] = {
              read: true,
              create: true,
              update: true,
              delete: true,
            };
          }
        });

        setUserPermissions(prev => ({
          ...prev,
          [enterpriseId]: newPerms,
        }));

        // Auto-expand the enterprise
        setExpandedEnterprises(prev => ({
          ...prev,
          [enterpriseId]: true,
        }));
      }
    }
  };

  const toggleEnterpriseExpand = (enterpriseId: string) => {
    setExpandedEnterprises(prev => ({
      ...prev,
      [enterpriseId]: !prev[enterpriseId],
    }));
  };

  const handlePermissionToggle = (enterpriseId: string, module: string, action: 'read' | 'create' | 'update' | 'delete') => {
    setUserPermissions(prev => ({
      ...prev,
      [enterpriseId]: {
        ...prev[enterpriseId],
        [module]: {
          ...prev[enterpriseId]?.[module],
          [action]: !prev[enterpriseId]?.[module]?.[action],
        },
      },
    }));
  };

  const handleToggleAll = (enterpriseId: string, module: string) => {
    const currentPerms = userPermissions[enterpriseId]?.[module];
    const allChecked = currentPerms?.read && currentPerms?.create && currentPerms?.update && currentPerms?.delete;

    setUserPermissions(prev => ({
      ...prev,
      [enterpriseId]: {
        ...prev[enterpriseId],
        [module]: {
          read: !allChecked,
          create: !allChecked,
          update: !allChecked,
          delete: !allChecked,
        },
      },
    }));
  };

  const savePermissions = async () => {
    if (!selectedUserId) return;

    try {
      await supabase
        .from('user_app_permissions')
        .upsert({
          user_id: selectedUserId,
          can_access_dashboard: userAppPerms.can_access_dashboard,
          can_access_entreprises: userAppPerms.can_access_entreprises,
          can_access_personal: userAppPerms.can_access_personal,
          can_access_users: userAppPerms.can_access_users,
        }, { onConflict: 'user_id' });

      await supabase
        .from('user_enterprise_access')
        .delete()
        .eq('user_id', selectedUserId);

      let enterprisesToGrant: string[] = [];

      if (userAppPerms.can_access_entreprises) {
        enterprisesToGrant = [...userEnterprises];
      } else if (userAppPerms.can_access_dashboard) {
        enterprisesToGrant = enterprises.map(e => e.id);
      }

      if (enterprisesToGrant.length > 0) {
        await supabase
          .from('user_enterprise_access')
          .insert(enterprisesToGrant.map(entId => ({ user_id: selectedUserId, enterprise_id: entId })));
      }

      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUserId);

      const permsToInsert: any[] = [];
      enterprisesToGrant.forEach(entId => {
        const enterprise = enterprises.find(e => e.id === entId);
        const availableModules = enterprise ? (ENTERPRISE_MODULES[enterprise.slug] || []) : [];

        MODULES.forEach(module => {
          if (!availableModules.includes(module.id)) return;

          const perms = userPermissions[entId]?.[module.id];
          if (!userAppPerms.can_access_entreprises && userAppPerms.can_access_dashboard) {
            permsToInsert.push({
              user_id: selectedUserId,
              enterprise_id: entId,
              module: module.id,
              can_read: true,
              can_create: false,
              can_update: false,
              can_delete: false,
            });
          } else if (perms && (perms.read || perms.create || perms.update || perms.delete)) {
            permsToInsert.push({
              user_id: selectedUserId,
              enterprise_id: entId,
              module: module.id,
              can_read: perms.read,
              can_create: perms.create,
              can_update: perms.update,
              can_delete: perms.delete,
            });
          }
        });
      });

      if (permsToInsert.length > 0) {
        await supabase.from('user_permissions').insert(permsToInsert);
      }

      await refreshPermissions();
      await loadData();

      setShowPermissionsModal(false);
      setSelectedUserId(null);
    } catch (error: any) {
      alert('Erreur lors de la sauvegarde des permissions: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'employee',
      employee_id: '',
    });
  };

  const resetPermissions = () => {
    setUserAppPerms({
      can_access_dashboard: false,
      can_access_entreprises: false,
      can_access_personal: false,
      can_access_users: false,
    });
    setUserEnterprises([]);
    setUserPermissions({});
    setExpandedEnterprises({});
  };

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'directeur_general':
        return 'bg-blue-100 text-blue-800';
      case 'manager_general':
        return 'bg-green-100 text-green-800';
      case 'manager':
        return 'bg-gray-700 text-white';
      case 'assistante_direction':
        return 'bg-yellow-100 text-yellow-800';
      case 'assistante':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'directeur_general':
        return 'Directeur général';
      case 'manager_general':
        return 'Manager général';
      case 'manager':
        return 'Manager';
      case 'assistante_direction':
        return 'Assistante de direction';
      case 'assistante':
        return 'Assistante';
      default:
        return 'Employé';
    }
  };

  const getUserPermissionSummary = (userId: string) => {
    const entCount = enterpriseAccess.filter(ea => ea.user_id === userId).length;
    const moduleCount = permissions.filter(p => p.user_id === userId && p.can_read).length;
    return `${entCount} entreprise(s), ${moduleCount} module(s)`;
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 lg:mb-10">
        <h1 className="text-2xl lg:text-4xl font-bold tracking-tight mb-1 lg:mb-2" style={{ color: '#EAEAF0' }}>Utilisateurs</h1>
        <p className="text-sm lg:text-base" style={{ color: '#9AA0AB' }}>Gestion des utilisateurs, rôles et permissions</p>
      </div>

      <div className="card-surface p-4 lg:p-6 mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 lg:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: '#6B7280' }} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 lg:py-3 text-sm outline-none"
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
              resetPermissions();
              setEditingUser(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-medium transition-all whitespace-nowrap"
            style={{ backgroundColor: '#6B7280', color: '#EAEAF0' }}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Ajouter un utilisateur</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#3B82F6' }}></div>
        </div>
      ) : (
        <div className="grid gap-4 lg:gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="card-elevated p-4 lg:p-6 hover:shadow-xl transition-all">
              <div className="flex flex-col lg:flex-row items-start lg:justify-between gap-4">
                <div className="flex gap-3 lg:gap-4 flex-1 w-full">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt={user.first_name} className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover shadow-md flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-lg lg:text-xl font-bold shadow-md flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)', color: '#EAEAF0' }}>
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg lg:text-xl font-bold truncate" style={{ color: '#EAEAF0' }}>{user.first_name} {user.last_name}</h3>
                      <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: '#6B7280' }}>Email</p>
                        <p className="font-medium truncate text-xs lg:text-sm" style={{ color: '#EAEAF0' }}>{user.email}</p>
                      </div>
                      {user.phone && (
                        <div className="min-w-0">
                          <p className="text-xs" style={{ color: '#6B7280' }}>Téléphone</p>
                          <p className="font-medium text-xs lg:text-sm" style={{ color: '#EAEAF0' }}>{user.phone}</p>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: '#6B7280' }}>Accès</p>
                        <p className="font-medium text-xs lg:text-sm" style={{ color: '#EAEAF0' }}>{getUserPermissionSummary(user.id)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 lg:flex-col lg:gap-2 self-end lg:self-start">
                  <button
                    onClick={() => openPermissionsModal(user.id)}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: '#9AA0AB' }}
                    title="Gérer les permissions"
                  >
                    <Shield size={18} />
                  </button>
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: '#9AA0AB' }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="card-surface text-center py-12">
              <p style={{ color: '#9AA0AB' }}>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1A1D24' }}>
            <div className="sticky top-0 border-b border-gray-700 p-6 flex justify-between items-center" style={{ backgroundColor: '#1A1D24' }}>
              <h2 className="text-2xl font-bold text-white">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => { setShowModal(false); resetPermissions(); }} className="p-2 hover:bg-gray-700 rounded-lg text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {!editingUser && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-200 mb-2">Sélectionner un employé existant (optionnel)</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => {
                      const employee = employees.find(emp => emp.id === e.target.value);
                      if (employee) {
                        setFormData({
                          ...formData,
                          employee_id: e.target.value,
                          first_name: employee.first_name,
                          last_name: employee.last_name,
                        });
                      } else {
                        setFormData({ ...formData, employee_id: '' });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="">Créer un nouvel utilisateur</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Si vous sélectionnez un employé, ses informations seront pré-remplies</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Mot de passe *</label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Rôle *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  >
                    <option value="employee">Utilisateur limité</option>
                    <option value="assistante">Assistante</option>
                    <option value="assistante_direction">Assistante de direction</option>
                    <option value="manager">Manager</option>
                    <option value="manager_general">Manager général</option>
                    <option value="directeur_general">Directeur général</option>
                    <option value="admin">Administrateur</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Le rôle est utilisé uniquement pour l'affichage. Les permissions sont définies ci-dessous.</p>
                </div>
              </div>

              {!editingUser && (
                <div className="mt-8 space-y-6 border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-bold text-white">Permissions de l'utilisateur</h3>

                  <div>
                    <h4 className="text-sm font-bold text-white mb-3">Pages principales de l'application</h4>
                    <p className="text-xs text-gray-400 mb-3">Note: Si vous activez uniquement "Dashboard" sans sélectionner d'entreprises, l'utilisateur aura accès en lecture seule à toutes les entreprises pour voir les statistiques.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" style={{ backgroundColor: '#1E212A' }}>
                        <input
                          type="checkbox"
                          checked={userAppPerms.can_access_dashboard}
                          onChange={(e) => setUserAppPerms({ ...userAppPerms, can_access_dashboard: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">Dashboard</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" style={{ backgroundColor: '#1E212A' }}>
                        <input
                          type="checkbox"
                          checked={userAppPerms.can_access_entreprises}
                          onChange={(e) => setUserAppPerms({ ...userAppPerms, can_access_entreprises: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">Entreprises</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" style={{ backgroundColor: '#1E212A' }}>
                        <input
                          type="checkbox"
                          checked={userAppPerms.can_access_personal}
                          onChange={(e) => setUserAppPerms({ ...userAppPerms, can_access_personal: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">Personnel</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" style={{ backgroundColor: '#1E212A' }}>
                        <input
                          type="checkbox"
                          checked={userAppPerms.can_access_users}
                          onChange={(e) => setUserAppPerms({ ...userAppPerms, can_access_users: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">Utilisateurs</span>
                      </label>
                    </div>
                  </div>

                  {userAppPerms.can_access_entreprises && (
                    <div>
                      <h4 className="text-sm font-bold text-white mb-3">Accès aux entreprises et modules</h4>
                      <div className="space-y-3">
                        {enterprises.map((enterprise) => (
                        <div key={enterprise.id} className="border border-gray-700 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 p-3" style={{ backgroundColor: '#1E212A' }}>
                            <input
                              type="checkbox"
                              checked={userEnterprises.includes(enterprise.id)}
                              onChange={() => toggleEnterprise(enterprise.id)}
                              className="w-4 h-4"
                            />
                            <Building2 size={16} className="text-white" />
                            <span className="text-white font-medium text-sm flex-1">{enterprise.name}</span>
                            {userEnterprises.includes(enterprise.id) && (
                              <button
                                type="button"
                                onClick={() => toggleEnterpriseExpand(enterprise.id)}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                              >
                                {expandedEnterprises[enterprise.id] ? (
                                  <ChevronDown size={16} className="text-white" />
                                ) : (
                                  <ChevronRight size={16} className="text-white" />
                                )}
                              </button>
                            )}
                          </div>

                          {userEnterprises.includes(enterprise.id) && expandedEnterprises[enterprise.id] && (
                            <div className="p-3" style={{ backgroundColor: '#12141A' }}>
                              <div className="overflow-x-auto -mx-3 px-3">
                                <table className="w-full text-xs min-w-[500px]">
                                  <thead className="border-b border-gray-700">
                                    <tr>
                                      <th className="px-2 py-2 text-left text-white font-medium whitespace-nowrap">Module</th>
                                      <th className="px-2 py-2 text-center text-white font-medium whitespace-nowrap">Lire</th>
                                      <th className="px-2 py-2 text-center text-white font-medium whitespace-nowrap">Créer</th>
                                      <th className="px-2 py-2 text-center text-white font-medium whitespace-nowrap">Modifier</th>
                                      <th className="px-2 py-2 text-center text-white font-medium whitespace-nowrap">Supprimer</th>
                                      <th className="px-2 py-2 text-center text-white font-medium whitespace-nowrap">Tout</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {MODULES.filter(module => {
                                      const availableModules = ENTERPRISE_MODULES[enterprise.slug] || [];
                                      return availableModules.includes(module.id);
                                    }).map((module) => (
                                      <tr key={module.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                        <td className="px-2 py-2 text-white">{module.label}</td>
                                        <td className="px-2 py-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handlePermissionToggle(enterprise.id, module.id, 'read')}
                                            className="inline-flex items-center justify-center w-6 h-6 hover:bg-gray-600 rounded transition-colors"
                                          >
                                            {userPermissions[enterprise.id]?.[module.id]?.read ? (
                                              <CheckSquare size={14} className="text-white" />
                                            ) : (
                                              <Square size={14} className="text-gray-400" />
                                            )}
                                          </button>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handlePermissionToggle(enterprise.id, module.id, 'create')}
                                            className="inline-flex items-center justify-center w-6 h-6 hover:bg-gray-600 rounded transition-colors"
                                          >
                                            {userPermissions[enterprise.id]?.[module.id]?.create ? (
                                              <CheckSquare size={14} className="text-white" />
                                            ) : (
                                              <Square size={14} className="text-gray-400" />
                                            )}
                                          </button>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handlePermissionToggle(enterprise.id, module.id, 'update')}
                                            className="inline-flex items-center justify-center w-6 h-6 hover:bg-gray-600 rounded transition-colors"
                                          >
                                            {userPermissions[enterprise.id]?.[module.id]?.update ? (
                                              <CheckSquare size={14} className="text-white" />
                                            ) : (
                                              <Square size={14} className="text-gray-400" />
                                            )}
                                          </button>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handlePermissionToggle(enterprise.id, module.id, 'delete')}
                                            className="inline-flex items-center justify-center w-6 h-6 hover:bg-gray-600 rounded transition-colors"
                                          >
                                            {userPermissions[enterprise.id]?.[module.id]?.delete ? (
                                              <CheckSquare size={14} className="text-red-600" />
                                            ) : (
                                              <Square size={14} className="text-gray-400" />
                                            )}
                                          </button>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleAll(enterprise.id, module.id)}
                                            className="inline-flex items-center justify-center w-6 h-6 hover:bg-gray-600 rounded transition-colors"
                                          >
                                            {userPermissions[enterprise.id]?.[module.id]?.read &&
                                             userPermissions[enterprise.id]?.[module.id]?.create &&
                                             userPermissions[enterprise.id]?.[module.id]?.update &&
                                             userPermissions[enterprise.id]?.[module.id]?.delete ? (
                                              <CheckSquare size={14} className="text-green-500" />
                                            ) : (
                                              <Square size={14} className="text-gray-400" />
                                            )}
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetPermissions(); }}
                  className="px-6 py-2 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPermissionsModal && selectedUserId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1A1D24' }}>
            <div className="sticky top-0 border-b border-gray-700 p-6 flex justify-between items-center z-10" style={{ backgroundColor: '#1A1D24' }}>
              <div className="flex items-center gap-3">
                <UserCog size={28} className="text-white" />
                <h2 className="text-2xl font-bold text-white">Gérer les permissions</h2>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="p-2 hover:bg-gray-700 rounded-lg text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Pages principales de l'application</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" style={{ backgroundColor: '#1E212A' }}>
                    <input
                      type="checkbox"
                      checked={userAppPerms.can_access_dashboard}
                      onChange={(e) => setUserAppPerms({ ...userAppPerms, can_access_dashboard: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white font-medium">Dashboard</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" style={{ backgroundColor: '#1E212A' }}>
                    <input
                      type="checkbox"
                      checked={userAppPerms.can_access_entreprises}
                      onChange={(e) => setUserAppPerms({ ...userAppPerms, can_access_entreprises: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white font-medium">Entreprises</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" style={{ backgroundColor: '#1E212A' }}>
                    <input
                      type="checkbox"
                      checked={userAppPerms.can_access_personal}
                      onChange={(e) => setUserAppPerms({ ...userAppPerms, can_access_personal: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white font-medium">Personnel</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" style={{ backgroundColor: '#1E212A' }}>
                    <input
                      type="checkbox"
                      checked={userAppPerms.can_access_users}
                      onChange={(e) => setUserAppPerms({ ...userAppPerms, can_access_users: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white font-medium">Utilisateurs</span>
                  </label>
                </div>
              </div>

              {userAppPerms.can_access_entreprises && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Accès aux entreprises</h3>
                  <div className="space-y-4">
                    {enterprises.map((enterprise) => (
                    <div key={enterprise.id} className="border border-gray-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-3 p-4" style={{ backgroundColor: '#1E212A' }}>
                        <input
                          type="checkbox"
                          checked={userEnterprises.includes(enterprise.id)}
                          onChange={() => toggleEnterprise(enterprise.id)}
                          className="w-5 h-5"
                        />
                        <Building2 size={20} className="text-white" />
                        <span className="text-white font-bold flex-1">{enterprise.name}</span>
                        {userEnterprises.includes(enterprise.id) && (
                          <button
                            onClick={() => toggleEnterpriseExpand(enterprise.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                          >
                            {expandedEnterprises[enterprise.id] ? (
                              <ChevronDown size={20} className="text-white" />
                            ) : (
                              <ChevronRight size={20} className="text-white" />
                            )}
                          </button>
                        )}
                      </div>

                      {userEnterprises.includes(enterprise.id) && expandedEnterprises[enterprise.id] && (
                        <div className="p-4" style={{ backgroundColor: '#12141A' }}>
                          <div className="overflow-x-auto -mx-4 px-4">
                            <table className="w-full text-sm min-w-[600px]">
                              <thead className="border-b border-gray-700">
                                <tr>
                                  <th className="px-4 py-3 text-left text-white font-bold whitespace-nowrap">Module</th>
                                  <th className="px-4 py-3 text-center text-white font-bold whitespace-nowrap">Lire</th>
                                  <th className="px-4 py-3 text-center text-white font-bold whitespace-nowrap">Créer</th>
                                  <th className="px-4 py-3 text-center text-white font-bold whitespace-nowrap">Modifier</th>
                                  <th className="px-4 py-3 text-center text-white font-bold whitespace-nowrap">Supprimer</th>
                                  <th className="px-4 py-3 text-center text-white font-bold whitespace-nowrap">Tout</th>
                                </tr>
                              </thead>
                              <tbody>
                                {MODULES.filter(module => {
                                  const availableModules = ENTERPRISE_MODULES[enterprise.slug] || [];
                                  return availableModules.includes(module.id);
                                }).map((module) => (
                                  <tr key={module.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                    <td className="px-4 py-3 text-white">{module.label}</td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={() => handlePermissionToggle(enterprise.id, module.id, 'read')}
                                        className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-600 rounded transition-colors"
                                      >
                                        {userPermissions[enterprise.id]?.[module.id]?.read ? (
                                          <CheckSquare size={18} className="text-white" />
                                        ) : (
                                          <Square size={18} className="text-gray-400" />
                                        )}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={() => handlePermissionToggle(enterprise.id, module.id, 'create')}
                                        className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-600 rounded transition-colors"
                                      >
                                        {userPermissions[enterprise.id]?.[module.id]?.create ? (
                                          <CheckSquare size={18} className="text-white" />
                                        ) : (
                                          <Square size={18} className="text-gray-400" />
                                        )}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={() => handlePermissionToggle(enterprise.id, module.id, 'update')}
                                        className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-600 rounded transition-colors"
                                      >
                                        {userPermissions[enterprise.id]?.[module.id]?.update ? (
                                          <CheckSquare size={18} className="text-white" />
                                        ) : (
                                          <Square size={18} className="text-gray-400" />
                                        )}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={() => handlePermissionToggle(enterprise.id, module.id, 'delete')}
                                        className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-600 rounded transition-colors"
                                      >
                                        {userPermissions[enterprise.id]?.[module.id]?.delete ? (
                                          <CheckSquare size={18} className="text-red-600" />
                                        ) : (
                                          <Square size={18} className="text-gray-400" />
                                        )}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={() => handleToggleAll(enterprise.id, module.id)}
                                        className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-600 rounded transition-colors"
                                      >
                                        {userPermissions[enterprise.id]?.[module.id]?.read &&
                                         userPermissions[enterprise.id]?.[module.id]?.create &&
                                         userPermissions[enterprise.id]?.[module.id]?.update &&
                                         userPermissions[enterprise.id]?.[module.id]?.delete ? (
                                          <CheckSquare size={18} className="text-green-500" />
                                        ) : (
                                          <Square size={18} className="text-gray-400" />
                                        )}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-6 py-2 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={savePermissions}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Enregistrer les permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
