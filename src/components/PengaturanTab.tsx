import React, { useState, useEffect } from 'react';
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
  FileText,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Key,
  User,
  AtSign,
  Tags,
  Plus,
  History,
  DownloadCloud,
  SaveAll,
  Shield
} from 'lucide-react';
import { ShopSettings, Product, Transaction, Debt, CashierAccount, AutoBackup } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { getAutoBackups, deleteAutoBackup, clearAllAutoBackups, performAutoBackup } from '../lib/autoBackup';

interface PengaturanTabProps {
  shopSettings: ShopSettings;
  products: Product[];
  transactions: Transaction[];
  debts: Debt[];
  cashiers: CashierAccount[];
  categoriesList?: string[];
  onSaveSettings: (settings: ShopSettings) => Promise<void>;
  onResetAllData: () => Promise<void>;
  onRestoreBackup: (data: {
    settings: ShopSettings;
    products: Product[];
    transactions: Transaction[];
    debts: Debt[];
    cashiers?: CashierAccount[];
    categories?: string[];
  }) => Promise<void>;
  onSaveCashier: (cashier: CashierAccount) => Promise<void>;
  onDeleteCashier: (id: string) => Promise<void>;
  onSaveCategories?: (categories: string[]) => Promise<void>;
}

export default function PengaturanTab({
  shopSettings,
  products,
  transactions,
  debts,
  cashiers,
  categoriesList = [],
  onSaveSettings,
  onResetAllData,
  onRestoreBackup,
  onSaveCashier,
  onDeleteCashier,
  onSaveCategories
}: PengaturanTabProps) {
  // Store form state
  const [shopName, setShopName] = useState(shopSettings.shopName);
  const [shopAddress, setShopAddress] = useState(shopSettings.shopAddress);
  const [shopPhone, setShopPhone] = useState(shopSettings.shopPhone);
  const [receiptFooter, setReceiptFooter] = useState(shopSettings.receiptFooter);
  const [qrisText, setQrisText] = useState(shopSettings.qrisText);
  const [logoUrl, setLogoUrl] = useState(shopSettings.logoUrl || '');

  const [autoBackupsList, setAutoBackupsList] = useState<AutoBackup[]>([]);

  useEffect(() => {
    setAutoBackupsList(getAutoBackups());
  }, []);

  // Sync state when shopSettings prop changes
  useEffect(() => {
    setShopName(shopSettings.shopName || '');
    setShopAddress(shopSettings.shopAddress || '');
    setShopPhone(shopSettings.shopPhone || '');
    setReceiptFooter(shopSettings.receiptFooter || '');
    setQrisText(shopSettings.qrisText || '');
    setLogoUrl(shopSettings.logoUrl || '');
  }, [shopSettings]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showQrisPrintSheet, setShowQrisPrintSheet] = useState(false);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
    showInputConfirmation?: boolean;
    inputPlaceholder?: string;
    inputExpectedValue?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
    showInputConfirmation?: boolean;
    inputPlaceholder?: string;
    inputExpectedValue?: string;
  }) => {
    setConfirmModal({
      isOpen: true,
      ...options,
      onConfirm: async () => {
        await options.onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Cashier management state
  const [activeManagementSubTab, setActiveManagementSubTab] = useState<'owner' | 'cashier'>('owner');

  // Owner account form state
  const [ownerForm, setOwnerForm] = useState({
    username: shopSettings.ownerUsername || 'owner',
    fullName: shopSettings.ownerName || 'Arif Rahman',
    password: shopSettings.ownerPassword || '123'
  });
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [ownerError, setOwnerError] = useState('');
  const [ownerSuccess, setOwnerSuccess] = useState('');

  // Sync ownerForm state when shopSettings changes
  useEffect(() => {
    setOwnerForm({
      username: shopSettings.ownerUsername || 'owner',
      fullName: shopSettings.ownerName || 'Arif Rahman',
      password: shopSettings.ownerPassword || '123'
    });
  }, [shopSettings]);

  const handleSaveOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError('');
    setOwnerSuccess('');
    setIsSavingOwner(true);

    const usernameTrimmed = ownerForm.username.trim().toLowerCase();
    const fullNameTrimmed = ownerForm.fullName.trim();
    const passwordTrimmed = ownerForm.password.trim();

    if (!usernameTrimmed || !fullNameTrimmed || !passwordTrimmed) {
      setOwnerError('Semua field wajib diisi!');
      setIsSavingOwner(false);
      return;
    }

    // Check if duplicate with any cashier username
    const isDuplicateWithCashier = cashiers.some(
      c => c.username.toLowerCase() === usernameTrimmed
    );

    if (isDuplicateWithCashier) {
      setOwnerError(`Username "${usernameTrimmed}" sudah terdaftar sebagai akun kasir!`);
      setIsSavingOwner(false);
      return;
    }

    try {
      await onSaveSettings({
        ...shopSettings,
        ownerUsername: usernameTrimmed,
        ownerName: fullNameTrimmed,
        ownerPassword: passwordTrimmed
      });
      setOwnerSuccess('Akun Owner berhasil diperbarui!');
      setTimeout(() => setOwnerSuccess(''), 3000);
    } catch (err) {
      setOwnerError('Gagal menyimpan akun Owner. Silakan coba lagi.');
    } finally {
      setIsSavingOwner(false);
    }
  };

  const [editingCashier, setEditingCashier] = useState<CashierAccount | null>(null);
  const [cashierForm, setCashierForm] = useState({ username: '', fullName: '', password: '' });
  const [isSavingCashier, setIsSavingCashier] = useState(false);
  const [cashierError, setCashierError] = useState('');
  const [cashierSuccess, setCashierSuccess] = useState('');

  const handleSaveCashierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCashierError('');
    setCashierSuccess('');
    setIsSavingCashier(true);

    const usernameTrimmed = cashierForm.username.trim().toLowerCase();
    const fullNameTrimmed = cashierForm.fullName.trim();
    const passwordTrimmed = cashierForm.password.trim();

    if (!usernameTrimmed || !fullNameTrimmed || !passwordTrimmed) {
      setCashierError('Semua field wajib diisi!');
      setIsSavingCashier(false);
      return;
    }

    const ownerUserDynamic = (shopSettings.ownerUsername || 'owner').toLowerCase();
    if (usernameTrimmed === ownerUserDynamic) {
      setCashierError(`Username "${ownerUserDynamic}" tidak diperbolehkan karena merupakan username Akun Owner!`);
      setIsSavingCashier(false);
      return;
    }

    // Check duplicate username
    const isDuplicate = cashiers.some(
      c => c.username.toLowerCase() === usernameTrimmed && (!editingCashier || c.id !== editingCashier.id)
    );

    if (isDuplicate) {
      setCashierError(`Username "${usernameTrimmed}" sudah terdaftar untuk kasir lain!`);
      setIsSavingCashier(false);
      return;
    }

    const cashierData: CashierAccount = {
      id: editingCashier ? editingCashier.id : `cashier_${Date.now()}`,
      username: usernameTrimmed,
      fullName: fullNameTrimmed,
      password: passwordTrimmed,
      createdAt: editingCashier ? editingCashier.createdAt : new Date().toISOString()
    };

    try {
      await onSaveCashier(cashierData);
      setCashierSuccess(editingCashier ? 'Akun kasir berhasil diperbarui!' : 'Akun kasir baru berhasil didaftarkan!');
      setCashierForm({ username: '', fullName: '', password: '' });
      setEditingCashier(null);
      setTimeout(() => setCashierSuccess(''), 3000);
    } catch (err) {
      setCashierError('Gagal menyimpan akun kasir. Silakan coba lagi.');
    } finally {
      setIsSavingCashier(false);
    }
  };

  const handleEditCashier = (c: CashierAccount) => {
    setEditingCashier(c);
    setCashierForm({
      username: c.username,
      fullName: c.fullName,
      password: c.password
    });
    setCashierError('');
    setCashierSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingCashier(null);
    setCashierForm({ username: '', fullName: '', password: '' });
    setCashierError('');
  };

  const handleDeleteClick = (id: string, name: string) => {
    triggerConfirm({
      title: 'Hapus Akun Kasir',
      message: `Apakah Anda yakin ingin menghapus akun kasir "${name}"?`,
      confirmText: 'Ya, Hapus',
      type: 'danger',
      onConfirm: async () => {
        await onDeleteCashier(id);
      }
    });
  };

  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) {
      alert('Nama kategori tidak boleh kosong!');
      return;
    }
    
    // Check duplicates (case-insensitive)
    if (categoriesList.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
      alert('Kategori tersebut sudah ada di database!');
      return;
    }

    const updatedCategories = [...categoriesList, name];
    if (onSaveCategories) {
      await onSaveCategories(updatedCategories);
    }
    setNewCategory('');
  };

  const handleDeleteCategory = (index: number) => {
    triggerConfirm({
      title: 'Hapus Kategori',
      message: 'Apakah Anda yakin ingin menghapus kategori ini?',
      confirmText: 'Ya, Hapus',
      type: 'danger',
      onConfirm: async () => {
        const updatedCategories = [...categoriesList];
        updatedCategories.splice(index, 1);
        if (onSaveCategories) {
          await onSaveCategories(updatedCategories);
        }
      }
    });
  };

  const handleResetCategoriesToDefault = () => {
    triggerConfirm({
      title: 'Reset Kategori',
      message: 'Kembalikan semua daftar ke setelan bawaan toko? Kategori yang Anda tambahkan sendiri akan hilang.',
      confirmText: 'Reset',
      type: 'warning',
      onConfirm: async () => {
        const defaultCats = [
          "Mie", "Kebutuhan Bayi", "Bumbu Instan", "Rokok", "Sabun & Shampo", 
          "Aksesoris", "Pembersih", "Telur", "Susu", "Perawatan Tubuh & Skincare", 
          "Tissue & Kapas", "Snack", "ATK", "Minuman", "Roti & Kue", "Obat-obatan", "Lainnya"
        ];
        if (onSaveCategories) {
          await onSaveCategories(defaultCats);
        }
      }
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Maksimal ukuran file logo adalah 2MB!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

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
      currencySymbol: 'Rp.',
      logoUrl: logoUrl
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
        currencySymbol: 'Rp.',
        logoUrl
      },
      products,
      transactions,
      debts,
      cashiers,
      categories: categoriesList,
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

        triggerConfirm({
          title: 'Pulihkan Data Backup',
          message: 'Apakah Anda yakin ingin memulihkan data dari file backup? Ini akan menimpa seluruh data stok barang, transaksi, utang, dan profil toko saat ini!',
          confirmText: 'Pulihkan',
          type: 'warning',
          onConfirm: async () => {
            await onRestoreBackup({
              settings: parsed.settings,
              products: parsed.products,
              transactions: parsed.transactions || [],
              debts: parsed.debts || [],
              cashiers: parsed.cashiers || [],
              categories: parsed.categories || []
            });
            alert('Data berhasil dipulihkan dari file backup! Halaman akan menyegarkan data.');
            window.location.reload();
          }
        });
      } catch (err) {
        alert('Gagal membaca file backup! Terjadi kesalahan parsing JSON.');
        console.error(err);
      }
    };
    fileReader.readAsText(file);
  };

  // SYSTEM RESET DATA APLIKASI
  const handleResetSystem = () => {
    triggerConfirm({
      title: 'RESET DATA APLIKASI',
      message: 'PERINGATAN: Apakah Anda yakin ingin melakukan RESET DATA APLIKASI? Seluruh riwayat transaksi, catatan utang, stok barang, dan pengaturan profil toko akan DIHAPUS PERMANEN!',
      confirmText: 'Lanjutkan',
      type: 'danger',
      onConfirm: () => {
        // Double-stage confirmation with input confirmation in custom modal
        setTimeout(() => {
          triggerConfirm({
            title: 'KONFIRMASI AKHIR',
            message: 'Data yang dihapus tidak dapat dikembalikan. Ketik "HAPUS" di bawah ini untuk mengonfirmasi tindakan ini.',
            confirmText: 'Hapus Permanen',
            type: 'danger',
            showInputConfirmation: true,
            inputPlaceholder: 'Ketik "HAPUS" untuk konfirmasi',
            inputExpectedValue: 'HAPUS',
            onConfirm: async () => {
              await onResetAllData();
              alert('Sistem berhasil dikosongkan dan dikembalikan ke data awal! Aplikasi akan menyegarkan.');
              window.location.reload();
            }
          });
        }, 300);
      }
    });
  };

  // AUTO-BACKUP SYSTEM HANDLERS
  const handleDownloadAutoBackup = (backup: AutoBackup) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", backup.fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreAutoBackup = (backup: AutoBackup) => {
    triggerConfirm({
      title: 'Pulihkan dari Auto-Backup',
      message: `Apakah Anda yakin ingin memulihkan data dari auto-backup "${backup.fileName}"? Ini akan menimpa seluruh data saat ini!`,
      confirmText: 'Pulihkan',
      type: 'warning',
      onConfirm: async () => {
        await onRestoreBackup(backup.data);
        alert('Data berhasil dipulihkan dari auto-backup! Halaman akan menyegarkan data.');
        window.location.reload();
      }
    });
  };

  const handleDeleteAutoBackupClick = (id: string) => {
    triggerConfirm({
      title: 'Hapus Auto-Backup',
      message: 'Apakah Anda yakin ingin menghapus file auto-backup ini?',
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: () => {
        deleteAutoBackup(id);
        setAutoBackupsList(getAutoBackups());
      }
    });
  };

  const handleClearAllAutoBackupsClick = () => {
    triggerConfirm({
      title: 'Hapus Semua Auto-Backup',
      message: 'Apakah Anda yakin ingin menghapus SELURUH riwayat file auto-backup?',
      confirmText: 'Hapus Semua',
      type: 'danger',
      onConfirm: () => {
        clearAllAutoBackups();
        setAutoBackupsList(getAutoBackups());
      }
    });
  };

  const handleCreateManualBackup = () => {
    const activeUser = localStorage.getItem('pos_active_user') 
      ? JSON.parse(localStorage.getItem('pos_active_user')!) 
      : null;
    performAutoBackup(activeUser);
    setAutoBackupsList(getAutoBackups());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Shop Profile Setup & Cashier Management */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        
        {/* Shop Profile Setup */}
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Store className="w-5 h-5 text-slate-800" />
          <h2 className="text-base font-bold text-slate-900">Profil & Pengaturan Toko</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Logo Upload Section */}
          <div className="sm:col-span-2 border-b border-dashed border-slate-200 pb-5 mb-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">Logo Toko</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div 
                id="logo_preview_container"
                onClick={() => document.getElementById('shop_logo_input')?.click()}
                className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-600 hover:bg-blue-50/40 flex items-center justify-center overflow-hidden cursor-pointer group transition-all relative shrink-0"
              >
                {logoUrl ? (
                  <>
                    <img id="shop_logo_img" src={logoUrl} alt="Logo Toko" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-all">
                      Ganti Logo
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1 group-hover:text-blue-600 animate-bounce" />
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-600">Pilih Logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    id="choose_logo_btn"
                    type="button"
                    onClick={() => document.getElementById('shop_logo_input')?.click()}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    Pilih Logo Toko
                  </button>
                  {logoUrl && (
                    <button
                      id="remove_logo_btn"
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>
                <input
                  id="shop_logo_input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <p className="text-[11px] text-slate-400 leading-normal">
                  Format gambar: JPG, PNG, atau WEBP. Maksimal ukuran 2MB. Logo ini akan dicetak di bagian paling atas struk belanja Anda.
                </p>
              </div>
            </div>
          </div>
          
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
      {/* Cashier & Owner Account Management Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Kelola Akses Akun</h2>
          </div>
          
          {/* Segmented Tab controls: Owner vs Kasir */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveManagementSubTab('owner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeManagementSubTab === 'owner'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Akun Owner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveManagementSubTab('cashier')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeManagementSubTab === 'cashier'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Akun Kasir ({cashiers.length})</span>
            </button>
          </div>
        </div>

        {activeManagementSubTab === 'owner' ? (
          <div>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Kelola kredensial login utama Pemilik Toko (Owner). Akun ini memiliki akses penuh ke seluruh pengaturan, laporan keuangan, audit, dan reset sistem.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Form: Edit Owner */}
              <form onSubmit={handleSaveOwnerSubmit} className="md:col-span-5 space-y-5 bg-indigo-50/30 p-6 rounded-2xl border border-indigo-150/40">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-3 mb-2">
                  <Shield className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <h3 className="text-sm font-bold text-indigo-950">
                    Konfigurasi Akun Owner
                  </h3>
                </div>

                {/* Owner Name */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap Owner *</label>
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="owner_fullname_input"
                      type="text"
                      required
                      placeholder="Contoh: Arif Rahman"
                      value={ownerForm.fullName}
                      onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Owner Username */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username Owner *</label>
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <AtSign className="w-4 h-4" />
                    </span>
                    <input
                      id="owner_username_input"
                      type="text"
                      required
                      placeholder="Contoh: owner"
                      value={ownerForm.username}
                      onChange={(e) => setOwnerForm({ ...ownerForm, username: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Owner Password */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password Owner *</label>
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      id="owner_password_input"
                      type="text"
                      required
                      placeholder="Masukkan password..."
                      value={ownerForm.password}
                      onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-mono"
                    />
                  </div>
                </div>

                {ownerError && (
                  <p id="owner_form_error" className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-xl border border-red-100">
                    {ownerError}
                  </p>
                )}

                {ownerSuccess && (
                  <p id="owner_form_success" className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-100 animate-pulse">
                    {ownerSuccess}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200/60">
                  <button
                    id="save_owner_btn"
                    type="submit"
                    disabled={isSavingOwner}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {isSavingOwner ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Right panel: Informational details about Owner role */}
              <div className="md:col-span-7 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-sm font-extrabold text-slate-800 border-b border-slate-200/60 pb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Hak Istimewa & Peran Owner</span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex gap-3 items-start">
                      <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 font-bold text-xs font-mono shrink-0">
                        01
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800">Manajemen Finansial & Laporan Lengkap</h4>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Hanya akun Owner yang diijinkan untuk melihat grafik laba bersih, rincian pengeluaran modal, rasio profit, rincian hutang piutang, dan tren performa penjualan toko.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 font-bold text-xs font-mono shrink-0">
                        02
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800">Kontrol Kredensial Staff Kasir</h4>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Membuat, mengedit password, atau memberhentikan hak akses akun-akun kasir secara langsung demi integritas transaksi toko Anda.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 font-bold text-xs font-mono shrink-0">
                        03
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800">Otoritas Reset & Backup</h4>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Hanya akun Owner yang memiliki akses untuk mengosongkan semua basis data, mengunduh file backup Excel/JSON, atau memulihkan data dari sesi lama.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200/60 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] text-slate-500 font-semibold">Status Login Owner:</span>
                    <span className="text-xs font-bold text-slate-800 font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-100">
                      @{ownerForm.username}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold italic">Hak Akses: Administrator Utama</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Buat, edit, dan hapus kredensial kasir Anda di bawah ini. Akun yang terdaftar di sini dapat digunakan oleh kasir untuk masuk ke aplikasi.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left: Add / Edit Form */}
              <form onSubmit={handleSaveCashierSubmit} className="md:col-span-5 space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3 mb-2">
                  <UserPlus className="w-5 h-5 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingCashier ? 'Edit Akun Kasir' : 'Tambah Kasir Baru'}
                  </h3>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</label>
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="cashier_fullname_input"
                      type="text"
                      required
                      placeholder="Contoh: Siti Aminah"
                      value={cashierForm.fullName}
                      onChange={(e) => setCashierForm({ ...cashierForm, fullName: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username Kasir *</label>
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <AtSign className="w-4 h-4" />
                    </span>
                    <input
                      id="cashier_username_input"
                      type="text"
                      required
                      placeholder="Contoh: sitiaminah"
                      value={cashierForm.username}
                      onChange={(e) => setCashierForm({ ...cashierForm, username: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password *</label>
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      id="cashier_password_input"
                      type="text"
                      required
                      placeholder="Masukkan password..."
                      value={cashierForm.password}
                      onChange={(e) => setCashierForm({ ...cashierForm, password: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all font-mono"
                    />
                  </div>
                </div>

                {cashierError && (
                  <p id="cashier_form_error" className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-xl border border-red-100">
                    {cashierError}
                  </p>
                )}

                {cashierSuccess && (
                  <p id="cashier_form_success" className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-100 animate-pulse">
                    {cashierSuccess}
                  </p>
                )}

                <div className="flex gap-2.5 pt-2 border-t border-slate-200/60">
                  {editingCashier && (
                    <button
                      id="cancel_edit_cashier_btn"
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-all"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    id="save_cashier_btn"
                    type="submit"
                    disabled={isSavingCashier}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {isSavingCashier ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{editingCashier ? 'Simpan' : 'Daftarkan'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Right: Cashiers List */}
              <div className="md:col-span-7 space-y-4">
                <div className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Daftar Kasir Aktif</span>
                </div>

                {cashiers.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 flex flex-col items-center justify-center">
                    <p className="text-sm text-slate-400 font-semibold">Belum ada kasir yang terdaftar.</p>
                    <p className="text-xs text-slate-400 mt-1.5">Gunakan formulir untuk mendaftarkan akun kasir baru.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {cashiers.map((c) => (
                      <div 
                        key={c.id} 
                        className="p-4 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 rounded-2xl flex items-center justify-between transition-all"
                      >
                        <div className="space-y-1.5">
                          <div className="text-sm font-bold text-slate-900">
                            {c.fullName}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-bold text-slate-700 flex items-center gap-1">
                              <AtSign className="w-3 h-3 text-slate-400" />
                              {c.username}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-slate-400 bg-white/40 px-2 py-0.5 rounded-lg border border-slate-200/40 text-[11px]">
                              <Key className="w-3 h-3 text-slate-400" />
                              {c.password}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            id={`edit_cashier_${c.username}`}
                            onClick={() => handleEditCashier(c)}
                            title="Edit Akun"
                            className="w-9 h-9 border border-slate-200 rounded-xl bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center cursor-pointer transition-all text-slate-500 shadow-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete_cashier_${c.username}`}
                            onClick={() => handleDeleteClick(c.id, c.fullName)}
                            title="Hapus Akun"
                            className="w-9 h-9 border border-slate-200 rounded-xl bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center cursor-pointer transition-all text-slate-500 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

    </div>

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

        {/* SYSTEM AUTO-BACKUP MODULE */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-800" />
              <h3 className="text-sm font-bold text-slate-900">Sistem Auto-Backup</h3>
            </div>
            <button
              id="manual_auto_backup_trigger"
              type="button"
              onClick={handleCreateManualBackup}
              title="Backup Manual Sekarang"
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-blue-50"
            >
              <SaveAll className="w-3.5 h-3.5" />
              <span>Backup Sekarang</span>
            </button>
          </div>
          
          <p className="text-xs text-slate-400 leading-normal">
            Data transaksi, utang, dan stok barang dicadangkan secara otomatis setiap kali Anda keluar aplikasi (logout) atau menutup tab browser.
          </p>

          <div className="space-y-3 pt-1">
            {autoBackupsList.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Belum ada file auto-backup tersimpan.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Akan terbuat otomatis saat keluar aplikasi.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {autoBackupsList.map((backup) => (
                  <div key={backup.id} className="border border-slate-100 rounded-lg p-2.5 bg-slate-50 hover:bg-slate-100/70 transition-all flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-slate-800 truncate" title={backup.fileName}>
                          {backup.fileName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {new Date(backup.timestamp).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className="text-[9px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.5 rounded shrink-0 leading-none">
                        {backup.data.transactions?.length || 0} Tx
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        Oleh: {backup.user.split(' ')[0]}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          id={`download_auto_backup_${backup.id}`}
                          type="button"
                          onClick={() => handleDownloadAutoBackup(backup)}
                          title="Unduh file JSON"
                          className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`restore_auto_backup_${backup.id}`}
                          type="button"
                          onClick={() => handleRestoreAutoBackup(backup)}
                          title="Pulihkan data ini"
                          className="p-1 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete_auto_backup_${backup.id}`}
                          type="button"
                          onClick={() => handleDeleteAutoBackupClick(backup.id)}
                          title="Hapus backup"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  id="clear_all_auto_backups_btn"
                  type="button"
                  onClick={handleClearAllAutoBackupsClick}
                  className="w-full mt-2 py-1.5 bg-red-50 hover:bg-red-100/80 text-red-600 text-[11px] font-bold rounded-lg transition-all border border-red-200/30"
                >
                  Bersihkan Semua Auto-Backup
                </button>
              </div>
            )}
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

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        showInputConfirmation={confirmModal.showInputConfirmation}
        inputPlaceholder={confirmModal.inputPlaceholder}
        inputExpectedValue={confirmModal.inputExpectedValue}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
