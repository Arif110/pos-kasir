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
    <div id="login_container" className="min-h-screen flex items-center justify-center bg-[#080c14] p-4 overflow-hidden relative font-sans">
      {/* Ambient Light Glows */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -top-32 -left-32 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -bottom-32 -right-32 pointer-events-none" />

      {/* Main Login Container */}
      <div 
        id="login_card" 
        className="w-full max-w-md bg-[#0f162a]/65 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-300 hover:border-slate-800 animate-scaleIn"
      >
        {/* System Version Tag */}
        <div className="absolute top-6 right-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            v2.5 Live
          </span>
        </div>

        {/* Store branding section */}
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          {/* Glowing shop icon */}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 ring-4 ring-blue-500/10">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1.5 uppercase">{shopName}</h1>
          <p className="text-xs text-slate-400 max-w-[250px] leading-relaxed">Sistem Point of Sale & Real-Time POS</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase ml-1 block">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="w-5 h-5" />
              </span>
              <input
                id="login_username"
                type="text"
                required
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 transition-all focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.25)]"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase ml-1 block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="login_password"
                type="password"
                required
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 transition-all focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.25)]"
              />
            </div>
          </div>

          {/* Remember me & Forgot password indicators */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer" 
              />
              Ingat saya
            </label>
            <span className="text-blue-400 font-medium hover:text-blue-300 transition-colors cursor-pointer">
              Lupa Password?
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div id="login_error" className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-center font-semibold animate-pulse">
              {error}
            </div>
          )}

          {/* Main Submit Button */}
          <button
            id="login_submit_btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all duration-200 flex items-center justify-center gap-2 mt-2 group active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
