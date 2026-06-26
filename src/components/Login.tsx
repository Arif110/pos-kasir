import React, { useState } from 'react';
import { Lock, User, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  shopName: string;
}

export default function Login({ onLoginSuccess, shopName }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // Simple and secure credentials for cashier app demo
      if (username.toLowerCase() === 'owner' && password === '123') {
        onLoginSuccess({
          username: 'owner',
          role: 'OWNER',
          fullName: 'Budi Santoso (Owner)'
        });
      } else if (username.toLowerCase() === 'kasir' && password === '123') {
        onLoginSuccess({
          username: 'kasir',
          role: 'CASHIER',
          fullName: 'Siti Aminah (Kasir)'
        });
      } else {
        setError('Username atau password salah! (Tips: gunakan owner/123 atau kasir/123)');
        setIsLoading(false);
      }
    }, 600);
  };

  const handleQuickLogin = (role: 'OWNER' | 'CASHIER') => {
    if (role === 'OWNER') {
      setUsername('owner');
      setPassword('123');
    } else {
      setUsername('kasir');
      setPassword('123');
    }
  };

  return (
    <div id="login_container" className="min-h-screen flex items-center justify-center bg-[#F4F4F7] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-200/50 via-transparent to-transparent pointer-events-none" />
      
      <div id="login_card" className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
        {/* Header branding banner */}
        <div className="bg-slate-950 p-6 text-center text-white relative">
          <div className="absolute top-3 right-3 bg-white/15 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-bold">
            V2.5 LIVE
          </div>
          <div className="mx-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">{shopName || 'KASIR PINTAR'}</h1>
          <p className="text-xs text-slate-300 mt-1 font-mono tracking-wide">Sistem Point of Sale & Manajemen Real-Time</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="login_username"
                  type="text"
                  required
                  placeholder="Masukkan username (owner / kasir)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="login_password"
                  type="password"
                  required
                  placeholder="Masukkan password (123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div id="login_error" className="text-xs bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-center font-semibold animate-pulse">
                {error}
              </div>
            )}

            <button
              id="login_submit_btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Setup credentials helper */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-1 text-slate-400 mb-3 justify-center text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-semibold tracking-wide uppercase text-[10px]">Akses Cepat Demo</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="quick_login_owner"
                onClick={() => handleQuickLogin('OWNER')}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-left transition-all hover:border-slate-900"
              >
                <div className="text-[10px] text-slate-500 font-bold">AKSES OWNER</div>
                <div className="text-xs text-slate-800 font-extrabold font-mono">owner / 123</div>
                <div className="text-[9px] text-emerald-600 font-semibold mt-1">Akses semua fitur</div>
              </button>
              <button
                id="quick_login_kasir"
                onClick={() => handleQuickLogin('CASHIER')}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-left transition-all hover:border-slate-900"
              >
                <div className="text-[10px] text-slate-500 font-bold">AKSES KASIR</div>
                <div className="text-xs text-slate-800 font-extrabold font-mono">kasir / 123</div>
                <div className="text-[9px] text-amber-600 font-semibold mt-1">Kasir, Stok & Utang</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
