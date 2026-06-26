import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  User,
  Phone,
  Calendar
} from 'lucide-react';
import { Product, CartItem, Transaction, Debt, ShopSettings } from '../types';

interface KasirTabProps {
  products: Product[];
  shopSettings: ShopSettings;
  onAddTransaction: (tx: Transaction) => Promise<void>;
  onAddDebt: (debt: Debt) => Promise<void>;
}

export default function KasirTab({ 
  products, 
  shopSettings, 
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
  
  // Invoice states
  const [showInvoice, setShowInvoice] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Transaction | null>(null);

  // Barcode input focus helper
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Derive unique categories
  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.includes(searchQuery);
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
      const cash = parseFloat(amountPaid);
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

    // Trigger Invoice View
    setActiveInvoice(transaction);
    setShowInvoice(true);
    clearCart();
  };

  const formatPrice = (num: number) => {
    return shopSettings.currencySymbol + ' ' + num.toLocaleString('id-ID');
  };

  return (
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

          {/* Categories Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                id={`category_tab_${cat}`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
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
                            : `Stok: ${remainingStock} unit`
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
                        type="number"
                        placeholder="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
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
                          onClick={() => setAmountPaid(actualDenom.toString())}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-[10px] text-slate-700 rounded font-mono border border-slate-250 shadow-sm transition-colors"
                        >
                          {actualDenom === totalValue ? 'Pas' : formatPrice(actualDenom)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Change calculation */}
                  {parseFloat(amountPaid) >= getCartTotal() && (
                    <div className="flex items-center justify-between text-xs text-emerald-800 pt-1.5 border-t border-slate-200 font-bold">
                      <span>Kembalian:</span>
                      <span className="font-extrabold font-mono text-sm text-emerald-750">
                        {formatPrice(parseFloat(amountPaid) - getCartTotal())}
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
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Catatan Transaksi</label>
                <input
                  id="transaction_notes_input"
                  type="text"
                  placeholder="Tambahkan keterangan (opsional)..."
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

            {/* Receipt Content (standard print output) */}
            <div id="printable_receipt" className="p-5 font-mono text-xs space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Store Details */}
              <div className="text-center space-y-1">
                <h4 className="text-sm font-extrabold uppercase tracking-wide">{shopSettings.shopName}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{shopSettings.shopAddress}</p>
                <p className="text-[10px] text-slate-500">Telp: {shopSettings.shopPhone}</p>
                <div className="border-b border-dashed border-slate-300 pt-2" />
              </div>

              {/* Invoice Meta details */}
              <div className="space-y-0.5 text-[11px] text-slate-600">
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
              <div className="space-y-2 text-[11px]">
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
              <div className="space-y-1 text-xs">
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
                    <span>LUNAS SYNC</span>
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
              <div className="text-center text-[10px] text-slate-500 pt-2 space-y-1">
                <div className="border-t border-dashed border-slate-300 pt-2" />
                <p className="whitespace-pre-line">{shopSettings.receiptFooter}</p>
                <p className="font-bold text-[9px] text-slate-400 mt-1">POWERED BY KASIR PINTAR CLOUD</p>
              </div>
            </div>

            {/* Print and Close controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                id="print_invoice_btn"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                id="close_invoice_btn"
                onClick={() => {
                  setShowInvoice(false);
                  setActiveInvoice(null);
                }}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <span>Selesai</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
