import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  User, 
  Phone, 
  Calendar, 
  DollarSign, 
  History, 
  CheckCircle2, 
  ChevronRight,
  AlertCircle,
  Clock,
  X,
  CreditCard
} from 'lucide-react';
import { Debt, ShopSettings, DebtPayment } from '../types';

interface UtangTabProps {
  debts: Debt[];
  shopSettings: ShopSettings;
  onSaveDebt: (debt: Debt) => Promise<void>;
}

export default function UtangTab({ debts, shopSettings, onSaveDebt }: UtangTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID_PARTIAL' | 'PAID'>('UNPAID_PARTIAL');
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  // Filter debts
  const filteredDebts = debts.filter(d => {
    const matchesSearch = d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.customerPhone.includes(searchQuery);
    
    let matchesStatus = true;
    if (statusFilter === 'UNPAID_PARTIAL') {
      matchesStatus = d.status === 'UNPAID' || d.status === 'PARTIAL';
    } else if (statusFilter === 'PAID') {
      matchesStatus = d.status === 'PAID';
    }

    return matchesSearch && matchesStatus;
  });

  const handleOpenPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount('');
    setShowHistory(false);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    const payValue = parseFloat(paymentAmount.replace(/\./g, ''));
    if (isNaN(payValue) || payValue <= 0) {
      alert('Masukkan jumlah pembayaran yang valid!');
      return;
    }

    if (payValue > selectedDebt.remainingDebt) {
      alert(`Jumlah bayar melebihi sisa utang (${formatPrice(selectedDebt.remainingDebt)})!`);
      return;
    }

    const newRemaining = selectedDebt.remainingDebt - payValue;
    const isFullyPaid = newRemaining <= 0;

    const newPayment: DebtPayment = {
      id: 'pay_' + Date.now(),
      date: new Date().toISOString(),
      amount: payValue
    };

    const updatedDebt: Debt = {
      ...selectedDebt,
      remainingDebt: newRemaining,
      status: isFullyPaid ? 'PAID' : 'PARTIAL',
      payments: [...selectedDebt.payments, newPayment]
    };

    await onSaveDebt(updatedDebt);
    setSelectedDebt(null);
    alert(`Pembayaran berhasil dicatat! Sisa utang: ${formatPrice(newRemaining)}`);
  };

  const formatPrice = (num: any) => {
    if (num === undefined || num === null || isNaN(Number(num))) {
      return (shopSettings?.currencySymbol || 'Rp.') + ' 0';
    }
    return (shopSettings?.currencySymbol || 'Rp.') + ' ' + Number(num).toLocaleString('id-ID');
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Search and Category Toggle Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            id="debt_search_input"
            type="text"
            placeholder="Cari nama pelanggan atau nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors text-sm"
          />
        </div>

        {/* Status Filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            id="debt_filter_unpaid"
            onClick={() => setStatusFilter('UNPAID_PARTIAL')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
              statusFilter === 'UNPAID_PARTIAL'
                ? 'bg-slate-900 text-white shadow-sm border border-transparent'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Belum Lunas
          </button>
          <button
            id="debt_filter_paid"
            onClick={() => setStatusFilter('PAID')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
              statusFilter === 'PAID'
                ? 'bg-slate-900 text-white shadow-sm border border-transparent'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Sudah Lunas
          </button>
          <button
            id="debt_filter_all"
            onClick={() => setStatusFilter('ALL')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm border border-transparent'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Debt Table Content */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider font-mono">
                <th className="p-4">Pelanggan</th>
                <th className="p-4">No. Telp / HP</th>
                <th className="p-4 text-right">Total Utang</th>
                <th className="p-4 text-right">Sisa Utang</th>
                <th className="p-4 text-center">Jatuh Tempo</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDebts.map((d) => {
                const isPaid = d.status === 'PAID';
                const isOverdue = new Date(d.dueDate) < new Date() && !isPaid;

                return (
                  <tr 
                    id={`debt_row_${d.id}`}
                    key={d.id} 
                    className="hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono border border-slate-200">
                          {d.customerName[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">{d.customerName}</span>
                          <span className="block text-[10px] text-slate-400">Log: {formatDate(d.createdAt)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{d.customerPhone}</td>
                    <td className="p-4 text-right font-mono text-xs text-slate-400">{formatPrice(d.totalDebt)}</td>
                    <td className="p-4 text-right font-mono text-xs font-extrabold text-slate-900">{formatPrice(d.remainingDebt)}</td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`font-mono text-xs ${isOverdue ? 'text-red-600 font-extrabold' : ''}`}>
                          {formatDate(d.dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="text-[9px] text-red-600 bg-red-50 border border-red-200 px-1 py-0.2 rounded mt-0.5 uppercase font-bold animate-pulse">
                            Terlambat
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        isPaid 
                          ? 'bg-emerald-50 text-emerald-850 border-emerald-200' 
                          : d.status === 'PARTIAL'
                            ? 'bg-blue-50 text-blue-850 border-blue-200'
                            : 'bg-red-50 text-red-850 border-red-200'
                      }`}>
                        {d.status === 'PAID' ? 'LUNAS' : d.status === 'PARTIAL' ? 'DICICIL' : 'BELUM BAYAR'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        id={`pay_debt_btn_${d.id}`}
                        onClick={() => handleOpenPaymentModal(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 mx-auto border cursor-pointer active:scale-[0.96] focus:ring-2 focus:ring-slate-500/10 ${
                          isPaid 
                            ? 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80' 
                            : 'bg-slate-950 hover:bg-slate-800 text-white border-transparent shadow-sm shadow-slate-950/5 hover:shadow-md'
                        }`}
                      >
                        {isPaid ? <History className="w-3.5 h-3.5 shrink-0 text-slate-500" /> : <DollarSign className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
                        <span>{isPaid ? 'Riwayat' : 'Bayar'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada catatan utang yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Installment Payment Modal */}
      {selectedDebt && (
        <div id="debt_payment_modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Kelola Utang: {selectedDebt.customerName}</span>
              </h3>
              <button
                id="close_debt_modal"
                onClick={() => setSelectedDebt(null)}
                className="p-1.5 hover:bg-slate-800/80 active:scale-95 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Debt Summary */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Utang Awal</span>
                  <p className="text-sm font-bold font-mono text-slate-800">{formatPrice(selectedDebt.totalDebt)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Sisa Tagihan</span>
                  <p className="text-sm font-bold font-mono text-emerald-750">{formatPrice(selectedDebt.remainingDebt)}</p>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2.5 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Jatuh Tempo:</span>
                  <span className="font-mono text-slate-700 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {formatDate(selectedDebt.dueDate)}
                  </span>
                </div>
              </div>

              {/* Installment History vs Pay Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  id="tab_pay_debt"
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                    !showHistory ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Bayar Cicilan
                </button>
                <button
                  id="tab_history_debt"
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                    showHistory ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Riwayat Cicilan ({selectedDebt.payments.length})
                </button>
              </div>

              {!showHistory ? (
                /* Payment form */
                selectedDebt.remainingDebt <= 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">Tagihan Ini Sudah Lunas!</p>
                    <p className="text-xs text-slate-400">Semua cicilan telah berhasil diselesaikan.</p>
                  </div>
                ) : (
                  <form onSubmit={handleProcessPayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Jumlah Pembayaran *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-extrabold font-mono">
                          {shopSettings.currencySymbol}
                        </span>
                        <input
                          id="debt_pay_input_field"
                          type="text"
                          required
                          placeholder="Masukkan nilai bayar..."
                          value={paymentAmount}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setPaymentAmount(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>

                    {/* Quick shortcuts */}
                    <div className="flex gap-2">
                      <button
                        id="shortcut_debt_pay_all"
                        type="button"
                        onClick={() => setPaymentAmount(selectedDebt.remainingDebt.toLocaleString('id-ID'))}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-950 text-xs font-bold border border-slate-250 rounded-lg flex-1 transition-all cursor-pointer"
                      >
                        Bayar Lunas ({formatPrice(selectedDebt.remainingDebt)})
                      </button>
                      {selectedDebt.remainingDebt > 10000 && (
                        <button
                          id="shortcut_debt_pay_half"
                          type="button"
                          onClick={() => setPaymentAmount((selectedDebt.remainingDebt / 2).toLocaleString('id-ID'))}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-700 text-xs font-semibold border border-slate-250 rounded-lg flex-1 transition-all cursor-pointer"
                        >
                          Bayar Setengah
                        </button>
                      )}
                    </div>

                    <button
                      id="submit_debt_payment"
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                      <span>Catat Pembayaran</span>
                    </button>
                  </form>
                )
              ) : (
                /* Payment history */
                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                  {selectedDebt.payments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Belum ada riwayat cicilan untuk tagihan ini.
                    </div>
                  ) : (
                    selectedDebt.payments.map((p, index) => (
                      <div 
                        id={`debt_pay_record_${p.id}`}
                        key={p.id} 
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <div>
                          <span className="text-xs text-slate-600 font-bold">Cicilan #{index + 1}</span>
                          <span className="block text-[10px] text-slate-400">{formatDate(p.date)}</span>
                        </div>
                        <span className="font-bold font-mono text-emerald-750 text-xs">+{formatPrice(p.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
