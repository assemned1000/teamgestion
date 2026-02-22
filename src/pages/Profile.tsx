import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Lock, Shield, LogOut, Eye, EyeOff, Edit2, X, Check } from 'lucide-react';

export const Profile = () => {
  const { profile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const getInitials = () => {
    const first = profile?.first_name?.[0] || '';
    const last = profile?.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrateur',
      directeur_general: 'Directeur Général',
      manager_general: 'Manager Général',
      manager: 'Manager',
      assistante_direction: 'Assistante de Direction',
      assistante: 'Assistante',
      employee: 'Employé',
    };
    return roleLabels[role] || role;
  };

  const handleEditProfile = () => {
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
    setEmail(profile?.email || '');
    setIsEditing(true);
    setProfileMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
    setEmail(profile?.email || '');
    setProfileMessage(null);
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileMessage({ type: 'error', text: 'Le nom et le prénom sont requis' });
      return;
    }

    if (!email.trim()) {
      setProfileMessage({ type: 'error', text: "L'email est requis" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setProfileMessage({ type: 'error', text: "Format d'email invalide" });
      return;
    }

    setLoadingProfile(true);
    setProfileMessage(null);

    try {
      const emailChanged = email.trim() !== profile?.email;

      if (emailChanged) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email.trim(),
        });

        if (authError) throw authError;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (error) throw error;

      if (emailChanged) {
        setProfileMessage({
          type: 'success',
          text: 'Profil mis à jour avec succès. Un email de confirmation a été envoyé à votre nouvelle adresse.'
        });
      } else {
        setProfileMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
      }

      setIsEditing(false);

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du profil' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Le mot de passe actuel est requis' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      return;
    }

    setLoadingPassword(true);
    setPasswordMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Utilisateur non trouvé');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Mot de passe actuel incorrect');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'Erreur lors de la modification du mot de passe' });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await signOut();
  };

  return (
    <div className="py-8 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold tracking-tight mb-8" style={{ color: '#EAEAF0' }}>
        Profile
      </h1>

      <div className="space-y-6">
        {/* Profile Header */}
        <div className="card-elevated p-8">
          <div className="flex items-center gap-6">
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{ background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)', color: '#EAEAF0' }}
              >
                {getInitials()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#EAEAF0' }}>
                {profile?.first_name} {profile?.last_name}
              </h2>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} style={{ color: '#9AA0AB' }} />
                <span className="text-base" style={{ color: '#9AA0AB' }}>
                  {profile?.role && getRoleLabel(profile.role)}
                </span>
              </div>
              <p className="text-base" style={{ color: '#9AA0AB' }}>{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="card-elevated p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-3" style={{ color: '#EAEAF0' }}>
              <User size={24} />
              Informations personnelles
            </h2>
            {!isEditing && (
              <button
                onClick={handleEditProfile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
                style={{ backgroundColor: '#6B7280', color: '#EAEAF0' }}
              >
                <Edit2 size={16} />
                Modifier le profil
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9AA0AB' }}>
                Nom complet
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    className="px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    style={{
                      backgroundColor: '#12141A',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#EAEAF0',
                    }}
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom"
                    className="px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    style={{
                      backgroundColor: '#12141A',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#EAEAF0',
                    }}
                  />
                </div>
              ) : (
                <p className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#12141A', color: '#EAEAF0' }}>
                  {profile?.first_name} {profile?.last_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9AA0AB' }}>
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  style={{
                    backgroundColor: '#12141A',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#EAEAF0',
                  }}
                />
              ) : (
                <p className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#12141A', color: '#9AA0AB' }}>
                  {profile?.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9AA0AB' }}>
                Rôle
              </label>
              <p className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#12141A', color: '#9AA0AB' }}>
                {profile?.role && getRoleLabel(profile.role)}
              </p>
            </div>

            {profileMessage && (
              <div
                className={`p-4 rounded-xl border ${
                  profileMessage.type === 'success'
                    ? 'border-green-500/20 text-green-400'
                    : 'border-red-500/20 text-red-400'
                }`}
                style={{
                  backgroundColor: profileMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                }}
              >
                {profileMessage.text}
              </div>
            )}

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={loadingProfile}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#3B82F6', color: '#EAEAF0' }}
                >
                  <Check size={18} />
                  {loadingProfile ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={loadingProfile}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#2D3139', color: '#EAEAF0' }}
                >
                  <X size={18} />
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="card-elevated p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-3" style={{ color: '#EAEAF0' }}>
            <Lock size={24} />
            Sécurité
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9AA0AB' }}>
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all"
                  style={{
                    backgroundColor: '#12141A',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#EAEAF0',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9AA0AB' }}
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9AA0AB' }}>
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all"
                  style={{
                    backgroundColor: '#12141A',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#EAEAF0',
                  }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9AA0AB' }}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9AA0AB' }}>
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all"
                  style={{
                    backgroundColor: '#12141A',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#EAEAF0',
                  }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9AA0AB' }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {passwordMessage && (
              <div
                className={`p-4 rounded-xl border ${
                  passwordMessage.type === 'success'
                    ? 'border-green-500/20 text-green-400'
                    : 'border-red-500/20 text-red-400'
                }`}
                style={{
                  backgroundColor: passwordMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                }}
              >
                {passwordMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingPassword}
              className="w-full px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
              style={{ backgroundColor: '#3B82F6', color: '#EAEAF0' }}
            >
              {loadingPassword ? 'Mise à jour en cours...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </div>

        {/* Session Section */}
        <div className="card-elevated p-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-3" style={{ color: '#EAEAF0' }}>
            <LogOut size={24} />
            Session
          </h2>
          <p className="mb-6" style={{ color: '#9AA0AB' }}>
            Vous serez déconnecté de votre session et redirigé vers la page de connexion.
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: '#DC2626', color: '#EAEAF0' }}
          >
            <LogOut size={20} />
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="card-elevated max-w-md w-full p-8">
            <h3 className="text-2xl font-semibold mb-4" style={{ color: '#EAEAF0' }}>
              Confirmation de déconnexion
            </h3>
            <p className="mb-6" style={{ color: '#9AA0AB' }}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: '#2D3139', color: '#EAEAF0' }}
              >
                Annuler
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: '#DC2626', color: '#EAEAF0' }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
