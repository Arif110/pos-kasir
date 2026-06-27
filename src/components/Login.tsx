import React, { useState } from 'react';
import { Lock, User, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserProfile, CashierAccount, ShopSettings } from '../types';

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  shopSettings: ShopSettings;
  cashiers: CashierAccount[];
}

export default function Login({ onLoginSuccess, shopSettings, cashiers }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ownerUser = (shopSettings?.ownerUsername || 'owner').toLowerCase();
  const ownerPass = shopSettings?.ownerPassword || '123';
  const ownerFullName = shopSettings?.ownerName || 'Arif Rahman';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // Check for owner or registered cashiers
      if (username.toLowerCase() === ownerUser && password === ownerPass) {
        onLoginSuccess({
          username: ownerUser,
          role: 'OWNER',
          fullName: `${ownerFullName} (Owner)`
        });
      } else {
        const foundCashier = cashiers.find(
          (c) => c.username.toLowerCase() === username.toLowerCase() && c.password === password
        );
        if (foundCashier) {
          onLoginSuccess({
            username: foundCashier.username,
            role: 'CASHIER',
            fullName: `${foundCashier.fullName} (Kasir)`
          });
        } else {
          setError('Username atau password salah! (Hubungi Owner jika Anda belum terdaftar)');
          setIsLoading(false);
        }
      }
    }, 600);
  };

  const shopName = shopSettings?.shopName || 'KASIR PINTAR';

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
          <p className="text-xs text-slate-300 mt-1 font-mono tracking-wide">Sistem Point of Sale & Real-Time POS</p>
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
                  placeholder="Masukkan username Anda"
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
                  placeholder="Masukkan password Anda"
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
        </div>
      </div>
    </div>
  );
}
