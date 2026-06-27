import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  Product, 
  Transaction, 
  Debt, 
  ShopSettings,
  CashierAccount 
} from './types';
import { dbService, DEFAULT_SETTINGS } from './lib/firebase';
import { performAutoBackup } from './lib/autoBackup';
import Login from './components/Login';
import Navbar from './components/Navbar';
import KasirTab from './components/KasirTab';
import StokTab from './components/StokTab';
import UtangTab from './components/UtangTab';
import AnalitikTab from './components/AnalitikTab';
import PengaturanTab from './components/PengaturanTab';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export default function App() {
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('pos_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Track current user in a ref for unload listener
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Handle auto-backup on window exit/close/refresh
  useEffect(() => {
    const handleUnload = () => {
      performAutoBackup(currentUserRef.current);
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);


  // Database collections states
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [cashiers, setCashiers] = useState<CashierAccount[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  
  const [activeTab, setActiveTab] = useState('kasir');
  const [isLoading, setIsLoading] = useState(true);

  // Real-Time Local Subscriptions on Mount
  useEffect(() => {
    setIsLoading(true);

    // Subscribe to products
    const unsubProducts = dbService.subscribeProducts((prods) => {
      setProducts(prods);
    });

    // Subscribe to transactions
    const unsubTransactions = dbService.subscribeTransactions((txs) => {
      setTransactions(txs);
    });

    // Subscribe to debts
    const unsubDebts = dbService.subscribeDebts((dbtList) => {
      setDebts(dbtList);
    });

    // Subscribe to shop settings
    const unsubSettings = dbService.subscribeSettings((sett) => {
      setShopSettings(sett);
    });

    // Subscribe to cashiers
    const unsubCashiers = dbService.subscribeCashiers((cashierList) => {
      setCashiers(cashierList);
    });

    // Subscribe to categories
    const unsubCategories = dbService.subscribeCategories((cats) => {
      setCategoriesList(cats);
    });

    // Stop loading indicator after a short instant timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      unsubProducts();
      unsubTransactions();
      unsubDebts();
      unsubSettings();
      unsubCashiers();
      unsubCategories();
      clearTimeout(timer);
    };
  }, []);

  // Save categories list to database
  const handleSaveCategories = async (newCats: string[]) => {
    await dbService.saveCategories(newCats);
  };

  // Session login trigger
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('pos_active_user', JSON.stringify(user));
    
    // Redirect Cashiers to the Cashier page immediately
    if (user.role === 'CASHIER') {
      setActiveTab('kasir');
    }
  };

  const handleLogout = () => {
    performAutoBackup(currentUser);
    setCurrentUser(null);
    localStorage.removeItem('pos_active_user');
  };

  // CORE WRITE OPERATIONS - Intercepts state and writes to Firebase Service
  const handleAddTransaction = async (tx: Transaction) => {
    await dbService.saveTransaction(tx);
    // Real-time optimistic update of local products state to keep it instant in UI
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const boughtItem = tx.items.find(item => item.productId === p.id);
        if (boughtItem) {
          return { 
            ...p, 
            stock: Math.max(0, p.stock - boughtItem.quantity),
            lastSoldDate: tx.date 
          };
        }
        return p;
      });
    });
  };

  const handleAddDebt = async (debt: Debt) => {
    await dbService.saveDebt(debt);
  };

  const handleSaveDebt = async (debt: Debt) => {
    await dbService.saveDebt(debt);
  };

  const handleSaveProduct = async (product: Product) => {
    await dbService.saveProduct(product);
  };

  const handleSaveProducts = async (productsList: Product[]) => {
    await dbService.saveProducts(productsList);
  };

  const handleDeleteProduct = async (id: string) => {
    await dbService.deleteProduct(id);
  };

  const handleSaveSettings = async (settings: ShopSettings) => {
    await dbService.saveSettings(settings);
    setShopSettings(settings);
  };

  const handleSaveCashier = async (cashier: CashierAccount) => {
    await dbService.saveCashier(cashier);
  };

  const handleDeleteCashier = async (id: string) => {
    await dbService.deleteCashier(id);
  };

  const handleResetAllData = async () => {
    await dbService.resetAllData();
    setCurrentUser(null);
  };

  const handleRestoreBackup = async (backupData: {
    settings: ShopSettings;
    products: Product[];
    transactions: Transaction[];
    debts: Debt[];
    cashiers?: CashierAccount[];
  }) => {
    await dbService.restoreBackupData(backupData);
  };

  // Warning thresholds calculation
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F4F7] flex flex-col items-center justify-center gap-4 text-slate-900">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-mono font-bold text-slate-800">POS</span>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold tracking-wide text-slate-800">Memuat Sistem Kasir Offline...</p>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Penyimpanan Lokal Aktif & Aman</p>
        </div>
      </div>
    );
  }

  // Render Login page if not authenticated
  if (!currentUser) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        shopSettings={shopSettings} 
        cashiers={cashiers}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F7] text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Real-time sync status indicator banner */}
      <div className="bg-slate-900 text-[11px] px-4 py-2 flex justify-between items-center text-slate-300 font-mono">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Mode Kerja: Offline (Penyimpanan Lokal Aktif)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{products.length} Barang Terdaftar</span>
          <span>•</span>
          <span>{transactions.length} Transaksi Tercatat</span>
        </div>
      </div>

      {/* Main Navbar Navigation header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        shopSettings={shopSettings}
        lowStockCount={lowStockCount}
      />

      {/* Active Tab Panel Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'kasir' && (
          <KasirTab 
            products={products} 
            shopSettings={shopSettings}
            categoriesList={categoriesList}
            onAddTransaction={handleAddTransaction}
            onAddDebt={handleAddDebt}
          />
        )}

        {activeTab === 'stok' && (
          <StokTab 
            products={products}
            shopSettings={shopSettings}
            categoriesList={categoriesList}
            onSaveProduct={handleSaveProduct}
            onSaveProducts={handleSaveProducts}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'utang' && (
          <UtangTab 
            debts={debts}
            shopSettings={shopSettings}
            onSaveDebt={handleSaveDebt}
          />
        )}

        {currentUser.role === 'OWNER' && activeTab === 'analitik' && (
          <AnalitikTab 
            transactions={transactions} 
            products={products}
            debts={debts}
            shopSettings={shopSettings}
          />
        )}

        {currentUser.role === 'OWNER' && activeTab === 'pengaturan' && (
          <PengaturanTab 
            shopSettings={shopSettings}
            products={products}
            transactions={transactions}
            debts={debts}
            cashiers={cashiers}
            categoriesList={categoriesList}
            onSaveSettings={handleSaveSettings}
            onResetAllData={handleResetAllData}
            onRestoreBackup={handleRestoreBackup}
            onSaveCashier={handleSaveCashier}
            onDeleteCashier={handleDeleteCashier}
            onSaveCategories={handleSaveCategories}
          />
        )}

        {/* Security / Authorization Fallback alert */}
        {currentUser.role === 'CASHIER' && (activeTab === 'analitik' || activeTab === 'pengaturan') && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm shadow-slate-100 animate-scaleIn">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Akses Ditolak</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Halaman analitik laporan keuangan dan konfigurasi profile toko dibatasi khusus untuk tingkatan pengguna **Owner**. Silakan hubungi pemilik toko untuk akses.
            </p>
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-[#F4F4F7] border-t border-slate-200 py-6 text-center text-slate-500 text-[10px] font-mono tracking-wider">
        <p>© {new Date().getFullYear()} {shopSettings.shopName}. All Rights Reserved.</p>
        <p className="text-slate-400 mt-1 uppercase">Sistem Kasir Pintar - Mode Offline & Mandiri (Penyimpanan Aman)</p>
      </footer>

    </div>
  );
}
