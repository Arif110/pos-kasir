import { useState, useEffect } from 'react';
import { 
  Store, 
  ShoppingCart, 
  Package, 
  FileSpreadsheet, 
  TrendingUp, 
  Settings, 
  LogOut, 
  User, 
  Clock, 
  Menu, 
  X,
  AlertTriangle
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
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const navItems = [
    { id: 'kasir', label: 'Kasir', icon: ShoppingCart, roles: ['OWNER', 'CASHIER'] },
    { id: 'stok', label: 'Stok Barang', icon: Package, roles: ['OWNER', 'CASHIER'] },
    { id: 'utang', label: 'Catatan Utang', icon: FileSpreadsheet, roles: ['OWNER', 'CASHIER'] },
    { id: 'analitik', label: 'Analitik & Laporan', icon: TrendingUp, roles: ['OWNER'] },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, roles: ['OWNER'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <header id="app_header" className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Shop Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                {shopSettings.shopName}
              </h1>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold block uppercase">
                Real-Time Cloud POS
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav_tab_${item.id}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-sm transition-all relative ${
                    isActive 
                      ? 'bg-slate-950 text-white shadow-sm border border-transparent' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  
                  {/* Stock Warnings indicator */}
                  {item.id === 'stok' && lowStockCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 animate-bounce">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Details & Digital Clock */}
          <div className="hidden md:flex items-center gap-4 border-l border-slate-200 pl-4">
            {/* Clock */}
            <div className="text-right font-mono">
              <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{formatTime(time)}</span>
              </div>
              <div className="text-[10px] text-slate-400">{formatDate(time)}</div>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.username[0]}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 leading-none">{currentUser.fullName}</div>
                <div className="text-[9px] text-slate-400 font-mono tracking-wider mt-0.5 uppercase">
                  {currentUser.role === 'OWNER' ? '📌 Owner' : '👥 Kasir'}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              id="logout_btn_desktop"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Keluar Aplikasi"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {lowStockCount > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-1 rounded-full font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>{lowStockCount} Stok Rendah</span>
              </div>
            )}
            
            <button
              id="mobile_menu_toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-5 space-y-3 animate-fadeIn shadow-lg">
          {/* Digital Clock Mobile */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-slate-600">
            <span className="text-xs">{formatDate(time)}</span>
            <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(time)}
            </span>
          </div>

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
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-slate-950 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                  
                  {item.id === 'stok' && lowStockCount > 0 && (
                    <span className="ml-auto bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Profile & Logout */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.username[0]}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {currentUser.role === 'OWNER' ? 'Owner' : 'Kasir'}
                </div>
              </div>
            </div>
            
            <button
              id="logout_btn_mobile"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100/50 transition-all"
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
