import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, CheckCircle, X } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const PublicEmployeeForm = () => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [enterpriseId, setEnterpriseId] = useState<string | null>(null);
  const [customPosition, setCustomPosition] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');

      if (!tokenParam) {
        setTokenValid(false);
        return;
      }

      try {
        const { data, error } = await anonClient
          .from('one_time_tokens')
          .select('*')
          .eq('token', tokenParam)
          .maybeSingle();

        if (error || !data) {
          setTokenValid(false);
          return;
        }

        if (data.used) {
          setTokenValid(false);
          return;
        }

        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          setTokenValid(false);
          return;
        }

        setToken(tokenParam);
        setEnterpriseId(data.enterprise_id);
        setTokenValid(true);
      } catch (err) {
        console.error('Token verification error:', err);
        setTokenValid(false);
      }
    };

    verifyToken();
  }, []);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    photo_url: '',
    personal_phone: '',
    professional_phone: '',
    emergency_phone: '',
    address: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'CDI' as 'CDD' | 'CDI' | 'Freelance',
    notes: '',
    status: 'Actif' as 'Actif' | 'En pause' | 'Sorti',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await anonClient.storage
        .from('employee-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = anonClient.storage
        .from('employee-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let photo_url = formData.photo_url;

      if (photoFile) {
        const uploadedUrl = await uploadPhoto(photoFile);
        if (uploadedUrl) {
          photo_url = uploadedUrl;
        }
      }

      const finalPosition = formData.position === 'Autre' ? customPosition : formData.position;

      if (formData.position === 'Autre' && !customPosition) {
        alert('Veuillez entrer un nom de poste personnalisé');
        setIsSubmitting(false);
        return;
      }

      const data = {
        ...formData,
        position: finalPosition,
        photo_url: photo_url || null,
        enterprise_id: enterpriseId,
        client_id: null,
        manager_id: null,
        declared_salary: 0,
        monthly_salary: 0,
        recharge: 0,
        monthly_bonus: 0,
      };

      const { error } = await anonClient.from('employees').insert(data);

      if (error) {
        alert('Erreur: ' + error.message);
        setIsSubmitting(false);
        return;
      }

      if (token) {
        await anonClient
          .from('one_time_tokens')
          .update({ used: true })
          .eq('token', token);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setFormData({
          first_name: '',
          last_name: '',
          photo_url: '',
          personal_phone: '',
          professional_phone: '',
          emergency_phone: '',
          address: '',
          position: '',
          hire_date: new Date().toISOString().split('T')[0],
          contract_type: 'CDI',
          notes: '',
          status: 'Actif',
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setIsSuccess(false);
        setIsSubmitting(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#2d2d2d] rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#2d2d2d] rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={48} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Lien invalide</h2>
          <p className="text-gray-300">Ce lien est invalide, expiré ou a déjà été utilisé.</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#2d2d2d] rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Merci</h2>
          <p className="text-gray-300">Vos informations ont été enregistrées avec succès.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#2d2d2d] rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-[#1a1a1a] p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Formulaire d'integration</h1>
            <p className="text-gray-300">Remplissez vos informations pour vous enregistrer</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-8 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-gray-700">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={40} className="text-gray-400" />
                  )}
                </div>
                <label className="cursor-pointer bg-[#1a1a1a] hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Téléphone personnel *</label>
                <input
                  type="tel"
                  required
                  value={formData.personal_phone}
                  onChange={(e) => setFormData({ ...formData, personal_phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Téléphone professionnel</label>
                <input
                  type="tel"
                  value={formData.professional_phone}
                  onChange={(e) => setFormData({ ...formData, professional_phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Téléphone d'urgence</label>
                <input
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Poste *</label>
                <select
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                >
                  <option value="">Sélectionner un poste</option>
                  <option value="Manager général">Manager général</option>
                  <option value="Manager">Manager</option>
                  <option value="Architecte">Architecte</option>
                  <option value="Assistant">Assistant</option>
                  <option value="Assistante de direction">Assistante de direction</option>
                  <option value="Superviseur">Superviseur</option>
                  <option value="Closer">Closer</option>
                  <option value="Communité manager">Communité manager</option>
                  <option value="Autre">Autre (Personnalisé)</option>
                </select>
              </div>

              {formData.position === 'Autre' && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Poste personnalisé *</label>
                  <input
                    type="text"
                    required
                    value={customPosition}
                    onChange={(e) => setCustomPosition(e.target.value)}
                    placeholder="Entrez le nom du poste"
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Date d'integration *</label>
                <input
                  type="date"
                  required
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">Notes / Informations complémentaires</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Ajoutez toute information supplémentaire..."
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1a1a1a] hover:bg-gray-600 text-white font-medium py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
