import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  QrCode, 
  DollarSign, 
  UserPlus, 
  FileText, 
  Printer, 
  RotateCcw,
  CheckCircle2,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Calendar,
  Copy,
  Download,
  Check,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { Product, CartItem, Transaction, Debt, ShopSettings } from '../types';

interface StockAlertToast {
  id: string;
  productName: string;
  remainingStock: number;
  minStock: number;
}

interface KasirTabProps {
  products: Product[];
  shopSettings: ShopSettings;
  categoriesList?: string[];
  onAddTransaction: (tx: Transaction) => Promise<void>;
  onAddDebt: (debt: Debt) => Promise<void>;
}

export default function KasirTab({ 
  products, 
  shopSettings, 
  categoriesList = [],
  onAddTransaction, 
  onAddDebt 
}: KasirTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Checkout states
  const [paymentType, setPaymentType] = useState<'CASH' | 'QRIS' | 'DEBT'>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [transactionNotes, setTransactionNotes] = useState('');
  
  // Toast states for stock alerts
  const [stockAlerts, setStockAlerts] = useState<StockAlertToast[]>([]);

  // Low stock warning banner states
  const [showLowStockBanner, setShowLowStockBanner] = useState(true);
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  const lowStockInDb = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  // Expiry warning banner states
  const [showExpiryAlert, setShowExpiryAlert] = useState(true);
  const [expiryFilter, setExpiryFilter] = useState<'ALL' | 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'ALERT'>('ALL');

  const getExpiryStatus = (expiryDateStr: string | undefined): {
    status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'ALERT' | 'SAFE' | 'NONE';
    daysLeft: number;
    monthsLeft: number;
    label: string;
  } => {
    if (!expiryDateStr) {
      return { status: 'NONE', daysLeft: 9999, monthsLeft: 999, label: '' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.44; // approximate number of days in a month

    if (diffDays <= 0) {
      return { status: 'EXPIRED', daysLeft: diffDays, monthsLeft: diffMonths, label: 'KADALUARSA' };
    } else if (diffMonths <= 1) {
      return { status: 'CRITICAL', daysLeft: diffDays, monthsLeft: diffMonths, label: 'Sisa < 1 Bulan' };
    } else if (diffMonths <= 2) {
      return { status: 'WARNING', daysLeft: diffDays, monthsLeft: diffMonths, label: 'Sisa < 2 Bulan' };
    } else if (diffMonths <= 3) {
      return { status: 'ALERT', daysLeft: diffDays, monthsLeft: diffMonths, label: 'Sisa < 3 Bulan' };
    }

    return { status: 'SAFE', daysLeft: diffDays, monthsLeft: diffMonths, label: 'Aman' };
  };

  const expiringProducts = useMemo(() => {
    return products
      .map(p => ({ product: p, expiryInfo: getExpiryStatus(p.expiryDate) }))
      .filter(item => ['EXPIRED', 'CRITICAL', 'WARNING', 'ALERT'].includes(item.expiryInfo.status))
      .sort((a, b) => a.expiryInfo.daysLeft - b.expiryInfo.daysLeft);
  }, [products]);
  
  // Auto dismiss stock alerts after 6 seconds
  useEffect(() => {
    if (stockAlerts.length > 0) {
      const timer = setTimeout(() => {
        setStockAlerts(prev => prev.slice(1));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [stockAlerts]);
  
  const parsedAmountPaid = parseFloat(amountPaid.replace(/\./g, '')) || 0;
  
  // Invoice states
  const [showInvoice, setShowInvoice] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Transaction | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<'58mm' | '80mm'>('58mm');

  // Plain-Text receipt compiler for copy/download fallbacks and thermal bluetooth printers
  const generateTextReceipt = (invoice: Transaction, settings: ShopSettings): string => {
    const colWidth = 32;
    const divider = '='.repeat(colWidth);
    const dashedDivider = '-'.repeat(colWidth);
    
    const centerText = (text: string) => {
      if (text.length >= colWidth) return text.substring(0, colWidth);
      const padding = Math.floor((colWidth - text.length) / 2);
      return ' '.repeat(padding) + text;
    };

    const justifyText = (left: string, right: string) => {
      const spaceNeeded = colWidth - left.length - right.length;
      if (spaceNeeded <= 0) {
        return left + ' ' + right;
      }
      return left + ' '.repeat(spaceNeeded) + right;
    };

    let out = '';
    out += centerText(settings.shopName.toUpperCase()) + '\n';
    out += centerText(settings.shopAddress) + '\n';
    out += centerText('Telp: ' + settings.shopPhone) + '\n';
    out += divider + '\n';
    
    out += 'No: ' + invoice.invoiceNumber + '\n';
    out += 'Tgl: ' + new Date(invoice.date).toLocaleString('id-ID') + '\n';
    out += 'Metode: ' + invoice.paymentType + '\n';
    if (invoice.customerName) {
      out += 'Pelanggan: ' + invoice.customerName.toUpperCase() + '\n';
    }
    out += divider + '\n';

    invoice.items.forEach(item => {
      out += item.name.substring(0, colWidth) + '\n';
      const leftDetail = `  ${item.quantity} x ${(item.price).toLocaleString('id-ID')}`;
      const rightDetail = (item.subtotal).toLocaleString('id-ID');
      out += justifyText(leftDetail, rightDetail) + '\n';
    });

    out += dashedDivider + '\n';
    out += justifyText('TOTAL:', (invoice.total).toLocaleString('id-ID')) + '\n';
    
    if (invoice.paymentType === 'CASH') {
      out += justifyText('BAYAR (TUNAI):', (invoice.amountPaid).toLocaleString('id-ID')) + '\n';
      out += justifyText('KEMBALIAN:', (invoice.change).toLocaleString('id-ID')) + '\n';
    } else if (invoice.paymentType === 'QRIS') {
      out += centerText('STATUS QRIS: LUNAS') + '\n';
    } else if (invoice.paymentType === 'DEBT') {
      out += justifyText('SISA UTANG:', (invoice.total).toLocaleString('id-ID')) + '\n';
    }
    
    out += divider + '\n';
    out += centerText(settings.receiptFooter) + '\n';
    out += centerText('TERIMA KASIH') + '\n';
    
    return out;
  };

  const copyTextReceipt = (invoice: Transaction | null) => {
    if (!invoice) return;
    const text = generateTextReceipt(invoice, shopSettings);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text receipt:', err);
    });
  };

  const downloadTextReceipt = (invoice: Transaction | null) => {
    if (!invoice) return;
    const text = generateTextReceipt(invoice, shopSettings);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk-${invoice.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Barcode input focus helper
  const barcodeRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Derive unique categories
  const categories = ['Semua', ...Array.from(new Set(categoriesList && categoriesList.length > 0 ? categoriesList : products.map(p => p.category)))];

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.includes(searchQuery);
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || p.stock <= p.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      
      // Limit to available stock
      if (currentQty >= product.stock) return prevCart;
      
      if (existing) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          const productStock = item.product.stock;
          
          if (newQty <= 0) return null;
          if (newQty > productStock) return item; // limit to stock
          
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid('');
    setCustomerName('');
    setCustomerPhone('');
    setDueDate('');
    setTransactionNotes('');
  };

  // Barcode quick adder
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const matchedProduct = products.find(p => p.code === barcodeInput.trim());
    if (matchedProduct) {
      addToCart(matchedProduct);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan Barcode "${barcodeInput}" tidak ditemukan!`);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getCartProfit = () => {
    return cart.reduce((sum, item) => {
      const margin = item.product.price - item.product.purchasePrice;
      return sum + (margin * item.quantity);
    }, 0);
  };

  const handleProcessTransaction = async () => {
    const total = getCartTotal();
    if (total === 0) return;

    let invoiceAmountPaid = 0;
    let change = 0;

    // Validation
    if (paymentType === 'CASH') {
      const cash = parseFloat(amountPaid.replace(/\./g, ''));
      if (isNaN(cash) || cash < total) {
        alert('Jumlah bayar tidak mencukupi atau tidak valid!');
        return;
      }
      invoiceAmountPaid = cash;
      change = cash - total;
    } else if (paymentType === 'QRIS') {
      invoiceAmountPaid = total;
      change = 0;
    } else if (paymentType === 'DEBT') {
      if (!customerName.trim()) {
        alert('Nama pelanggan wajib diisi untuk transaksi utang!');
        return;
      }
      invoiceAmountPaid = 0;
      change = 0;
    }

    const txId = 'tx_' + Date.now();
    const invoiceNum = 'INV/' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '/' + Math.floor(1000 + Math.random() * 9000);

    const transaction: Transaction = {
      id: txId,
      invoiceNumber: invoiceNum,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        purchasePrice: item.product.purchasePrice,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      })),
      total: total,
      totalProfit: getCartProfit(),
      paymentType: paymentType,
      amountPaid: invoiceAmountPaid,
      change: change,
      customerName: customerName.trim() || undefined,
      notes: transactionNotes.trim() || undefined
    };

    // Save transaction
    await onAddTransaction(transaction);

    // If DEBT, also log inside debt table
    if (paymentType === 'DEBT') {
      const debtId = 'debt_' + Date.now();
      const newDebt: Debt = {
        id: debtId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || '-',
        totalDebt: total,
        remainingDebt: total,
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days fallback
        status: 'UNPAID',
        payments: [],
        createdAt: new Date().toISOString()
      };
      await onAddDebt(newDebt);
    }

    // Check for products reaching or dropping below minStock
    const lowStockItems: StockAlertToast[] = [];
    cart.forEach(item => {
      const remainingStock = Math.max(0, item.product.stock - item.quantity);
      if (remainingStock <= item.product.minStock) {
        lowStockItems.push({
          id: `${item.product.id}_${Date.now()}_${Math.random()}`,
          productName: item.product.name,
          remainingStock: remainingStock,
          minStock: item.product.minStock
        });
      }
    });

    if (lowStockItems.length > 0) {
      setStockAlerts(prev => [...prev, ...lowStockItems]);
    }

    // Trigger Invoice View
    setActiveInvoice(transaction);
    setShowInvoice(true);
    clearCart();
  };

  const formatPrice = (num: number) => {
    return shopSettings.currencySymbol + ' ' + num.toLocaleString('id-ID');
  };

  return (
    <div className="space-y-4 w-full">
      {/* Expiration Alerts Notification Banner */}
      {expiringProducts.length > 0 && (() => {
        const expiredCount = expiringProducts.filter(p => p.expiryInfo.status === 'EXPIRED').length;
        const criticalCount = expiringProducts.filter(p => p.expiryInfo.status === 'CRITICAL').length;
        const warningCount = expiringProducts.filter(p => p.expiryInfo.status === 'WARNING').length;
        const alertCount = expiringProducts.filter(p => p.expiryInfo.status === 'ALERT').length;

        const filteredExpiringProducts = expiringProducts.filter(({ expiryInfo }) => {
          if (expiryFilter === 'ALL') return true;
          return expiryInfo.status === expiryFilter;
        });

        return (
          <div id="premium_expiry_alert_banner" className="bg-gradient-to-r from-amber-50/80 via-white to-red-50/40 border border-amber-200/90 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-4">
              <div className="flex gap-3 items-start">
                <div className="bg-amber-100 p-2.5 rounded-full text-amber-700 shadow-inner flex shrink-0 animate-pulse">
                  <AlertTriangle className="w-5.5 h-5.5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    <span>Notifikasi Batas Kedaluarsa Barang</span>
                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                      {expiringProducts.length} Barang
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Pantau produk yang telah lewat tanggal kedaluarsa atau mendekati jatuh tempo dalam 3 bulan mendatang untuk meminimalkan kerugian toko Anda.
                  </p>
                </div>
              </div>
              
              <button
                id="toggle_expiry_alert_btn"
                type="button"
                onClick={() => setShowExpiryAlert(!showExpiryAlert)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60 rounded-xl px-4 py-2 shadow-sm transition-all shrink-0 self-start sm:self-center"
              >
                {showExpiryAlert ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Sembunyikan Panel</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Tampilkan Semua ({expiringProducts.length})</span>
                  </>
                )}
              </button>
            </div>

            {showExpiryAlert && (
              <div className="space-y-4 animate-fadeIn">
                {/* Filter Tabs Inside Expiry Banner */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setExpiryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      expiryFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    Semua ({expiringProducts.length})
                  </button>
                  {expiredCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpiryFilter('EXPIRED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        expiryFilter === 'EXPIRED'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      Expired ({expiredCount})
                    </button>
                  )}
                  {criticalCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpiryFilter('CRITICAL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        expiryFilter === 'CRITICAL'
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'text-red-500 hover:bg-red-50/50'
                      }`}
                    >
                      &lt; 1 Bln ({criticalCount})
                    </button>
                  )}
                  {warningCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpiryFilter('WARNING')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        expiryFilter === 'WARNING'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-amber-600 hover:bg-amber-50/50'
                      }`}
                    >
                      &lt; 2 Bln ({warningCount})
                    </button>
                  )}
                  {alertCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpiryFilter('ALERT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        expiryFilter === 'ALERT'
                          ? 'bg-yellow-500 text-slate-900 shadow-sm'
                          : 'text-yellow-700 hover:bg-yellow-50/50'
                      }`}
                    >
                      &lt; 3 Bln ({alertCount})
                    </button>
                  )}
                </div>

                {/* Expiry Cards Grid */}
                {filteredExpiringProducts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    Tidak ada barang dengan kriteria kedaluarsa ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-1">
                    {filteredExpiringProducts.map(({ product, expiryInfo }) => {
                      // Custom borders & badges based on severity
                      let severityColor = 'border-l-red-600 bg-red-50/50 text-red-950';
                      let labelText = '🔴 KADALUARSA';
                      if (expiryInfo.status === 'CRITICAL') {
                        severityColor = 'border-l-red-500 bg-red-50/30 text-red-900';
                        labelText = '🔴 Sisa < 1 Bulan';
                      } else if (expiryInfo.status === 'WARNING') {
                        severityColor = 'border-l-amber-500 bg-amber-50/40 text-amber-900';
                        labelText = '🟠 Sisa < 2 Bulan';
                      } else if (expiryInfo.status === 'ALERT') {
                        severityColor = 'border-l-yellow-400 bg-yellow-50/30 text-yellow-900';
                        labelText = '🟡 Sisa < 3 Bulan';
                      }

                      return (
                        <div 
                          key={product.id} 
                          className={`p-3 rounded-xl border border-slate-200 border-l-4 ${severityColor} text-xs flex flex-col justify-between gap-2.5 transition-all hover:shadow-md hover:scale-[1.01]`}
                        >
                          <div className="space-y-1">
                            <div className="font-extrabold truncate text-slate-900" title={product.name}>
                              {product.name}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span className="font-mono">SKU: {product.code}</span>
                              <span className="font-semibold bg-slate-100 text-slate-700 px-1 rounded">
                                Stok: {product.stock} {product.satuanJual || 'Pcs'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-500 font-mono">
                              Exp: {product.expiryDate}
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/80 shadow-sm">
                              {labelText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Premium Low Stock Warning Banner */}
      {lowStockInDb.length > 0 && (
        <div id="low_stock_cashier_alert" className="bg-gradient-to-r from-amber-50/70 via-white to-orange-50/30 border border-amber-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2.5 items-start">
              <div className="bg-amber-100 p-2 rounded-full text-amber-700 shrink-0 flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <span>Peringatan Stok Barang Menipis</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                    {lowStockInDb.length} Produk
                  </span>
                </h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Beberapa komoditas telah berada di bawah batas minimum stok. Segera hubungi distributor untuk re-stock barang.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* Quick toggle filter on cashier list */}
              <button
                id="btn_toggle_low_stock_filter"
                type="button"
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  filterLowStockOnly
                    ? 'bg-amber-600 border-amber-600 text-white font-extrabold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{filterLowStockOnly ? 'Tampilkan Semua Barang' : 'Filter Stok Menipis'}</span>
              </button>

              {/* Show/Hide details panel */}
              <button
                id="btn_toggle_low_stock_banner"
                type="button"
                onClick={() => setShowLowStockBanner(!showLowStockBanner)}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/50 rounded-xl px-3 py-2 transition-all shadow-sm cursor-pointer"
                title="Sembunyikan rincian"
              >
                {showLowStockBanner ? 'Sembunyikan Rincian' : `Lihat Semua (${lowStockInDb.length})`}
              </button>
            </div>
          </div>

          {showLowStockBanner && (
            <div className="border-t border-amber-100 pt-3 mt-1 animate-fadeIn">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Daftar Barang Kritis & Stok Minimum</span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {lowStockInDb.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  return (
                    <div 
                      id={`low_stock_item_${p.id}`}
                      key={p.id} 
                      onClick={() => {
                        if (p.stock > 0) addToCart(p);
                      }}
                      className={`min-w-[190px] max-w-[220px] p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all select-none bg-white shadow-sm hover:shadow-md cursor-pointer ${
                        isOutOfStock 
                          ? 'border-red-200 bg-red-50/10 hover:border-red-300 pointer-events-none opacity-60' 
                          : 'border-slate-150 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={p.name}>{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {p.code}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded leading-none ${
                          isOutOfStock 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isOutOfStock ? 'HABIS' : `Sisa ${p.stock} ${p.satuanJual || 'Pcs'}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">Min: {p.minStock}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Products & Search Section */}
      <div id="cashier_left" className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        
        {/* Top Search, Category & Barcode Scanners */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                id="cashier_search"
                type="text"
                placeholder="Cari nama barang atau kode barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-950 transition-colors"
              />
            </div>

            {/* Barcode Simulator Quick-Adder */}
            <form onSubmit={handleBarcodeSubmit} className="sm:w-64 flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <ScanLine className="w-4 h-4 text-slate-500" />
                </span>
                <input
                  id="barcode_simulator_input"
                  ref={barcodeRef}
                  type="text"
                  placeholder="Scan Barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 bg-white border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-950 text-sm font-mono"
                />
              </div>
              <button
                id="barcode_submit_btn"
                type="submit"
                className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                title="Masukkan Barcode"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Categories Selector with Slider Controls */}
          <div className="relative flex items-center w-full group/slider pt-1">
            {/* Left Button */}
            <button
              id="category_slide_left"
              type="button"
              onClick={() => scrollCategories('left')}
              className="absolute left-0 z-10 p-1.5 bg-white/95 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-slate-900 transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 focus:opacity-100"
              title="Geser Kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Categories container */}
            <div 
              ref={categoryScrollRef}
              className="flex gap-2 overflow-x-auto pb-1.5 w-full scroll-smooth px-8 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((cat) => (
                <button
                  id={`category_tab_${cat}`}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-950 text-white border-slate-950 shadow-sm font-extrabold scale-[1.02]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right Button */}
            <button
              id="category_slide_right"
              type="button"
              onClick={() => scrollCategories('right')}
              className="absolute right-0 z-10 p-1.5 bg-white/95 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-slate-900 transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 focus:opacity-100"
              title="Geser Kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div id="products_grid" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] lg:max-h-[70vh] pr-1">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock <= p.minStock && p.stock > 0;
            const cartQty = cart.find(item => item.product.id === p.id)?.quantity || 0;
            const remainingStock = p.stock - cartQty;

            return (
              <button
                id={`product_card_${p.id}`}
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={isOutOfStock || remainingStock <= 0}
                className={`relative flex flex-col text-left bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md hover:translate-y-[-2px] active:scale-95 ${
                  isOutOfStock 
                    ? 'opacity-40 border-slate-200 pointer-events-none' 
                    : remainingStock <= 0 
                      ? 'border-amber-400 ring-1 ring-amber-400/20'
                      : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                {/* Visual Category Label */}
                <div className="px-3 pt-3 flex justify-between items-start">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    {p.category}
                  </span>
                  
                  {cartQty > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow">
                      {cartQty}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      SKU: {p.code}
                    </p>
                  </div>

                  <div className="mt-3">
                    <div className="text-base font-extrabold text-emerald-750">
                      {formatPrice(p.price)}
                    </div>
                    
                    {/* Stock indicator */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        isOutOfStock 
                          ? 'bg-red-500' 
                          : remainingStock <= p.minStock 
                            ? 'bg-amber-500 animate-pulse' 
                            : 'bg-emerald-500'
                      }`} />
                      <span className="text-[10px] text-slate-500">
                        {isOutOfStock 
                          ? 'Habis' 
                          : remainingStock <= 0 
                            ? 'Keranjang Penuh'
                            : `Stok: ${remainingStock} ${p.satuanJual || 'Pcs'}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              Barang tidak ditemukan. Coba ganti kata kunci atau pilih kategori lain.
            </div>
          )}
        </div>
      </div>

      {/* Cashier Sidebar / Cart Section */}
      <div id="cashier_right" className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-4 text-slate-950">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-extrabold text-slate-900">Keranjang Belanja</h2>
          </div>
          {cart.length > 0 && (
            <button
              id="clear_cart_btn"
              onClick={clearCart}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="space-y-2.5 overflow-y-auto max-h-[25vh] lg:max-h-[35vh] pr-1">
          {cart.map((item) => (
            <div 
              id={`cart_item_${item.product.id}`}
              key={item.product.id}
              className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:border-slate-350 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {item.product.name}
                </h4>
                <div className="text-[11px] text-emerald-850 font-mono mt-0.5 font-bold">
                  {formatPrice(item.product.price)}
                </div>
              </div>

              {/* Quantity Changer */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-slate-250">
                <button
                  id={`cart_minus_${item.product.id}`}
                  onClick={() => updateQuantity(item.product.id, -1)}
                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-950 rounded transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-900 w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  id={`cart_plus_${item.product.id}`}
                  onClick={() => updateQuantity(item.product.id, 1)}
                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-950 rounded transition-colors"
                  disabled={item.quantity >= item.product.stock}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item Trash Remove */}
              <button
                id={`cart_remove_${item.product.id}`}
                onClick={() => removeFromCart(item.product.id)}
                className="p-1.5 text-slate-400 hover:text-red-750 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
              <ShoppingCart className="w-8 h-8 text-slate-300 animate-pulse" />
              <span>Keranjang masih kosong.<br/>Klik barang untuk menambahkan.</span>
            </div>
          )}
        </div>

        {/* Calculations Block */}
        <div className="border-t border-slate-100 pt-3.5 space-y-3.5">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-semibold">Total Belanja</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono">
              {formatPrice(getCartTotal())}
            </span>
          </div>

          {cart.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              {/* Payment Type Tabs */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    id="pay_cash_tab"
                    onClick={() => setPaymentType('CASH')}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition-all border ${
                      paymentType === 'CASH'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                        : 'bg-white border-slate-250 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tunai</span>
                  </button>
                  <button
                    id="pay_qris_tab"
                    onClick={() => setPaymentType('QRIS')}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition-all border ${
                      paymentType === 'QRIS'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                        : 'bg-white border-slate-250 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>QRIS</span>
                  </button>
                  <button
                    id="pay_debt_tab"
                    onClick={() => setPaymentType('DEBT')}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition-all border ${
                      paymentType === 'DEBT'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                        : 'bg-white border-slate-250 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Utang</span>
                  </button>
                </div>
              </div>

               {/* CASH Payment UI */}
              {paymentType === 'CASH' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">JUMLAH BAYAR (TUNAI)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-extrabold font-mono">
                        {shopSettings.currencySymbol}
                      </span>
                      <input
                        id="amount_paid_cash"
                        type="text"
                        placeholder="0"
                        value={amountPaid}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setAmountPaid(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                        }}
                        className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400 font-mono font-bold focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  {/* Smart cash shortcut buttons */}
                  <div className="flex flex-wrap gap-1">
                    {[getCartTotal(), 5000, 10000, 20000, 50000, 100000].map((denom, i) => {
                      const totalValue = getCartTotal();
                      const actualDenom = i === 0 ? denom : (Math.ceil(totalValue / denom) * denom);
                      if (actualDenom < totalValue) return null;
                      return (
                        <button
                          id={`denom_btn_${i}`}
                          key={i}
                          type="button"
                          onClick={() => setAmountPaid(actualDenom.toLocaleString('id-ID'))}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-[10px] text-slate-700 rounded font-mono border border-slate-250 shadow-sm transition-colors"
                        >
                          {actualDenom === totalValue ? 'Pas' : formatPrice(actualDenom)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Change calculation */}
                  {parsedAmountPaid >= getCartTotal() && (
                    <div className="flex items-center justify-between text-xs text-emerald-800 pt-1.5 border-t border-slate-200 font-bold">
                      <span>Kembalian:</span>
                      <span className="font-extrabold font-mono text-sm text-emerald-750">
                        {formatPrice(parsedAmountPaid - getCartTotal())}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* QRIS Payment UI */}
              {paymentType === 'QRIS' && (
                <div className="text-center p-2.5 bg-white rounded border border-slate-200 space-y-2">
                  <div className="mx-auto w-32 h-32 bg-white p-2 rounded relative flex items-center justify-center border border-slate-200 shadow-sm">
                    <img 
                      id="qris_scanner_preview"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shopSettings.qrisText)}`} 
                      alt="QRIS QR Code" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <p className="font-extrabold text-indigo-800">Scan QRIS Atas Nama Toko</p>
                    <p className="text-slate-400 mt-0.5">Silakan scan kode QR di atas untuk membayar <span className="font-bold text-slate-800">{formatPrice(getCartTotal())}</span></p>
                  </div>
                </div>
              )}

              {/* DEBT Payment UI */}
              {paymentType === 'DEBT' && (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">NAMA PELANGGAN *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="debt_cust_name"
                        type="text"
                        required
                        placeholder="Nama Lengkap"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">NO. TELEPON / WA</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="debt_cust_phone"
                        type="text"
                        placeholder="0812xxxxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">TANGGAL JATUH TEMPO *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="debt_due_date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Notes field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Keterangan / Catatan Tambahan (Opsional)</label>
                <input
                  id="transaction_notes_input"
                  type="text"
                  placeholder="Contoh: Meja 5, bungkus, dll (opsional)..."
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Submit Checkout processing Button */}
              <button
                id="process_checkout_btn"
                onClick={handleProcessTransaction}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all text-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Bayar Sekarang ({formatPrice(getCartTotal())})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Popup Modal */}
      {showInvoice && activeInvoice && (
        <div id="invoice_modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header visual */}
            <div className="bg-slate-950 p-5 text-center text-white flex flex-col items-center">
              <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Transaksi Berhasil</h3>
              <p className="text-[10px] text-slate-300 font-mono mt-0.5">{activeInvoice.invoiceNumber}</p>
            </div>

            {/* Format Selector */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Format Kertas:</span>
              <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
                <button
                  id="select_format_58mm"
                  type="button"
                  onClick={() => setReceiptFormat('58mm')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    receiptFormat === '58mm'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Thermal 58mm
                </button>
                <button
                  id="select_format_80mm"
                  type="button"
                  onClick={() => setReceiptFormat('80mm')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    receiptFormat === '80mm'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Thermal 80mm
                </button>
              </div>
            </div>

            {/* Receipt Content (standard print output) */}
            <div 
              id="printable_receipt" 
              className={`p-5 font-mono space-y-4 max-h-[50vh] overflow-y-auto mx-auto border-x border-b border-slate-100 bg-slate-50/40 shadow-inner transition-all duration-300 ${
                receiptFormat === '58mm' 
                  ? 'receipt-58mm max-w-[270px] text-[10px]' 
                  : 'receipt-80mm max-w-full text-xs'
              }`}
            >
              {/* Store Details */}
              <div className="text-center space-y-1">
                {shopSettings.logoUrl && (
                  <div className="flex justify-center mb-2.5">
                    <img 
                      src={shopSettings.logoUrl} 
                      alt="Logo Toko" 
                      className="max-h-12 w-auto object-contain max-w-[90px] rounded-lg bg-white p-0.5 border border-slate-100" 
                    />
                  </div>
                )}
                <h4 className="receipt-title text-sm font-extrabold uppercase tracking-wide">{shopSettings.shopName}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{shopSettings.shopAddress}</p>
                <p className="text-[10px] text-slate-500">Telp: {shopSettings.shopPhone}</p>
                <div className="border-b border-dashed border-slate-300 pt-2" />
              </div>

              {/* Invoice Meta details */}
              <div className="receipt-meta space-y-0.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span className="font-bold">{new Date(activeInvoice.date).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-bold">{activeInvoice.paymentType}</span>
                </div>
                {activeInvoice.customerName && (
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-bold uppercase">{activeInvoice.customerName}</span>
                  </div>
                )}
                <div className="border-b border-dashed border-slate-300 pt-2" />
              </div>

              {/* Items Table */}
              <div className="receipt-items space-y-2 text-[11px]">
                {activeInvoice.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div>{item.name}</div>
                      <div className="text-slate-500">{item.quantity} x {item.price.toLocaleString('id-ID')}</div>
                    </div>
                    <div className="font-bold">{(item.subtotal).toLocaleString('id-ID')}</div>
                  </div>
                ))}
                <div className="border-b border-dashed border-slate-300 pt-2" />
              </div>

              {/* Summary */}
              <div className="receipt-summary space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold font-mono">{activeInvoice.total.toLocaleString('id-ID')}</span>
                </div>
                {activeInvoice.paymentType === 'CASH' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Tunai Dibayar:</span>
                      <span className="font-mono">{activeInvoice.amountPaid.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold border-t border-dotted border-slate-200 pt-1">
                      <span>Kembalian:</span>
                      <span className="font-mono">{activeInvoice.change.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
                {activeInvoice.paymentType === 'QRIS' && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Status QRIS:</span>
                    <span>LUNAS</span>
                  </div>
                )}
                {activeInvoice.paymentType === 'DEBT' && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>Sisa Utang:</span>
                    <span className="font-mono">{activeInvoice.total.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                {activeInvoice.notes && (
                  <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-500 mt-2 italic border border-slate-150">
                    Catatan: {activeInvoice.notes}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="receipt-footer text-center text-[10px] text-slate-500 pt-2 space-y-1">
                <div className="border-t border-dashed border-slate-300 pt-2" />
                <p className="whitespace-pre-line">{shopSettings.receiptFooter}</p>
                <p className="font-bold text-[9px] text-slate-400 mt-1">POWERED BY KASIR PINTAR OFFLINE</p>
              </div>
            </div>

            {/* Quick Actions (Copy & Download Plain Text Struk) */}
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex gap-2 justify-center items-center">
              <button
                id="copy_invoice_text_btn"
                onClick={() => copyTextReceipt(activeInvoice)}
                className="flex-1 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Berhasil Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Struk (WA/Bluetooth)</span>
                  </>
                )}
              </button>
              <button
                id="download_invoice_txt_btn"
                onClick={() => downloadTextReceipt(activeInvoice)}
                className="flex-1 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Unduh File TXT</span>
              </button>
            </div>

            {/* Print and Close controls */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <button
                id="print_invoice_btn"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Struk</span>
              </button>
              <button
                id="close_invoice_btn"
                onClick={() => {
                  setShowInvoice(false);
                  setActiveInvoice(null);
                }}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <span>Selesai</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Stock Alert Toast Notifications Container */}
      {stockAlerts.length > 0 && (
        <div id="stock_alert_toast_container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto">
          {stockAlerts.map((alert) => (
            <div 
              key={alert.id}
              className="bg-white border-l-4 border-l-amber-500 border border-slate-200 text-slate-800 rounded-xl p-4 shadow-xl flex gap-3 relative hover:shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100"
            >
              <div className="bg-amber-50 p-2 rounded-lg text-amber-600 self-start shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-xs text-slate-900">Stok Mencapai Batas Minimum!</h4>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Produk <strong className="text-slate-900 font-extrabold">{alert.productName}</strong> hampir habis setelah transaksi ini.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono mt-1 text-slate-500">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Sisa: <strong className="text-red-600 font-bold">{alert.remainingStock}</strong>
                  </span>
                  <span>|</span>
                  <span className="bg-amber-50/50 px-1.5 py-0.5 rounded border border-amber-100">
                    Min: <strong className="text-amber-700 font-semibold">{alert.minStock}</strong>
                  </span>
                </div>
              </div>
              <button 
                id={`close_toast_${alert.id}`}
                onClick={() => setStockAlerts(prev => prev.filter(x => x.id !== alert.id))}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md transition-colors self-start shrink-0 cursor-pointer"
                title="Sembunyikan Peringatan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      </div>
    </div>
  );
}
