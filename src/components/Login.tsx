import React, { useState } from 'react';
import { LogIn, Shield, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(username, password);

    if (!success) {
      setError('Invalid credentials. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full mix-blend-multiply filter blur-xl animate-bounce-soft"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-bounce-soft" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-bounce-soft" style={{animationDelay: '2s'}}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="glass-card p-8 shadow-large border border-white/10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl blur-lg opacity-60"></div>
              <div className="relative bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-4 shadow-medium">
                <Shield className="w-8 h-8 text-white" />
                <Sparkles className="absolute top-1 right-1 w-3 h-3 text-white/80" />
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
            <p className="text-secondary-600">Sign in to access your attendance dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="username" className="block text-sm font-semibold text-secondary-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field focus:scale-[1.02] placeholder:text-secondary-400"
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-secondary-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12 focus:scale-[1.02] placeholder:text-secondary-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-error-500 rounded-full"></div>
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-medium hover:shadow-large hover:scale-[1.02] group"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 p-4 bg-secondary-50/50 rounded-xl border border-secondary-100">
            <div className="flex items-center justify-center gap-2 text-xs text-secondary-500">
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
              <span>Secure authentication powered by AttendBot</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary-400/20 rounded-full blur-sm"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-purple-400/20 rounded-full blur-sm"></div>
      </div>
    </div>
  );
}
