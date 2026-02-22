import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/884bd879b80c60ce71e600be14a2d4a8.jpg)' }}
    >
      <div className="bg-black/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
        <div className="flex justify-center mb-6">
          <img src="/56team_gestion_(2)_(1)_copy copy.png" alt="Team Gestion Logo" className="w-16 h-16 md:w-20 md:h-20" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">Team Gestion</h2>
        <p className="text-center text-gray-300 mb-6 text-sm md:text-base">Connectez-vous à votre compte</p>

        {error && (
          <div className="bg-red-900/40 text-red-300 p-3 rounded-xl mb-4 text-sm border border-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-gray-900/50 text-white placeholder-gray-400"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-gray-900/50 text-white placeholder-gray-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-4"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};
