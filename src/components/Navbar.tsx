import { useState, useEffect } from 'react';
import { 
  Store, 
  ShoppingCart, 
  Package, 
  FileSpreadsheet, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Clock, 
  Menu, 
  X,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { UserProfile, ShopSettings } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  shopSettings: ShopSettings;
  lowStockCount: number;
}

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout, 
  shopSettings,
  lowStockCount
}: NavbarProps) {
  const [time, setTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const formatted = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${dayName}, ${formatted}`;
  };

  const navItems = [
    { id: 'kasir', label: 'Kasir', icon: ShoppingCart, roles: ['OWNER', 'CASHIER'] },
    { id: 'stok', label: 'Stok Barang', icon: Package, roles: ['OWNER', 'CASHIER'] },
    { id: 'utang', label: 'Catatan Utang', icon: FileSpreadsheet, roles: ['OWNER', 'CASHIER'] },
    { id: 'ppob', label: 'PPOB & Digital', icon: Zap, roles: ['OWNER', 'CASHIER'] },
    { id: 'analitik', label: 'Analitik & Laporan', icon: TrendingUp, roles: ['OWNER'] },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, roles: ['OWNER'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <header id="app_header" className="sticky top-0 z-40 bg-slate-100 py-3 px-4">
      {/* NAVBAR HEADER UTAMA (Clean, Modern, & Elegant Premium UI) */}
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-100/50 px-6 py-3.5 flex items-center justify-between">
        
        {/* BAGIAN KIRI: BRANDING & IDENTITAS SISTEM */}
        <div className="flex items-center gap-4">
          {/* Icon Toko Berbingkai */}
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0">
            <Store className="h-5 w-5 text-white" />
          </div>
          {/* Nama & Subtitle Toko */}
          <div className="leading-tight">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase truncate max-w-[150px] sm:max-w-[220px]">
              {shopSettings.shopName || 'TOKO TOSERBA'}
            </h1>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">Sistem Kasir Mandiri</p>
          </div>
        </div>

        {/* BAGIAN TENGAH: MENU NAVIGASI CORE UTAMA (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100/80">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`nav_tab_${item.id}`}
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-xs flex items-center gap-2 px-4 py-2 rounded-lg transition-all active:scale-[0.98] relative cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white font-extrabold shadow-md shadow-slate-950/10' 
                    : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-200/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
                
                {/* Dot Berpendar Amber untuk Stok Tipis */}
                {item.id === 'stok' && lowStockCount > 0 && (
                  <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* BAGIAN KANAN: REALTIME CLOCK & PROFIL USER / OWNER */}
        <div className="flex items-center gap-4">
          
          {/* Jam & Tanggal Digital Real-Time */}
          <div className="text-right hidden md:block leading-tight font-mono border-r border-slate-100 pr-4">
            <span className="text-xs font-bold text-slate-800 block">{formatTime(time)}</span>
            <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">{formatDate(time)}</span>
          </div>

          {/* Informasi Profil Akun Pengguna */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl py-1.5 pl-2 pr-3.5 shadow-sm">
            {/* Avatar Profil Singkat */}
            <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-extrabold shadow-sm shadow-blue-600/10 uppercase">
              {(currentUser.fullName || currentUser.username || 'O')[0]}
            </div>
            {/* Detail Nama & Role Status */}
            <div className="leading-none text-left">
              <span className="text-xs font-bold text-slate-800 block truncate max-w-[100px]">{currentUser.fullName}</span>
              <span className="inline-block text-[8px] font-extrabold uppercase tracking-widest text-blue-600 mt-1">
                {currentUser.role === 'OWNER' ? 'Owner' : 'Kasir'}
              </span>
            </div>
          </div>

          {/* Tombol Keluar Sistem (Logout Desktop) */}
          <button 
            id="logout_btn_desktop"
            onClick={onLogout}
            className="hidden sm:flex p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all active:scale-[0.95] cursor-pointer" 
            title="Keluar Sistem"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            id="mobile_menu_toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Navigation (Slide-down menu) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border border-slate-200 mt-2 rounded-2xl p-4 space-y-4 shadow-xl animate-fadeIn max-w-7xl mx-auto">
          {/* Digital Clock Mobile */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-slate-600">
            <span className="text-[10px] font-medium text-slate-400">{formatDate(time)}</span>
            <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {formatTime(time)}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav_tab_mobile_${item.id}`}
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                    isActive 
                      ? 'bg-slate-950 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  
                  {item.id === 'stok' && lowStockCount > 0 && (
                    <span className="ml-auto bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[9px] animate-pulse">
                      {lowStockCount} Tipis
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Profile & Logout */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {(currentUser.fullName || currentUser.username || 'O')[0]}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">{currentUser.fullName}</div>
                <div className="text-[9px] text-slate-400 font-mono mt-1 uppercase">
                  {currentUser.role === 'OWNER' ? 'Owner' : 'Kasir'}
                </div>
              </div>
            </div>
            
            <button
              id="logout_btn_mobile"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100/50 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

