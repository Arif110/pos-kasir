export interface Product {
  id: string;
  code: string; // Barcode / SKU
  name: string;
  category: string;
  price: number; // Selling price
  purchasePrice: number; // Buying price (for profit calculation)
  stock: number;
  minStock: number; // For low-stock alerts
  satuanJual?: string;
  satuanGrosir?: string;
  expiryDate?: string; // Format: YYYY-MM-DD
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  purchasePrice: number;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string; // ISO String
  items: TransactionItem[];
  total: number;
  totalProfit: number;
  paymentType: 'CASH' | 'QRIS' | 'DEBT';
  amountPaid: number;
  change: number;
  customerName?: string;
  notes?: string;
}

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
}

export interface Debt {
  id: string;
  customerName: string;
  customerPhone: string;
  totalDebt: number;
  remainingDebt: number;
  dueDate: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  payments: DebtPayment[];
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  qrisText: string; // Text to generate QR code (e.g. static QRIS string)
  receiptFooter: string;
  currencySymbol: string;
  logoUrl?: string;
  ownerUsername?: string;
  ownerPassword?: string;
  ownerName?: string;
}

export interface UserProfile {
  username: string;
  role: 'OWNER' | 'CASHIER';
  fullName: string;
}

export interface CashierAccount {
  id: string;
  username: string;
  fullName: string;
  password: string;
  createdAt: string;
}

export interface AutoBackup {
  id: string;
  timestamp: string;
  user: string;
  fileName: string;
  data: {
    settings: ShopSettings;
    products: Product[];
    transactions: Transaction[];
    debts: Debt[];
    cashiers?: CashierAccount[];
    categories?: string[];
    exportedAt: string;
  };
}

