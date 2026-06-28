import React, { useState } from 'react';
import { Lock, User, Store, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { UserProfile, CashierAccount, ShopSettings } from '../types';

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  shopSettings: ShopSettings;
  cashiers: CashierAccount[];
}

export default function Login({ onLoginSuccess, shopSettings, cashiers }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);
  const [logoSrc, setLogoSrc] = useState<string>('');

  // Automatically update logo source when shopSettings logoUrl changes
  React.useEffect(() => {
    setLogoSrc(shopSettings?.logoUrl || '');
  }, [shopSettings?.logoUrl]);

  const handleLogoError = () => {
    // If the dynamic uploaded logo failed, clear it to fallback to the beautiful built-in icon
    setLogoSrc('');
  };

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
    }, 800);
  };

  const shopName = shopSettings?.shopName || 'TOSERBA';

  return (
    <div id="login_container" className="min-h-screen flex flex-col justify-between text-gray-700 bg-slate-50 font-sans">
      
      {/* KONTEN UTAMA Halaman Login */}
      <main className="w-full max-w-5xl mx-auto px-4 my-auto py-6">
        <div className="bg-gradient-to-br from-sky-600 via-cyan-500 to-emerald-500 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 p-8 md:p-12 items-center gap-8 min-h-[500px]">
            
            {/* SISI KIRI: LOGO BESAR (7 dari 12 Kolom) */}
            <div className="md:col-span-7 flex flex-col items-center justify-center text-center text-white space-y-4">
                {/* Wrapper Ikon Keranjang Belanja */}
                <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                    <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Batang Troli Depan */}
                        <path d="M25 35H75L68 60H32L25 35Z" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* Gagang Belakang */}
                        <path d="M15 25H22L25 35" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* Roda */}
                        <circle cx="36" cy="70" r="5" fill="white"/>
                        <circle cx="64" cy="70" r="5" fill="white"/>
                        {/* Monogram Huruf T di dalam Keranjang */}
                        <path d="M42 43H58M50 43V53" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                        {/* Elemen Atas (Aksesoris Digital Mini) */}
                        <circle cx="50" cy="18" r="2" fill="white"/>
                        <rect x="38" y="22" width="5" height="5" rx="1" fill="white"/>
                        <rect x="56" y="21" width="6" height="5" rx="1" fill="white"/>
                    </svg>
                </div>
                {/* Teks Merk Utama */}
                <div className="space-y-1">
                    <h2 className="font-title text-4xl md:text-5xl font-extrabold tracking-wide drop-shadow-md uppercase">{shopName}</h2>
                    <p className="font-title text-lg md:text-xl font-medium tracking-wide opacity-90">Sistem Kasir Mandiri & Toko Serba Ada</p>
                </div>
            </div>

            {/* SISI KANAN: KARTU FORM LOGIN (5 dari 12 Kolom) */}
            <div className="md:col-span-5 bg-white/95 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-lg w-full max-w-sm mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Penampung Ikon Utama pada Halaman Login */}
                    <div className="mx-auto w-24 h-24 rounded-2xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)] flex items-center justify-center p-1.5 mb-5 transition-transform duration-300 hover:scale-105 select-none relative group overflow-hidden border border-slate-100">
                        {logoSrc ? (
                            <img 
                                src={logoSrc} 
                                alt="Logo Toserba" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain rounded-xl"
                                onError={handleLogoError}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <Store className="w-10 h-10 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Input Nama Pengguna */}
                    <div className="space-y-1.5">
                        <label className={`text-xs font-semibold block transition-colors duration-200 ${focusedInput === 'username' ? 'text-cyan-600' : 'text-gray-600'}`}>Nama Pengguna</label>
                        <div className="relative">
                            <span className={`absolute inset-y-0 left-0 pl-3.5 flex items-center transition-colors duration-200 ${focusedInput === 'username' ? 'text-cyan-500' : 'text-gray-400'}`}>
                                <User className="w-4 h-4" />
                            </span>
                            <input 
                                id="login_username"
                                type="text" 
                                required
                                value={username}
                                onFocus={() => setFocusedInput('username')}
                                onBlur={() => setFocusedInput(null)}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-slate-800 font-medium" 
                                placeholder="Masukkan username Anda"
                            />
                        </div>
                    </div>

                    {/* Input Kata Sandi */}
                    <div className="space-y-1.5">
                        <label className={`text-xs font-semibold block transition-colors duration-200 ${focusedInput === 'password' ? 'text-cyan-600' : 'text-gray-600'}`}>Kata Sandi</label>
                        <div className="relative">
                            <span className={`absolute inset-y-0 left-0 pl-3.5 flex items-center transition-colors duration-200 ${focusedInput === 'password' ? 'text-cyan-500' : 'text-gray-400'}`}>
                                <Lock className="w-4 h-4" />
                            </span>
                            <input 
                                id="login_password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-slate-800 font-medium" 
                                placeholder="Masukkan password Anda"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Remember me & Lupa Kata Sandi */}
                    <div className="flex items-center justify-between text-xs pt-1 select-none">
                        <label 
                          onClick={() => setRememberMe(!rememberMe)}
                          className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors font-medium"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-cyan-600 border-cyan-500 shadow-sm' : 'border-gray-300 bg-white'}`}>
                            {rememberMe && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span>Ingat saya</span>
                        </label>
                        <span className="font-semibold text-cyan-600 hover:underline cursor-pointer">
                            Lupa Kata Sandi?
                        </span>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div id="login_error" className="text-xs bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-lg text-center font-semibold animate-shake">
                            <span className="inline-block mr-1">⚠️</span> {error}
                        </div>
                    )}

                    {/* Tombol Login */}
                    <button 
                        id="login_submit_btn"
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-[#0b53a6] hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] transform"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span>Login</span>
                        )}
                    </button>
                </form>
            </div>

        </div>
      </main>

      {/* FOOTER BAWAH */}
      <footer className="w-full text-center py-6 text-[11px] text-gray-400 space-x-4 border-t border-gray-100 bg-white">
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Terms</a>
        <a href="#" className="hover:underline">Cookies</a>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-400">POS Secured Connection</span>
      </footer>

    </div>
  );
}


