import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  Search, 
  FileText, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight, 
  X, 
  ArrowDownLeft,
  RefreshCw,
  Clock,
  Printer,
  Copy,
  Download,
  Check,
  Package
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Transaction, Product, Debt, ShopSettings } from '../types';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs font-sans space-y-1">
        <p className="font-bold text-slate-200">{payload[0].payload.name}</p>
        <p className="font-mono text-indigo-400">
          Stok: <span className="font-extrabold text-white">{payload[0].value.toLocaleString('id-ID')}</span> unit
        </p>
      </div>
    );
  }
  return null;
};

interface AnalitikTabProps {
  transactions: Transaction[];
  products: Product[];
  debts: Debt[];
  shopSettings: ShopSettings;
}

export default function AnalitikTab({ 
  transactions, 
  products, 
  debts, 
  shopSettings 
}: AnalitikTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'STATISTIK' | 'RIWAYAT_PENJUALAN'>('STATISTIK');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

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

  const formatPrice = (num: number) => {
    return shopSettings.currencySymbol + ' ' + num.toLocaleString('id-ID');
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // METRICS DERIVATIONS
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalProfit = transactions.reduce((sum, t) => sum + t.totalProfit, 0);
  const totalTxCount = transactions.length;
  
  // Active outstanding debt sum
  const totalOutstandingDebt = debts
    .filter(d => d.status !== 'PAID')
    .reduce((sum, d) => sum + d.remainingDebt, 0);

  // Best-seller ranks calculation
  const productSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.subtotal;
    });
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxQty = bestSellers.length > 0 ? Math.max(...bestSellers.map(b => b.qty)) : 1;

  // Last 7 days trend line compilation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailyTrend = last7Days.map(dateStr => {
    const dayTxs = transactions.filter(t => t.date.split('T')[0] === dateStr);
    const totalSales = dayTxs.reduce((sum, t) => sum + t.total, 0);
    const totalMargin = dayTxs.reduce((sum, t) => sum + t.totalProfit, 0);
    return {
      date: new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      sales: totalSales,
      profit: totalMargin
    };
  });

  // Category stock data compilation
  const categoryStockData = useMemo(() => {
    const map: { [key: string]: number } = {};
    products.forEach(p => {
      const cat = p.category || 'Lainnya';
      map[cat] = (map[cat] || 0) + p.stock;
    });
    return Object.entries(map)
      .map(([name, stock]) => ({ name, stock }))
      .sort((a, b) => b.stock - a.stock);
  }, [products]);

  const totalAllStock = useMemo(() => {
    return categoryStockData.reduce((sum, item) => sum + item.stock, 0);
  }, [categoryStockData]);

  const dominantCategory = categoryStockData.length > 0 ? categoryStockData[0] : null;

  // Calculate SVG line nodes
  const maxTrendValue = Math.max(...dailyTrend.map(d => d.sales), 50000);
  const chartHeight = 150;
  const chartWidth = 500;
  const padding = 35;

  const points = dailyTrend.map((d, index) => {
    const x = padding + (index * (chartWidth - padding * 2) / (dailyTrend.length - 1));
    const y = chartHeight - padding - (d.sales * (chartHeight - padding * 2) / maxTrendValue);
    return { x, y, label: d.date, val: d.sales };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Filter transaction histories
  const filteredHistories = transactions.filter(t => {
    const matchesSearch = t.invoiceNumber.toLowerCase().includes(historySearch.toLowerCase()) || 
                          (t.customerName && t.customerName.toLowerCase().includes(historySearch.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Selector Subtabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-80">
        <button
          id="tab_analitik_dashboard"
          onClick={() => setActiveSubTab('STATISTIK')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'STATISTIK'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Dashboard Analitik
        </button>
        <button
          id="tab_analitik_history"
          onClick={() => setActiveSubTab('RIWAYAT_PENJUALAN')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'RIWAYAT_PENJUALAN'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Riwayat Penjualan
        </button>
      </div>

      {activeSubTab === 'STATISTIK' ? (
        /* ANALYTICS STATS VIEW */
        <div className="space-y-6">
          {/* Summary metrics cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Revenue */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-slate-100 pointer-events-none">
                <DollarSign className="w-24 h-24 translate-x-3 translate-y-3" />
              </div>
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Omset Penjualan</span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">+100%</span>
              </div>
              <p className="text-xl font-extrabold font-mono text-slate-900">{formatPrice(totalRevenue)}</p>
              <div className="text-[10px] text-slate-400">Akumulasi total omset kotor</div>
            </div>

            {/* Card 2: Net Profit */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-emerald-50/60 pointer-events-none">
                <TrendingUp className="w-24 h-24 translate-x-3 translate-y-3" />
              </div>
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Laba Bersih</span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">Net</span>
              </div>
              <p className="text-xl font-extrabold font-mono text-emerald-850">{formatPrice(totalProfit)}</p>
              <div className="text-[10px] text-slate-400">Selisih penjualan minus modal</div>
            </div>

            {/* Card 3: Outstanding Customer Debt */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-amber-50/60 pointer-events-none">
                <ArrowDownLeft className="w-24 h-24 translate-x-3 translate-y-3" />
              </div>
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Piutang Aktif</span>
                <span className="text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">Utang</span>
              </div>
              <p className="text-xl font-extrabold font-mono text-amber-600">{formatPrice(totalOutstandingDebt)}</p>
              <div className="text-[10px] text-slate-400">Total tagihan utang belum lunas</div>
            </div>

            {/* Card 4: Total transactions */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-2 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-blue-50/60 pointer-events-none">
                <ShoppingBag className="w-24 h-24 translate-x-3 translate-y-3" />
              </div>
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Jumlah Transaksi</span>
                <span className="text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">Vol</span>
              </div>
              <p className="text-xl font-extrabold font-mono text-slate-900">{totalTxCount} Nota</p>
              <div className="text-[10px] text-slate-400">Total faktur terbit di database</div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sales Trend Line Chart Panel */}
            <div id="trend_chart_panel" className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tren Penjualan (7 Hari Terakhir)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Grafik real-time transaksi penjualan terkini</p>
                </div>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="w-full overflow-hidden flex justify-center py-2">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-2xl h-auto">
                  {/* Grid Lines */}
                  <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1={padding} y1={(chartHeight) / 2} x2={chartWidth - padding} y2={(chartHeight) / 2} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#cbd5e1" strokeWidth="1" />

                  {/* Lines path */}
                  {points.length > 1 && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Interactive Nodes and Values */}
                  {points.map((p, i) => (
                    <g key={i}>
                      {/* Circle node */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5.5"
                        fill="#ffffff"
                        stroke="#059669"
                        strokeWidth="2.5"
                      />
                      {/* Date labels */}
                      <text
                        x={p.x}
                        y={chartHeight - 10}
                        fill="#64748b"
                        fontSize="9.5"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {p.label}
                      </text>
                      {/* Price values floating */}
                      <text
                        x={p.x}
                        y={p.y - 12}
                        fill="#047857"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {p.val > 0 ? (p.val / 1000).toFixed(0) + 'k' : ''}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Best Sellers Ranking */}
            <div id="best_sellers_panel" className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Barang Paling Laris</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ranking berdasarkan volume penjualan</p>
              </div>

              <div className="space-y-4 pt-1">
                {bestSellers.map((item, idx) => {
                  const pct = Math.round((item.qty / maxQty) * 100);
                  return (
                    <div id={`best_seller_rank_${idx}`} key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate max-w-[180px] text-slate-900 font-bold">#{idx + 1} {item.name}</span>
                        <span className="font-mono text-emerald-700 font-bold">{item.qty} Pcs</span>
                      </div>
                      
                      {/* Progress Bar indicator */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Total Nilai Omset</span>
                        <span className="font-mono text-slate-700 font-semibold">{formatPrice(item.revenue)}</span>
                      </div>
                    </div>
                  );
                })}

                {bestSellers.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Belum ada data barang laku. Lakukan transaksi penjualan terlebih dahulu!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock Distribution per Category Panel */}
          <div id="category_stock_distribution_panel" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-800" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Distribusi Stok per Kategori</h3>
                <p className="text-xs text-slate-400 mt-0.5">Melihat volume total persediaan barang per kategori produk</p>
              </div>
            </div>

            {categoryStockData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada data stok barang. Tambahkan produk ke inventori terlebih dahulu!
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Recharts Bar Chart */}
                <div className="lg:col-span-8 h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={categoryStockData} 
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                      <Bar 
                        dataKey="stock" 
                        radius={[8, 8, 0, 0]} 
                        maxBarSize={45}
                      >
                        {categoryStockData.map((entry, index) => {
                          const isDominant = index === 0;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isDominant ? '#4f46e5' : '#6366f1'} 
                              fillOpacity={isDominant ? 1 : 0.8}
                              className="transition-all duration-300 hover:opacity-100"
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Right: Summary Cards and List */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Metric 1: Total Stock */}
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stok Toko</span>
                      <p className="text-base font-extrabold text-slate-800 font-mono">
                        {totalAllStock.toLocaleString('id-ID')} <span className="text-[10px] text-slate-500 font-sans font-normal">Unit</span>
                      </p>
                    </div>

                    {/* Metric 2: Dominant Category */}
                    <div className="bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Kategori Terbanyak</span>
                      <p className="text-sm font-extrabold text-indigo-700 truncate leading-none mt-1" title={dominantCategory?.name}>
                        {dominantCategory?.name}
                      </p>
                      {dominantCategory && totalAllStock > 0 && (
                        <span className="text-[9px] text-indigo-400 font-mono font-bold block mt-0.5">
                          {Math.round((dominantCategory.stock / totalAllStock) * 100)}% dari total stok
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top list of categories stock */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Porsi Stok Per Kategori</span>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {categoryStockData.slice(0, 4).map((item, index) => {
                        const percentage = totalAllStock > 0 ? Math.round((item.stock / totalAllStock) * 100) : 0;
                        return (
                          <div key={index} className="flex items-center justify-between text-xs py-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${index === 0 ? 'bg-indigo-600' : 'bg-indigo-400'}`} />
                              <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-slate-900 font-semibold">{item.stock.toLocaleString('id-ID')} unit</span>
                              <span className="text-[10px] text-slate-400 font-mono">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                      {categoryStockData.length > 4 && (
                        <p className="text-[10px] text-slate-400 italic pt-1 text-center">
                          + {categoryStockData.length - 4} Kategori lainnya
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TRANSACTION HISTORY LOG LIST */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search filter in histories */}
            <div className="relative flex-1 max-w-md w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                id="tx_history_search"
                type="text"
                placeholder="Cari nomor faktur invoice atau nama pelanggan..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors text-sm"
              />
            </div>
            
            <div className="text-xs text-slate-500 font-semibold">
              Menampilkan {filteredHistories.length} transaksi penjualan
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider font-mono">
                    <th className="p-4">Faktur Invoice</th>
                    <th className="p-4">Waktu Transaksi</th>
                    <th className="p-4">Pelanggan</th>
                    <th className="p-4 text-center">Metode</th>
                    <th className="p-4 text-right">Total Transaksi</th>
                    <th className="p-4 text-right">Estimasi Profit</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredHistories.map((t) => {
                    return (
                      <tr 
                        id={`tx_row_${t.id}`}
                        key={t.id} 
                        className="hover:bg-slate-50 transition-colors text-slate-700"
                      >
                        <td className="p-4 font-mono text-xs font-bold text-slate-900">{t.invoiceNumber}</td>
                        <td className="p-4 text-xs font-mono text-slate-500">{new Date(t.date).toLocaleString('id-ID')}</td>
                        <td className="p-4">
                          <span className="font-semibold uppercase text-xs text-slate-800">
                            {t.customerName || 'Umum'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            t.paymentType === 'CASH' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : t.paymentType === 'QRIS'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {t.paymentType}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900">{formatPrice(t.total)}</td>
                        <td className="p-4 text-right font-mono text-xs text-emerald-700 font-bold">{formatPrice(t.totalProfit)}</td>
                        <td className="p-4 text-center">
                          <button
                            id={`view_tx_detail_${t.id}`}
                            onClick={() => setSelectedTxDetail(t)}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1 mx-auto transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredHistories.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Belum ada riwayat transaksi penjualan tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal Popup */}
      {selectedTxDetail && (
        <div id="tx_detail_modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-scaleIn">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Detail Faktur Invoice</h3>
                <span className="text-[10px] text-slate-400 font-mono">{selectedTxDetail.invoiceNumber}</span>
              </div>
              <button
                id="close_tx_detail_modal"
                onClick={() => setSelectedTxDetail(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Printable Segment */}
            <div id="printable_receipt" className="p-5 font-mono text-xs space-y-4 max-h-[55vh] overflow-y-auto">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wide">{shopSettings.shopName}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{shopSettings.shopAddress}</p>
                <p className="text-[10px] text-slate-500">Telp: {shopSettings.shopPhone}</p>
                <div className="border-b border-dashed border-slate-300 pt-2" />
              </div>

              {/* Meta details */}
              <div className="space-y-0.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span className="font-bold">{new Date(selectedTxDetail.date).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-bold">{selectedTxDetail.paymentType}</span>
                </div>
                {selectedTxDetail.customerName && (
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-bold uppercase">{selectedTxDetail.customerName}</span>
                  </div>
                )}
                <div className="border-b border-dashed border-slate-300 pt-2" />
              </div>

              {/* Table items */}
              <div className="space-y-2 text-[11px]">
                {selectedTxDetail.items.map((item, index) => (
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

              {/* Summary calculations */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold font-mono">{selectedTxDetail.total.toLocaleString('id-ID')}</span>
                </div>
                {selectedTxDetail.paymentType === 'CASH' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Tunai Dibayar:</span>
                      <span className="font-mono">{selectedTxDetail.amountPaid.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold border-t border-dotted border-slate-200 pt-1">
                      <span>Kembalian:</span>
                      <span className="font-mono">{selectedTxDetail.change.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
                {selectedTxDetail.paymentType === 'QRIS' && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Status QRIS:</span>
                    <span>LUNAS</span>
                  </div>
                )}
                {selectedTxDetail.paymentType === 'DEBT' && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Sisa Utang:</span>
                    <span className="font-mono">{selectedTxDetail.total.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2">
                <div className="border-t border-dashed border-slate-300 pt-2" />
                <p className="whitespace-pre-line">{shopSettings.receiptFooter}</p>
                <p className="font-bold text-[9px] text-slate-400 mt-1">POWERED BY KASIR PINTAR OFFLINE</p>
              </div>
            </div>

            {/* Quick Actions (Copy & Download Plain Text Struk) */}
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex gap-2 justify-center items-center">
              <button
                id="copy_invoice_detail_text_btn"
                onClick={() => copyTextReceipt(selectedTxDetail)}
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
                    <span>Salin Struk</span>
                  </>
                )}
              </button>
              <button
                id="download_invoice_detail_txt_btn"
                onClick={() => downloadTextReceipt(selectedTxDetail)}
                className="flex-1 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Unduh File TXT</span>
              </button>
            </div>

            {/* Print and Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <button
                id="print_tx_detail_btn"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Nota</span>
              </button>
              <button
                id="dismiss_tx_detail_modal"
                onClick={() => setSelectedTxDetail(null)}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
