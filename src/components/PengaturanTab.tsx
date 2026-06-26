import React, { useState } from 'react';
import { 
  Settings, 
  Store, 
  QrCode, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  CheckCircle, 
  FileWarning, 
  Printer,
  Sparkles,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { ShopSettings, Product, Transaction, Debt } from '../types';

interface PengaturanTabProps {
  shopSettings: ShopSettings;
  products: Product[];
  transactions: Transaction[];
  debts: Debt[];
  onSaveSettings: (settings: ShopSettings) => Promise<void>;
  onResetAllData: () => Promise<void>;
  onRestoreBackup: (data: {
    settings: ShopSettings;
    products: Product[];
    transactions: Transaction[];
    debts: Debt[];
  }) => Promise<void>;
}

export default function PengaturanTab({
  shopSettings,
  products,
  transactions,
  debts,
  onSaveSettings,
  onResetAllData,
  onRestoreBackup
}: PengaturanTabProps) {
  // Store form state
  const [shopName, setShopName] = useState(shopSettings.shopName);
  const [shopAddress, setShopAddress] = useState(shopSettings.shopAddress);
  const [shopPhone, setShopPhone] = useState(shopSettings.shopPhone);
  const [receiptFooter, setReceiptFooter] = useState(shopSettings.receiptFooter);
  const [qrisText, setQrisText] = useState(shopSettings.qrisText);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showQrisPrintSheet, setShowQrisPrintSheet] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedSettings: ShopSettings = {
      shopName: shopName.trim() || 'Toko Kasir',
      shopAddress: shopAddress.trim() || '-',
      shopPhone: shopPhone.trim() || '-',
      receiptFooter: receiptFooter.trim() || 'Terima Kasih!',
      qrisText: qrisText.trim() || 'DUMMY_QRIS',
      currencySymbol: 'Rp'
    };

    await onSaveSettings(updatedSettings);
    
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // BACKUP EXPORT as JSON
  const handleExportBackup = () => {
    const backupData = {
      settings: {
        shopName,
        shopAddress,
        shopPhone,
        receiptFooter,
        qrisText,
        currencySymbol: 'Rp'
      },
      products,
      transactions,
      debts,
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("download", `BACKUP_KASIR_PINTAR_${dateStamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // BACKUP RESTORE / IMPORT from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Validation check for key structures
        if (!parsed.products || !parsed.settings) {
          alert('Format file backup tidak valid! Pastikan Anda mengunggah file hasil export Kasir Pintar.');
          return;
        }

        if (confirm('Apakah Anda yakin ingin memulihkan data dari file backup? Ini akan menimpa seluruh data stok barang, transaksi, utang, dan profil toko saat ini!')) {
          await onRestoreBackup({
            settings: parsed.settings,
            products: parsed.products,
            transactions: parsed.transactions || [],
            debts: parsed.debts || []
          });
          
          alert('Data berhasil dipulihkan dari file backup! Halaman akan menyegarkan data.');
          window.location.reload();
        }
      } catch (err) {
        alert('Gagal membaca file backup! Terjadi kesalahan parsing JSON.');
        console.error(err);
      }
    };
    fileReader.readAsText(file);
  };

  // SYSTEM RESET DATA APLIKASI
  const handleResetSystem = async () => {
    const confirm1 = confirm('PERINGATAN: Apakah Anda yakin ingin melakukan RESET DATA APLIKASI? Seluruh riwayat transaksi, catatan utang, stok barang, dan pengaturan profil toko akan DIHAPUS PERMANEN dan dikembalikan ke bawaan pabrik!');
    if (!confirm1) return;

    const confirm2 = confirm('KONFIRMASI KEDUA: Data yang dihapus tidak dapat dikembalikan. Ketik OK jika Anda benar-benar yakin.');
    if (!confirm2) return;

    await onResetAllData();
    alert('Sistem berhasil dikosongkan dan dikembalikan ke data awal! Aplikasi akan menyegarkan.');
    window.location.reload();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Shop Profile Setup */}
      <form onSubmit={handleSaveSettings} className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Store className="w-5 h-5 text-slate-800" />
          <h2 className="text-base font-bold text-slate-900">Profil & Pengaturan Toko</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Shop Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Nama Toko *</label>
            <input
              id="set_shop_name"
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-350 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-bold"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Nomor Telepon Toko *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                id="set_shop_phone"
                type="text"
                required
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-350 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Alamat Toko Lengkap *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 pt-2 flex items-start text-slate-400">
                <MapPin className="w-4 h-4 mt-0.5" />
              </span>
              <textarea
                id="set_shop_address"
                required
                rows={2}
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-350 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Custom QRIS Editor Payload text */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Payload / Teks String QRIS Toko *</label>
            <textarea
              id="set_qris_text"
              required
              rows={2}
              placeholder="Masukkan teks kode QRIS statis toko Anda..."
              value={qrisText}
              onChange={(e) => setQrisText(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-350 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 leading-tight font-semibold"
            />
            <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
              Masukkan string QRIS nasional Anda (biasanya diawali dengan <code className="text-slate-600 font-bold">000201010211...</code>) untuk memunculkan scan bayar otomatis di kasir.
            </span>
          </div>

          {/* Receipt Footer note */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Pesan Kaki Struk (Receipt Footer)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 pt-2 flex items-start text-slate-400">
                <FileText className="w-4 h-4 mt-0.5" />
              </span>
              <textarea
                id="set_receipt_footer"
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-350 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Kalimat penutup yang tercetak di bagian paling bawah struk belanja pelanggan.
            </span>
          </div>

        </div>

        {/* Buttons */}
        <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
          {saveSuccess && (
            <span id="save_success_alert" className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 animate-pulse">
              <CheckCircle className="w-4 h-4 text-emerald-650" />
              <span>Pengaturan profil berhasil disimpan!</span>
            </span>
          )}
          
          <button
            id="save_settings_btn"
            type="submit"
            disabled={isSaving}
            className="ml-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Simpan Profil</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Right Column: QRIS display, Backup, Reset Controls */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">
        
        {/* QRIS Real-time Visualizer Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <QrCode className="w-5 h-5 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">Pratinjau QRIS Toko</h3>
          </div>

          <div className="text-center space-y-3.5">
            <div className="mx-auto w-40 h-40 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
              <img 
                id="settings_qris_visual"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrisText)}`} 
                alt="QRIS QR Code" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-slate-950 uppercase">{shopName}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono break-all leading-tight font-semibold">
                {qrisText.slice(0, 45)}...
              </p>
            </div>
            
            <button
              id="print_qris_sheet_btn"
              type="button"
              onClick={() => setShowQrisPrintSheet(true)}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all flex items-center justify-center gap-1.5 w-full shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak QRIS Pajangan</span>
            </button>
          </div>
        </div>

        {/* Database backup data logs & import restore */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Download className="w-5 h-5 text-slate-850" />
            <h3 className="text-sm font-bold text-slate-900">Ekspor & Impor Data</h3>
          </div>
          
          <p className="text-xs text-slate-400 leading-normal">
            Cadangkan (backup) seluruh data stok barang, catatan utang, profil toko, dan riwayat transaksi menjadi file JSON. Anda dapat memulihkannya kapan saja di perangkat lain.
          </p>

          <div className="space-y-2.5 pt-2">
            {/* Export Backup button */}
            <button
              id="export_backup_data_btn"
              type="button"
              onClick={handleExportBackup}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Backup (.json)</span>
            </button>

            {/* Import Restore file trigger */}
            <div className="relative">
              <input
                id="import_backup_file_input"
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                id="trigger_import_backup_btn"
                type="button"
                onClick={() => document.getElementById('import_backup_file_input')?.click()}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Impor / Pulihkan Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* FACTORY RESET DANGER AREA */}
        <div className="bg-red-50/40 border border-red-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-red-200/50 pb-3 text-red-700">
            <FileWarning className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold">Zona Bahaya (Danger Zone)</h3>
          </div>

          <p className="text-[11px] text-red-600/80 leading-normal">
            Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Pastikan Anda sudah mengekspor data backup sebelum melanjutkan.
          </p>

          <button
            id="factory_reset_app_btn"
            type="button"
            onClick={handleResetSystem}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm border-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kosongkan & Reset Data</span>
          </button>
        </div>

      </div>

      {/* QRIS Stand Display Print Sheet Modal */}
      {showQrisPrintSheet && (
        <div id="qris_print_sheet_modal" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Printable Frame Area */}
            <div id="printable_qris_sheet" className="p-8 text-center bg-white space-y-6 flex flex-col items-center">
              
              {/* Top Banner visual QRIS */}
              <div className="space-y-1 w-full">
                <div className="text-lg font-extrabold tracking-widest text-slate-900">QRIS</div>
                <div className="text-[9px] text-slate-500 tracking-wider font-semibold">QR CODE STANDAR PEMBAYARAN NASIONAL</div>
                <div className="border-b-4 border-indigo-600 mt-2 w-full" />
              </div>

              {/* Shop title block */}
              <div className="space-y-0.5">
                <h2 className="text-base font-extrabold uppercase tracking-wide">{shopName}</h2>
                <p className="text-[10px] text-slate-400">{shopAddress}</p>
                <p className="text-[10px] text-slate-400">NMID: ID1020211111111</p>
              </div>

              {/* QR Image crisp border */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-sm">
                <img 
                  id="print_qris_preview_img"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrisText)}`} 
                  alt="QRIS CODE PRINT" 
                  className="w-48 h-48 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Instructions footer */}
              <div className="space-y-1 text-slate-500 text-[10px] leading-tight max-w-[250px]">
                <p className="font-bold text-slate-700">DAPAT DI-SCAN MENGGUNAKAN:</p>
                <p>GOPAY, OVO, DANA, LINKAJA, SHOPEEPAY, BCA MOBILE, LIVIN MANDIRI, DAN SEMUA E-WALLET LAINNYA.</p>
                <div className="border-b border-slate-200 pt-3" />
                <p className="font-semibold text-slate-400 text-[8px] mt-1">TERIMAKASIH TELAH MENDUKUNG TRANSAKSI CASHLESS</p>
              </div>

            </div>

            {/* Print Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                id="trigger_qris_sheet_print"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembaran</span>
              </button>
              <button
                id="close_qris_sheet"
                onClick={() => setShowQrisPrintSheet(false)}
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
