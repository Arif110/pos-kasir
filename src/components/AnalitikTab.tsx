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
  Package,
  AlertTriangle,
  BellRing
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Transaction, Product, Debt, ShopSettings } from '../types';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-slate-800 p-3 rounded-xl border border-slate-200 shadow-xl text-xs font-sans space-y-1">
        <p className="font-bold text-slate-700">{payload[0].payload.name}</p>
        <p className="font-mono text-cyan-600 font-semibold">
          Stok: <span className="font-extrabold text-slate-800">{payload[0].value.toLocaleString('id-ID')}</span> unit
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
  const [activeSubTab, setActiveSubTab] = useState<'STATISTIK' | 'RIWAYAT_PENJUALAN' | 'LAPORAN_BULANAN'>('STATISTIK');
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

  const formatPrice = (num: any) => {
    if (num === undefined || num === null || isNaN(Number(num))) {
      return (shopSettings?.currencySymbol || 'Rp.') + '\u00a00';
    }
    return (shopSettings?.currencySymbol || 'Rp.') + '\u00a0' + Number(num).toLocaleString('id-ID');
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

  // Low stock products (stock <= minStock)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  // Near-expiry products (expiryDate within next 30 days)
  const nearExpiryProducts = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return products.filter(p => {
      if (!p.expiryDate) return false;
      const exp = new Date(p.expiryDate);
      return exp >= today && exp <= thirtyDaysFromNow;
    });
  }, [products]);

  // Filter transaction histories
  const filteredHistories = transactions.filter(t => {
    const matchesSearch = t.invoiceNumber.toLowerCase().includes(historySearch.toLowerCase()) || 
                          (t.customerName && t.customerName.toLowerCase().includes(historySearch.toLowerCase()));
    return matchesSearch;
  });

  // Laporan Penjualan Bulanan
  const monthlyReports = useMemo(() => {
    const reportMap: { [key: string]: { 
      monthKey: string; 
      monthName: string; 
      txCount: number; 
      revenue: number; 
      profit: number; 
      itemsSold: number; 
    } } = {};

    transactions.forEach(t => {
      const dateObj = new Date(t.date);
      if (isNaN(dateObj.getTime())) return;
      
      const year = dateObj.getFullYear();
      const monthNum = dateObj.getMonth(); // 0-11
      const monthKey = `${year}-${String(monthNum + 1).padStart(2, '0')}`;
      
      const monthNamesIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const monthName = `${monthNamesIndo[monthNum]} ${year}`;

      if (!reportMap[monthKey]) {
        reportMap[monthKey] = {
          monthKey,
          monthName,
          txCount: 0,
          revenue: 0,
          profit: 0,
          itemsSold: 0
        };
      }

      reportMap[monthKey].txCount += 1;
      reportMap[monthKey].revenue += t.total;
      reportMap[monthKey].profit += t.totalProfit || 0;
      
      const qtyInTx = t.items.reduce((sum, item) => sum + item.quantity, 0);
      reportMap[monthKey].itemsSold += qtyInTx;
    });

    return Object.values(reportMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [transactions]);

  // Derived metrics for monthly report view
  const bestMonth = useMemo(() => {
    if (monthlyReports.length === 0) return null;
    return [...monthlyReports].sort((a, b) => b.revenue - a.revenue)[0];
  }, [monthlyReports]);

  const averageMonthlyRevenue = useMemo(() => {
    if (monthlyReports.length === 0) return 0;
    const totalRev = monthlyReports.reduce((sum, r) => sum + r.revenue, 0);
    return Math.round(totalRev / monthlyReports.length);
  }, [monthlyReports]);

  const totalAllItemsSold = useMemo(() => {
    return monthlyReports.reduce((sum, r) => sum + r.itemsSold, 0);
  }, [monthlyReports]);

  const downloadMonthlyReportCSV = () => {
    const headers = ['Bulan', 'Jumlah Transaksi', 'Total Barang Terjual', 'Total Omset', 'Total Keuntungan'];
    const rows = monthlyReports.map(r => [
      r.monthName,
      r.txCount.toString(),
      r.itemsSold.toString(),
      r.revenue.toString(),
      r.profit.toString()
    ]);
    
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan-Penjualan-Bulanan.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Selector Subtabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit border border-slate-200/60">
        <button
          id="tab_analitik_dashboard"
          onClick={() => setActiveSubTab('STATISTIK')}
          className={`text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer ${
            activeSubTab === 'STATISTIK'
              ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md shadow-cyan-500/10 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Dashboard Analitik
        </button>
        <button
          id="tab_analitik_history"
          onClick={() => setActiveSubTab('RIWAYAT_PENJUALAN')}
          className={`text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer ${
            activeSubTab === 'RIWAYAT_PENJUALAN'
              ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md shadow-cyan-500/10 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Riwayat Penjualan
        </button>
        <button
          id="tab_analitik_laporan_bulanan"
          onClick={() => setActiveSubTab('LAPORAN_BULANAN')}
          className={`text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer ${
            activeSubTab === 'LAPORAN_BULANAN'
              ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md shadow-cyan-500/10 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Laporan Bulanan
        </button>
      </div>

      {activeSubTab === 'STATISTIK' ? (
        /* ANALYTICS STATS VIEW */
        <div className="space-y-6">
          {/* Summary metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* 1. KARTU OMSET PENJUALAN */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
              {/* Ambient Glow Effect */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all duration-500 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Omset Penjualan</span>
                <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">+100%</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2 font-mono">
                {formatPrice(totalRevenue)}
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Akumulasi total omset kotor</p>
            </div>

            {/* 2. KARTU LABA BERSIH */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
              {/* Ambient Glow Effect */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Laba Bersih</span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">NET</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2 font-mono">
                {formatPrice(totalProfit)}
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Selisih penjualan minus modal</p>
            </div>

            {/* 3. KARTU PIUTANG AKTIF */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
              {/* Ambient Glow Effect */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Piutang Aktif</span>
                <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">UTANG</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-600 tracking-tight mb-2 font-mono">
                {formatPrice(totalOutstandingDebt)}
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Total tagihan utang belum lunas</p>
            </div>

            {/* 4. KARTU JUMLAH TRANSAKSI */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
              {/* Ambient Glow Effect */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-500 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Jumlah Transaksi</span>
                <span className="text-[10px] font-extrabold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">VOL</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2 font-mono">
                {totalTxCount} <span className="text-lg font-medium text-slate-500">Nota</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Total faktur terbit di database</p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {/* Ambient Glow Effects */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* 1. Area Tren Penjualan (Kiri & Tengah) */}
            <div id="trend_chart_panel" className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  Tren Penjualan <span className="text-cyan-600 font-normal text-sm ml-1">(7 Hari Terakhir)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Grafik real-time transaksi penjualan terkini</p>
              </div>
              
              {/* Responsive Area Chart */}
              <div className="h-64 w-full mt-2 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={dailyTrend} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="salesChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => val === 0 ? '0' : `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white text-slate-800 p-3 rounded-xl border border-slate-200 shadow-xl text-xs font-sans space-y-1">
                              <p className="font-bold text-slate-700">{payload[0].payload.date}</p>
                              <p className="font-mono text-cyan-600 font-semibold">
                                Omset: <span className="font-extrabold text-slate-800">Rp {payload[0].value.toLocaleString('id-ID')}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }} 
                      cursor={{ fill: 'rgba(0, 0, 0, 0.02)', radius: 12 }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#0284c7" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#salesChartGradient)" 
                      dot={{ r: 4, strokeWidth: 1.5, fill: '#0284c7', stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Area Barang Paling Laris (Kanan) */}
            <div id="best_sellers_panel" className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Barang Paling Laris</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ranking berdasarkan volume penjualan</p>
              </div>

              {/* List Item Ranks */}
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {bestSellers.map((item, idx) => {
                  const pct = maxQty > 0 ? Math.round((item.qty / maxQty) * 100) : 0;
                  const isRank1 = idx === 0;
                  const isRank2 = idx === 1;
                  const isRank3 = idx === 2;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-xl border relative overflow-hidden transition-all duration-300 ${
                        isRank1 
                          ? 'bg-amber-50/50 border-amber-200/60 shadow-sm' 
                          : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isRank1 && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/5 to-transparent w-24 h-full pointer-events-none"></div>
                      )}
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-bold uppercase tracking-wider mr-1.5 ${
                            isRank1 ? 'text-amber-600' : isRank2 ? 'text-slate-400' : isRank3 ? 'text-amber-700/80' : 'text-slate-500'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 truncate max-w-[150px] inline-block align-middle">
                            {item.name}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                          isRank1 
                            ? 'text-amber-700 bg-amber-50 border-amber-200/60' 
                            : 'text-slate-600 bg-slate-100 border-slate-200/60'
                        }`}>
                          {item.qty} Pcs
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isRank1 
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                              : isRank2
                              ? 'bg-slate-400'
                              : 'bg-slate-300'
                          }`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Total Nilai Omset</span>
                        <span className="font-semibold text-slate-600">{formatPrice(item.revenue)}</span>
                      </div>
                    </div>
                  );
                })}

                {bestSellers.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Belum ada data barang laku. Lakukan transaksi penjualan terlebih dahulu!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock Distribution per Category Panel */}
          <div 
            id="category_stock_distribution_panel" 
            className="w-full bg-white text-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md relative overflow-hidden font-sans"
          >
            {/* Glow Effects */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header Dashboard */}
            <div className="flex items-start justify-between mb-8 border-b border-slate-100 pb-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600">
                    <Package className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-800">Distribusi Stok per Kategori</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 ml-12">Melihat volume total persediaan barang per kategori produk</p>
              </div>
            </div>

            {categoryStockData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 relative z-10">
                Belum ada data stok barang. Tambahkan produk ke inventori terlebih dahulu!
              </div>
            ) : (
              /* Konten Utama Grid */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                
                {/* Area Grafik Batang */}
                <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl p-6 border border-slate-200/60 flex flex-col justify-between min-h-[350px]">
                  <div className="mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visualisasi Volume</span>
                  </div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={categoryStockData} 
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="gradientMinuman" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="gradientMakanan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0891b2" />
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="gradientCemilan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="gradientOthers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="100%" stopColor="#475569" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 12 }} />
                        <Bar 
                          dataKey="stock" 
                          radius={[12, 12, 0, 0]} 
                          maxBarSize={40}
                        >
                          {categoryStockData.map((entry, index) => {
                            const gradients = ['url(#gradientMinuman)', 'url(#gradientMakanan)', 'url(#gradientCemilan)'];
                            const fill = gradients[index % gradients.length] || 'url(#gradientOthers)';
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={fill}
                                stroke={index === 0 ? '#0284c7' : index === 1 ? '#0891b2' : index === 2 ? '#059669' : '#475569'}
                                strokeWidth={1.5}
                                className="transition-all duration-300 hover:opacity-100"
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Area Ringkasan Data */}
                <div className="space-y-6">
                  {/* Grid Dua Kartu Atas */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Kartu Total Stok */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl border-l-4 border-sky-500 shadow-sm">
                      <p className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1">Total Stok Toko</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-mono">{totalAllStock.toLocaleString('id-ID')}</span>
                        <span className="text-xs font-medium text-slate-500">Unit</span>
                      </div>
                    </div>

                    {/* Kartu Kategori Terbanyak */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl border-l-4 border-cyan-500 shadow-sm">
                      <p className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1">Kategori Terbanyak</p>
                      <p className="text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-500 truncate">
                        {dominantCategory?.name || '-'}
                      </p>
                      {dominantCategory && totalAllStock > 0 && (
                        <p className="text-[10px] text-cyan-600 mt-1">
                          {Math.round((dominantCategory.stock / totalAllStock) * 100)}% dari total stok
                        </p>
                      )}
                    </div>
                  </div>

                  {/* List Detail Porsi Stok per Kategori */}
                  <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Porsi Stok per Kategori</h3>
                    
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                      {categoryStockData.map((item, index) => {
                        const percentage = totalAllStock > 0 ? Math.round((item.stock / totalAllStock) * 100) : 0;
                        
                        // Inline color functions
                        const getGradientClass = (idx: number) => {
                          if (idx === 0) return 'from-sky-500 to-sky-400';
                          if (idx === 1) return 'from-cyan-500 to-cyan-400';
                          if (idx === 2) return 'from-emerald-500 to-emerald-400';
                          return 'from-slate-600 to-slate-500';
                        };

                        const getDotColorClass = (idx: number) => {
                          if (idx === 0) return 'bg-sky-500';
                          if (idx === 1) return 'bg-cyan-500';
                          if (idx === 2) return 'bg-emerald-500';
                          return 'bg-slate-500';
                        };

                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="flex items-center gap-2 text-slate-600 font-medium">
                                <span className={`w-2.5 h-2.5 rounded-full ${getDotColorClass(index)}`}></span> 
                                <span className="truncate max-w-[130px] sm:max-w-[150px]">{item.name}</span>
                              </span>
                              <span className="font-semibold text-slate-800 font-mono">
                                {item.stock.toLocaleString('id-ID')}{' '}
                                <span className="text-[10px] text-slate-500 font-normal">({percentage}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`bg-gradient-to-r ${getGradientClass(index)} h-full rounded-full transition-all duration-500`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Bento Grid: Analisis Stok Menipis & Kadaluarsa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            
            {/* Panel 1: Analisis Stok Menipis */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100">
                  <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Analisis Stok Menipis ({lowStockProducts.length})</h3>
                    <p className="text-[11px] text-slate-500">Barang dengan stok di bawah limit minimum peringatan</p>
                  </div>
                </div>

                <div className="space-y-3.5 mt-4 max-h-[250px] overflow-y-auto pr-1">
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-rose-200 hover:bg-slate-50 transition-all">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {p.code} • Kategori: {p.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-rose-600 font-mono block">
                          {p.stock} <span className="text-[10px] text-slate-500 font-normal">/ {p.minStock} {p.satuanJual || 'Pcs'}</span>
                        </span>
                        <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block uppercase tracking-wider">
                          Isi Ulang
                        </span>
                      </div>
                    </div>
                  ))}

                  {lowStockProducts.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-500 font-medium">
                      👍 Semua stok barang dalam keadaan aman & cukup!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel 2: Analisis Produk Kadaluarsa */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Analisis Kadaluarsa ({nearExpiryProducts.length})</h3>
                    <p className="text-[11px] text-slate-500">Barang mendekati tanggal kadaluarsa dalam 30 hari</p>
                  </div>
                </div>

                <div className="space-y-3.5 mt-4 max-h-[250px] overflow-y-auto pr-1">
                  {nearExpiryProducts.map((p) => {
                    const daysLeft = p.expiryDate 
                      ? Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-amber-200 hover:bg-slate-50 transition-all">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Exp: {p.expiryDate ? formatDate(p.expiryDate) : '-'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold font-mono block ${daysLeft <= 7 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {daysLeft <= 0 ? 'Kedaluwarsa' : `${daysLeft} Hari Lagi`}
                          </span>
                          <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block uppercase tracking-wider">
                            Diskon / Retur
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {nearExpiryProducts.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-500 font-medium">
                      ✨ Tidak ada produk yang mendekati tanggal kadaluarsa.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : activeSubTab === 'RIWAYAT_PENJUALAN' ? (
        /* TRANSACTION HISTORY LOG LIST */
        <div className="space-y-4">
          {/* BAGIAN ATAS: SEARCH BAR & COUNTER DATA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Input Pencarian Modern */}
            <div className="relative w-full sm:max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="tx_history_search"
                type="text"
                placeholder="Cari nomor faktur invoice atau nama pelanggan..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium outline-none transition-all"
              />
            </div>
            {/* Total Transaksi Badge */}
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              Menampilkan <span className="text-cyan-600 font-bold">{filteredHistories.length}</span> transaksi penjualan
            </span>
          </div>

          {/* BAGIAN UTAMA: TABEL TRANSAKSI MODERN */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-4 px-5">Faktur Invoice</th>
                    <th className="py-4 px-4">Waktu Transaksi</th>
                    <th className="py-4 px-4">Pelanggan</th>
                    <th className="py-4 px-4 text-center">Metode</th>
                    <th className="py-4 px-4 text-right">Total Transaksi</th>
                    <th className="py-4 px-4 text-right">Estimasi Profit</th>
                    <th className="py-4 px-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredHistories.map((t) => {
                    const txDate = new Date(t.date);
                    const formattedDate = txDate.toLocaleDateString('id-ID');
                    const formattedTime = txDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    return (
                      <tr 
                        id={`tx_row_${t.id}`}
                        key={t.id} 
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{t.invoiceNumber}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-normal">
                          {formattedDate}, <span className="text-slate-600">{formattedTime}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 uppercase">
                          {t.customerName || 'UMUM'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            t.paymentType === 'CASH' 
                              ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                              : t.paymentType === 'QRIS'
                                ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                                : 'text-amber-600 bg-amber-50 border-amber-100'
                          }`}>
                            {t.paymentType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900">{formatPrice(t.total)}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">+ {formatPrice(t.totalProfit)}</td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            id={`view_tx_detail_${t.id}`}
                            onClick={() => setSelectedTxDetail(t)}
                            className="border border-slate-250 hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-[11px] font-extrabold py-1.5 px-3 rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5 active:scale-[0.95] cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
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
      ) : (
        /* LAPORAN BULANAN VIEW */
        <div className="space-y-6">
          {/* Header & CSV Download Button */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-600 shrink-0" />
                Laporan Penjualan Bulanan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Ringkasan akumulasi penjualan, kuantitas produk terjual, dan estimasi laba bersih per bulan</p>
            </div>
            {monthlyReports.length > 0 && (
              <button
                id="download_monthly_report_csv_btn"
                onClick={downloadMonthlyReportCSV}
                className="bg-gradient-to-r from-sky-600 to-cyan-500 hover:opacity-90 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-cyan-500/10 hover:shadow-lg transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Ekspor ke CSV</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1">Rata-rata Omset Bulanan</p>
              <div className="text-xl font-extrabold text-slate-800 font-mono mt-1.5">
                {formatPrice(averageMonthlyRevenue)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Berdasarkan total periode yang tercatat</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1">Bulan Terbaik (Omset)</p>
              <div className="text-xl font-extrabold text-emerald-600 truncate mt-1.5">
                {bestMonth ? bestMonth.monthName : '-'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {bestMonth ? `${formatPrice(bestMonth.revenue)}` : 'Belum ada transaksi'}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1">Total Barang Terjual</p>
              <div className="text-xl font-extrabold text-slate-800 mt-1.5">
                {totalAllItemsSold.toLocaleString('id-ID')} <span className="text-xs font-medium text-slate-500">Unit</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Akumulasi seluruh barang terjual</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1">Total Bulan Aktif</p>
              <div className="text-xl font-extrabold text-amber-600 mt-1.5">
                {monthlyReports.length} <span className="text-xs font-medium text-slate-500">Bulan</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Jumlah bulan yang memiliki transaksi</p>
            </div>
          </div>

          {/* Main Table Content */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">
                    <th className="py-4 px-6">Bulan Periode</th>
                    <th className="py-4 px-6 text-center">Jumlah Transaksi</th>
                    <th className="py-4 px-6 text-center">Total Barang Terjual</th>
                    <th className="py-4 px-6 text-right">Total Omset Kotor</th>
                    <th className="py-4 px-6 text-right">Keuntungan Bersih (Profit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {monthlyReports.map((report) => (
                    <tr 
                      key={report.monthKey} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-cyan-500" />
                        {report.monthName}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold border border-slate-200/60 font-mono">
                          {report.txCount} Transaksi
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-slate-600">
                        {report.itemsSold.toLocaleString('id-ID')} unit
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-900 font-mono whitespace-nowrap">
                        {formatPrice(report.revenue)}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-emerald-600 font-mono whitespace-nowrap">
                        {formatPrice(report.profit)}
                      </td>
                    </tr>
                  ))}

                  {monthlyReports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                        Belum ada data transaksi bulanan yang terekam.
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
          <div className="bg-white text-slate-950 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-scaleIn">
            
            {/* Header Modal Premium */}
            <div className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight">Detail Faktur Invoice</h2>
                <p className="text-[11px] text-sky-100 font-mono mt-0.5">{selectedTxDetail.invoiceNumber}</p>
              </div>
              <button
                id="close_tx_detail_modal"
                onClick={() => setSelectedTxDetail(null)}
                className="text-white/80 hover:text-white p-1.5 active:scale-90 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Area Tampilan Struk Fisik */}
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex-1 overflow-y-auto max-h-[55vh]">
              <div id="printable_receipt" className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm space-y-4">
                
                {/* Identitas Toko */}
                <div className="text-center pb-3 border-b border-dashed border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">{shopSettings.shopName}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">{shopSettings.shopAddress}</p>
                  <p className="text-[10px] text-slate-400">Telp: {shopSettings.shopPhone}</p>
                </div>

                {/* Meta Transaksi (Waktu & Metode) */}
                <div className="text-xs space-y-1 text-slate-500 pb-3 border-b border-dashed border-slate-200">
                  <div className="flex justify-between">
                    <span>Waktu</span>
                    <span className="font-medium text-slate-800">{new Date(selectedTxDetail.date).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Metode</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{selectedTxDetail.paymentType}</span>
                  </div>
                  {selectedTxDetail.customerName && (
                    <div className="flex justify-between">
                      <span>Pelanggan</span>
                      <span className="font-bold text-slate-900 uppercase">{selectedTxDetail.customerName}</span>
                    </div>
                  )}
                </div>

                {/* Daftar Item Belanja */}
                <div className="text-xs space-y-2 py-1">
                  {selectedTxDetail.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.quantity} x {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <span className="font-bold text-slate-900 font-mono">{(item.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                {/* Rincian Total Pembayaran */}
                <div className="pt-3 border-t border-dashed border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedTxDetail.total.toLocaleString('id-ID')}</span>
                  </div>
                  {selectedTxDetail.paymentType === 'CASH' && (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Tunai Dibayar</span>
                        <span className="font-semibold text-slate-800 font-mono">{selectedTxDetail.amountPaid.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg mt-1">
                        <span>Kembalian</span>
                        <span className="font-mono">{selectedTxDetail.change.toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                  {selectedTxDetail.paymentType === 'QRIS' && (
                    <div className="flex justify-between font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg mt-1">
                      <span>Status QRIS</span>
                      <span>LUNAS</span>
                    </div>
                  )}
                  {selectedTxDetail.paymentType === 'DEBT' && (
                    <div className="flex justify-between font-bold text-amber-600 bg-amber-50 p-2 rounded-lg mt-1">
                      <span>Sisa Utang</span>
                      <span className="font-mono">{selectedTxDetail.total.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                {/* Kaki Struk (Footer Message) */}
                <div className="text-center pt-3 border-t border-dashed border-slate-200 space-y-1">
                  <p className="text-[10px] text-slate-400 leading-normal whitespace-pre-line">{shopSettings.receiptFooter}</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-300 uppercase mt-2">POWERED BY KASIR PINTAR OFFLINE</p>
                </div>

              </div>
            </div>

            {/* Footer Modal: Tombol Operasional & Cetak */}
            <div className="p-4 bg-white space-y-3">
              {/* Grup Tombol Salin & Unduh Sekunder */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="copy_invoice_detail_text_btn"
                  onClick={() => copyTextReceipt(selectedTxDetail)}
                  className="border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  {copiedReceipt ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-extrabold">Berhasil Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Salin Struk</span>
                    </>
                  )}
                </button>
                <button
                  id="download_invoice_detail_txt_btn"
                  onClick={() => downloadTextReceipt(selectedTxDetail)}
                  className="border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>Unduh TXT</span>
                </button>
              </div>

              {/* Tombol Utama Cetak & Tutup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  id="print_tx_detail_btn"
                  onClick={() => window.print()}
                  className="bg-gradient-to-r from-sky-600 to-cyan-500 hover:opacity-90 text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-md shadow-cyan-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 order-last sm:order-first active:scale-[0.98] cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-white shrink-0" />
                  <span>Cetak Nota</span>
                </button>
                <button
                  id="dismiss_tx_detail_modal"
                  onClick={() => setSelectedTxDetail(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
