import { Product, Transaction, Debt, ShopSettings, CashierAccount } from '../types';

// DEFAULT SEED DATA
export const DEFAULT_CATEGORIES: string[] = [
  "Mie", "Kebutuhan Bayi", "Bumbu Instan", "Rokok", "Sabun & Shampo", 
  "Aksesoris", "Pembersih", "Telur", "Susu", "Perawatan Tubuh & Skincare", 
  "Tissue & Kapas", "Snack", "ATK", "Minuman", "Roti & Kue", "Obat-obatan", "Lainnya"
];

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'prod_1', code: '899100110011', name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 15000, purchasePrice: 8000, stock: 45, minStock: 5, entryDate: '2026-06-26' },
  { id: 'prod_2', code: '899100110022', name: 'Es Teh Manis', category: 'Minuman', price: 6000, purchasePrice: 2000, stock: 120, minStock: 10, entryDate: '2026-06-26' },
  { id: 'prod_3', code: '899100110033', name: 'Indomie Goreng Jumbo', category: 'Makanan', price: 10000, purchasePrice: 6500, stock: 30, minStock: 5, entryDate: '2026-06-26' },
  { id: 'prod_4', code: '899100110044', name: 'Keripik Singkong Balado', category: 'Cemilan', price: 8000, purchasePrice: 4500, stock: 18, minStock: 5, entryDate: '2026-06-26' },
  { id: 'prod_5', code: '899100110055', name: 'Roti Bakar Cokelat Keju', category: 'Makanan', price: 18000, purchasePrice: 10000, stock: 25, minStock: 3, entryDate: '2026-06-26' },
  { id: 'prod_6', code: '899100110066', name: 'Air Mineral 600ml', category: 'Minuman', price: 4000, purchasePrice: 1800, stock: 80, minStock: 10, entryDate: '2026-06-26' }
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "Toko Toserba Fazz Fazz",
  shopAddress: "Jl. Merdeka No. 45, Jakarta Pusat",
  shopPhone: "081234567890",
  qrisText: "00020101021126610016ID10202111111110203A01511100112345678901234567895204599953033605405100005802ID5913BERKAH STORE6013JAKARTA PUSAT6304A1B2",
  receiptFooter: "Terima Kasih Telah Berbelanja!\nSemoga Hari Anda Menyenangkan.",
  currencySymbol: "Rp.",
  ownerUsername: "owner",
  ownerPassword: "123",
  ownerName: "Arif Rahman",
  localPrintUrl: "http://localhost:3000/print"
};

export const DEFAULT_DEBTS: Debt[] = [
  {
    id: 'debt_1',
    customerName: 'Budi Santoso',
    customerPhone: '089877665544',
    totalDebt: 50000,
    remainingDebt: 50000,
    dueDate: '2026-07-05',
    status: 'UNPAID',
    createdAt: '2026-06-26T09:15:00.000Z',
    payments: []
  }
];

export const DEFAULT_CASHIERS: CashierAccount[] = [
  {
    id: 'cashier_1',
    username: 'kasir',
    fullName: 'Siti Aminah',
    password: '123',
    createdAt: '2026-06-26T22:00:00.000Z'
  }
];

// Helper to access Local Storage safely and transparently
export const getLocalData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

export const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Simple but powerful Local Listener system to emulate Firestore real-time snapshots
type Listener<T> = (data: T) => void;

let productListeners: Listener<Product[]>[] = [];
let transactionListeners: Listener<Transaction[]>[] = [];
let debtListeners: Listener<Debt[]>[] = [];
let settingsListeners: Listener<ShopSettings>[] = [];
let cashierListeners: Listener<CashierAccount[]>[] = [];
let categoryListeners: Listener<string[]>[] = [];

const notifyProducts = () => {
  const data = getLocalData<Product[]>('pos_products', DEFAULT_PRODUCTS);
  productListeners.forEach(cb => cb(data));
};

const notifyTransactions = () => {
  const data = getLocalData<Transaction[]>('pos_transactions', []);
  transactionListeners.forEach(cb => cb(data));
};

const notifyDebts = () => {
  const data = getLocalData<Debt[]>('pos_debts', DEFAULT_DEBTS);
  debtListeners.forEach(cb => cb(data));
};

const notifySettings = () => {
  const data = getLocalData<ShopSettings>('pos_settings', DEFAULT_SETTINGS);
  settingsListeners.forEach(cb => cb(data));
};

const notifyCashiers = () => {
  const data = getLocalData<CashierAccount[]>('pos_cashiers', DEFAULT_CASHIERS);
  cashierListeners.forEach(cb => cb(data));
};

const notifyCategories = () => {
  const data = getLocalData<string[]>('toko_categories', DEFAULT_CATEGORIES);
  categoryListeners.forEach(cb => cb(data));
};

// Auto-sync across multiple browser tabs/windows
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'pos_products') {
      notifyProducts();
    } else if (e.key === 'pos_transactions') {
      notifyTransactions();
    } else if (e.key === 'pos_debts') {
      notifyDebts();
    } else if (e.key === 'pos_settings') {
      notifySettings();
    } else if (e.key === 'pos_cashiers') {
      notifyCashiers();
    } else if (e.key === 'toko_categories') {
      notifyCategories();
    }
  });
}

// SERVICE DEFINITIONS
export const dbService = {
  // Subscribe to Products
  subscribeProducts: (callback: (products: Product[]) => void) => {
    productListeners.push(callback);
    // Send current cached data immediately
    callback(getLocalData<Product[]>('pos_products', DEFAULT_PRODUCTS));
    return () => {
      productListeners = productListeners.filter(cb => cb !== callback);
    };
  },

  // Save/Update Product
  saveProduct: async (product: Product): Promise<void> => {
    const local = getLocalData<Product[]>('pos_products', DEFAULT_PRODUCTS);
    const idx = local.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      local[idx] = product;
    } else {
      local.push(product);
    }
    setLocalData('pos_products', local);
    notifyProducts();
  },

  // Bulk Save/Update Products
  saveProducts: async (products: Product[]): Promise<void> => {
    setLocalData('pos_products', products);
    notifyProducts();
  },

  // Delete Product
  deleteProduct: async (id: string): Promise<void> => {
    const local = getLocalData<Product[]>('pos_products', DEFAULT_PRODUCTS);
    const filtered = local.filter(p => p.id !== id);
    setLocalData('pos_products', filtered);
    notifyProducts();
  },

  // Subscribe to Transactions
  subscribeTransactions: (callback: (txs: Transaction[]) => void) => {
    transactionListeners.push(callback);
    callback(getLocalData<Transaction[]>('pos_transactions', []));
    return () => {
      transactionListeners = transactionListeners.filter(cb => cb !== callback);
    };
  },

  // Save Transaction
  saveTransaction: async (tx: Transaction): Promise<void> => {
    const local = getLocalData<Transaction[]>('pos_transactions', []);
    local.unshift(tx);
    setLocalData('pos_transactions', local);
    notifyTransactions();

    // Optimistically update product stock and last sold date immediately in local state
    const localProds = getLocalData<Product[]>('pos_products', DEFAULT_PRODUCTS);
    tx.items.forEach(item => {
      const p = localProds.find(lp => lp.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - item.quantity);
        p.lastSoldDate = tx.date; // Update the date of last sold product
      }
    });
    setLocalData('pos_products', localProds);
    notifyProducts();
  },

  // Subscribe to Debts
  subscribeDebts: (callback: (debts: Debt[]) => void) => {
    debtListeners.push(callback);
    callback(getLocalData<Debt[]>('pos_debts', DEFAULT_DEBTS));
    return () => {
      debtListeners = debtListeners.filter(cb => cb !== callback);
    };
  },

  // Save Debt
  saveDebt: async (debt: Debt): Promise<void> => {
    const local = getLocalData<Debt[]>('pos_debts', DEFAULT_DEBTS);
    const idx = local.findIndex(d => d.id === debt.id);
    if (idx !== -1) {
      local[idx] = debt;
    } else {
      local.unshift(debt);
    }
    setLocalData('pos_debts', local);
    notifyDebts();
  },

  // Subscribe to Shop Settings
  subscribeSettings: (callback: (settings: ShopSettings) => void) => {
    settingsListeners.push(callback);
    callback(getLocalData<ShopSettings>('pos_settings', DEFAULT_SETTINGS));
    return () => {
      settingsListeners = settingsListeners.filter(cb => cb !== callback);
    };
  },

  // Save Settings
  saveSettings: async (settings: ShopSettings): Promise<void> => {
    setLocalData('pos_settings', settings);
    notifySettings();
  },

  // Subscribe to Cashiers
  subscribeCashiers: (callback: (cashiers: CashierAccount[]) => void) => {
    cashierListeners.push(callback);
    callback(getLocalData<CashierAccount[]>('pos_cashiers', DEFAULT_CASHIERS));
    return () => {
      cashierListeners = cashierListeners.filter(cb => cb !== callback);
    };
  },

  // Save/Update Cashier
  saveCashier: async (cashier: CashierAccount): Promise<void> => {
    const local = getLocalData<CashierAccount[]>('pos_cashiers', DEFAULT_CASHIERS);
    const idx = local.findIndex(c => c.id === cashier.id);
    if (idx !== -1) {
      local[idx] = cashier;
    } else {
      local.push(cashier);
    }
    setLocalData('pos_cashiers', local);
    notifyCashiers();
  },

  // Delete Cashier
  deleteCashier: async (id: string): Promise<void> => {
    const local = getLocalData<CashierAccount[]>('pos_cashiers', DEFAULT_CASHIERS);
    const filtered = local.filter(c => c.id !== id);
    setLocalData('pos_cashiers', filtered);
    notifyCashiers();
  },

  // Reset App Data
  resetAllData: async (): Promise<void> => {
    localStorage.clear();
    setLocalData('pos_products', DEFAULT_PRODUCTS);
    setLocalData('pos_settings', DEFAULT_SETTINGS);
    setLocalData('pos_transactions', []);
    setLocalData('pos_debts', DEFAULT_DEBTS);
    setLocalData('pos_cashiers', DEFAULT_CASHIERS);
    setLocalData('toko_categories', DEFAULT_CATEGORIES);
    
    notifyProducts();
    notifyTransactions();
    notifyDebts();
    notifySettings();
    notifyCashiers();
    notifyCategories();
  },

  // Restore Entire Backup
  restoreBackupData: async (backupData: {
    settings: ShopSettings;
    products: Product[];
    transactions: Transaction[];
    debts: Debt[];
    cashiers?: CashierAccount[];
    categories?: string[];
  }): Promise<void> => {
    setLocalData('pos_settings', backupData.settings);
    setLocalData('pos_products', backupData.products);
    setLocalData('pos_transactions', backupData.transactions);
    setLocalData('pos_debts', backupData.debts);
    if (backupData.cashiers) {
      setLocalData('pos_cashiers', backupData.cashiers);
    }
    if (backupData.categories) {
      setLocalData('toko_categories', backupData.categories);
    }

    notifySettings();
    notifyProducts();
    notifyTransactions();
    notifyDebts();
    if (backupData.cashiers) {
      notifyCashiers();
    }
    if (backupData.categories) {
      notifyCategories();
    }
  },

  // Subscribe to Categories
  subscribeCategories: (callback: (categories: string[]) => void) => {
    categoryListeners.push(callback);
    callback(getLocalData<string[]>('toko_categories', DEFAULT_CATEGORIES));
    return () => {
      categoryListeners = categoryListeners.filter(cb => cb !== callback);
    };
  },

  // Save/Update Categories
  saveCategories: async (categories: string[]): Promise<void> => {
    setLocalData('toko_categories', categories);
    notifyCategories();
  }
};
