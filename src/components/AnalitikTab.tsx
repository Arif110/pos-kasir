import React, { useState } from 'react';
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
  Printer
} from 'lucide-react';
import { Transaction, Product, Debt, ShopSettings } from '../types';

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
            <div className="p-5 font-mono text-xs space-y-4 max-h-[55vh] overflow-y-auto">
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
                    <span>LUNAS SYNC</span>
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
                <p className="font-bold text-[9px] text-slate-400 mt-1">POWERED BY KASIR PINTAR CLOUD</p>
              </div>
            </div>

            {/* Print and Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                id="print_tx_detail_btn"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
              <button
                id="dismiss_tx_detail_modal"
                onClick={() => setSelectedTxDetail(null)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center transition-colors shadow-sm"
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
