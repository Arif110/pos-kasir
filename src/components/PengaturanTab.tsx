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
  Zap,
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
import { ShopSettings, Product, Transaction, Debt, CashierAccount, AutoBackup, RiwayatPPOB } from '../types';
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
  onResetDebtsData: () => Promise<void>;
  onResetPPOBData?: () => Promise<void>;
  onRestoreBackup: (data: {
    settings: ShopSettings;
    products: Product[];
    transactions: Transaction[];
    debts: Debt[];
    cashiers?: CashierAccount[];
    categories?: string[];
    ppobTransactions?: RiwayatPPOB[];
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
  onResetDebtsData,
  onResetPPOBData,
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
  const [localPrintUrl, setLocalPrintUrl] = useState(shopSettings.localPrintUrl || 'http://localhost:3000/print');

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
    setLocalPrintUrl(shopSettings.localPrintUrl || 'http://localhost:3000/print');
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
      ...shopSettings,
      shopName: shopName.trim() || 'Toko Kasir',
      shopAddress: shopAddress.trim() || '-',
      shopPhone: shopPhone.trim() || '-',
      receiptFooter: receiptFooter.trim() || 'Terima Kasih!',
      qrisText: qrisText.trim() || 'DUMMY_QRIS',
      currencySymbol: 'Rp.',
      logoUrl: logoUrl,
      localPrintUrl: localPrintUrl.trim() || 'http://localhost:3000/print'
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
        ...shopSettings,
        shopName,
        shopAddress,
        shopPhone,
        receiptFooter,
        qrisText,
        currencySymbol: 'Rp.',
        logoUrl,
        localPrintUrl
      },
      products,
      transactions,
      debts,
      cashiers,
      categories: categoriesList,
      ppobTransactions: JSON.parse(localStorage.getItem('pos_ppob_transactions') || '[]'),
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
              categories: parsed.categories || [],
              ppobTransactions: parsed.ppobTransactions || []
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

  // SYSTEM RESET CATATAN UTANG
  const handleResetDebts = () => {
    triggerConfirm({
      title: 'RESET CATATAN UTANG',
      message: 'PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH catatan utang pelanggan? Tindakan ini bersifat permanen dan tidak dapat dibatalkan!',
      confirmText: 'Lanjutkan',
      type: 'danger',
      onConfirm: () => {
        setTimeout(() => {
          triggerConfirm({
            title: 'KONFIRMASI AKHIR RESET UTANG',
            message: 'Seluruh data utang pelanggan akan dihapus. Ketik "UTANG" di bawah ini untuk mengonfirmasi tindakan ini.',
            confirmText: 'Hapus Catatan Utang',
            type: 'danger',
            showInputConfirmation: true,
            inputPlaceholder: 'Ketik "UTANG" untuk konfirmasi',
            inputExpectedValue: 'UTANG',
            onConfirm: async () => {
              await onResetDebtsData();
              alert('Seluruh catatan utang berhasil dikosongkan!');
              window.location.reload();
            }
          });
        }, 300);
      }
    });
  };

  // SYSTEM RESET DATA TRANSAKSI PPOB & DIGITAL
  const handleResetPPOB = () => {
    triggerConfirm({
      title: 'RESET TRANSAKSI PPOB & DIGITAL',
      message: 'PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH riwayat transaksi digital PPOB (Pulsa, PLN, E-Wallet, dsb.)? Tindakan ini bersifat permanen dan tidak dapat dibatalkan!',
      confirmText: 'Lanjutkan',
      type: 'danger',
      onConfirm: () => {
        setTimeout(() => {
          triggerConfirm({
            title: 'KONFIRMASI AKHIR RESET PPOB',
            message: 'Seluruh data transaksi digital PPOB akan dihapus. Ketik "PPOB" di bawah ini untuk mengonfirmasi tindakan ini.',
            confirmText: 'Hapus Riwayat PPOB & Digital',
            type: 'danger',
            showInputConfirmation: true,
            inputPlaceholder: 'Ketik "PPOB" untuk konfirmasi',
            inputExpectedValue: 'PPOB',
            onConfirm: async () => {
              if (onResetPPOBData) {
                await onResetPPOBData();
              } else {
                localStorage.setItem('pos_ppob_transactions', JSON.stringify([]));
              }
              alert('Seluruh riwayat transaksi PPOB & Digital berhasil dikosongkan!');
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
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border border-slate-100 p-8 space-y-8">
          
          {/* Header Panel */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profil & Pengaturan Toko</h1>
              <p className="text-xs text-slate-400 mt-0.5">Kelola identitas visual, informasi kontak, dan konfigurasi cetak struk toko Anda</p>
            </div>
          </div>

          {/* Form Form Isian */}
          <div className="space-y-6">
            
            {/* 1. Bagian Pengaturan Logo Toko */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logo Toko</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                <div 
                  id="logo_preview_container"
                  onClick={() => document.getElementById('shop_logo_input')?.click()}
                  className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center p-2 overflow-hidden cursor-pointer group transition-all shrink-0 relative"
                >
                  {logoUrl ? (
                    <>
                      <img id="shop_logo_img" src={logoUrl} alt="Logo Toko" className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-all">
                        Ganti Logo
                      </div>
                    </>
                  ) : (
                    <span className="text-white text-[10px] font-extrabold text-center uppercase tracking-tighter block">
                      {shopName || 'LOGO TOKO'}
                    </span>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <button 
                      id="choose_logo_btn"
                      type="button"
                      onClick={() => document.getElementById('shop_logo_input')?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      Pilih Logo Toko
                    </button>
                    {logoUrl && (
                      <button 
                        id="remove_logo_btn"
                        type="button"
                        onClick={handleRemoveLogo}
                        className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
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
                  <p className="text-[11px] text-slate-400 leading-relaxed">Format gambar: JPG, PNG, atau WEBP. Maksimal ukuran 2MB. Logo ini akan dicetak di bagian paling atas struk belanja Anda.</p>
                </div>
              </div>
            </div>

            {/* Grid Dua Kolom untuk Nama & Telepon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 2. Nama Toko */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Toko *</label>
                <input 
                  id="set_shop_name"
                  type="text" 
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 transition-all outline-none"
                />
              </div>

              {/* 3. Nomor Telepon Toko */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Telepon Toko *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input 
                    id="set_shop_phone"
                    type="text" 
                    required
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-800 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Alamat Toko Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Toko Lengkap *</label>
              <div className="relative">
                <span className="absolute top-3.5 left-4 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <textarea 
                  id="set_shop_address"
                  required
                  rows={2}
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-800 transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* 5. Teks String QRIS Toko */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payload / Teks String QRIS Toko *</label>
              <textarea 
                id="set_qris_text"
                required
                rows={2}
                placeholder="000201..."
                value={qrisText}
                onChange={(e) => setQrisText(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-4 text-xs font-mono text-slate-600 transition-all outline-none break-all"
              />
              <p className="text-[11px] text-slate-400">Masukkan string QRIS nasional Anda untuk memunculkan scan bayar otomatis secara dinamis di layar kasir.</p>
            </div>

            {/* 6. Receipt Footer Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pesan Kaki Struk (Receipt Footer)</label>
              <textarea 
                id="set_receipt_footer"
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-4 text-sm font-medium text-slate-800 transition-all outline-none resize-none"
              />
              <p className="text-[11px] text-slate-400">Kalimat penutup yang tercetak di bagian paling bawah lembar struk fisik pelanggan.</p>
            </div>

            {/* 7. Local Printer API Endpoint URL */}
            <div className="space-y-1.5 border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>URL API Printer Lokal (Thermal POS)</span>
              </label>
              <input 
                id="set_local_print_url"
                type="text" 
                value={localPrintUrl}
                onChange={(e) => setLocalPrintUrl(e.target.value)}
                placeholder="http://localhost:3000/print"
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 px-4 text-sm font-mono text-slate-700 transition-all outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Alamat Endpoint HTTP server printer termal lokal Anda (misal: <code className="bg-slate-100 px-1 rounded font-mono text-xs">http://localhost:3000/print</code> atau <code className="bg-slate-100 px-1 rounded font-mono text-xs">https://localhost:3000/print</code>). 
                <span className="text-rose-500 block font-semibold mt-1">⚠️ Catatan HTTPS: Jika aplikasi ini dibuka via HTTPS, browser akan memblokir request ke http:// (CORS/Mixed Content). Gunakan endpoint HTTPS atau jalankan proxy lokal dengan enkripsi SSL.</span>
              </p>
            </div>

          </div>

          {/* Tombol Submit Form */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {saveSuccess && (
              <span id="save_success_alert" className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Pengaturan profil berhasil disimpan!</span>
              </span>
            )}
            
            <button 
              id="save_settings_btn"
              type="submit"
              disabled={isSaving}
              className="ml-auto bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 text-emerald-400" />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </div>

        </form>
      {/* Cashier & Owner Account Management Panel */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6">
        
        {/* Header Panel & Toggle Akun Sejajar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl animate-pulse">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Kelola Akses Akun</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeManagementSubTab === 'owner' 
                  ? 'Kelola kredensial login utama Pemilik Toko (Owner)' 
                  : `Kelola kredensial staff kasir Anda (${cashiers.length} terdaftar)`}
              </p>
            </div>
          </div>
          
          {/* Toggle Tab Akun */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button 
              type="button"
              onClick={() => setActiveManagementSubTab('owner')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeManagementSubTab === 'owner'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {activeManagementSubTab === 'owner' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>}
              <span>Akun Owner</span>
            </button>
            <button 
              type="button"
              onClick={() => setActiveManagementSubTab('cashier')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeManagementSubTab === 'cashier'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {activeManagementSubTab === 'cashier' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>}
              <span>Akun Kasir ({cashiers.length})</span>
            </button>
          </div>
        </div>

        {/* Layout Grid 2 Kolom Sejajar (Menghemat Ruang Vertikal) */}
        {activeManagementSubTab === 'owner' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            
            {/* KOLOM KIRI: Form Konfigurasi (Lebar 5/12) */}
            <form onSubmit={handleSaveOwnerSubmit} className="md:col-span-5 bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <span className="w-1 h-3 bg-blue-500 rounded-full"></span> Konfigurasi Login
                </h2>
                
                {/* Nama Lengkap */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap Owner *</label>
                  <input 
                    id="owner_fullname_input"
                    type="text" 
                    required
                    placeholder="Arif Rahman"
                    value={ownerForm.fullName}
                    onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-lg py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username Owner *</label>
                  <input 
                    id="owner_username_input"
                    type="text" 
                    required
                    placeholder="owner"
                    value={ownerForm.username}
                    onChange={(e) => setOwnerForm({ ...ownerForm, username: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-lg py-2 px-3 text-xs font-mono font-medium outline-none transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password Owner *</label>
                  <input 
                    id="owner_password_input"
                    type="text" 
                    required
                    placeholder="000"
                    value={ownerForm.password}
                    onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-lg py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>
              </div>

              {ownerError && (
                <p id="owner_form_error" className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {ownerError}
                </p>
              )}

              {ownerSuccess && (
                <p id="owner_form_success" className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 animate-pulse">
                  {ownerSuccess}
                </p>
              )}

              {/* Tombol Simpan */}
              <button 
                id="save_owner_btn"
                type="submit" 
                disabled={isSavingOwner}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-md shadow-blue-600/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
              >
                {isSavingOwner ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </form>

            {/* KOLOM KANAN: Informasi Hak Istimewa (Lebar 7/12) */}
            <div className="md:col-span-7 border border-slate-100 p-4 rounded-xl flex flex-col justify-between bg-white">
              <div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                  <span className="w-1 h-3 bg-slate-400 rounded-full"></span> Hak Istimewa & Peran
                </h2>
                
                {/* Item List Otoritas */}
                <div className="space-y-3">
                  {/* Otoritas 1 */}
                  <div className="flex gap-2.5 items-start">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0 mt-0.5">01</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Manajemen Finansial & Laporan Lengkap</h3>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Melihat grafik laba bersih, rincian modal, rasio profit, piutang, dan tren performa penjualan.</p>
                    </div>
                  </div>

                  {/* Otoritas 2 */}
                  <div className="flex gap-2.5 items-start">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 shrink-0 mt-0.5">02</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Kontrol Kredensial Staff Kasir</h3>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Membuat, mengedit password, atau menonaktifkan hak akses akun staf kasir secara langsung.</p>
                    </div>
                  </div>

                  {/* Otoritas 3 */}
                  <div className="flex gap-2.5 items-start">
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 shrink-0 mt-0.5">03</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Otoritas Reset & Backup</h3>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Mengosongkan basis data, mengunduh file cadangan data, serta memulihkan data lama.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge Footer Info */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Login: <span className="font-mono font-semibold text-slate-700">@{ownerForm.username}</span>
                </span>
                <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">
                  Administrator Utama
                </span>
              </div>
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            
            {/* KOLOM KIRI: Form Kasir (Lebar 5/12) */}
            <form onSubmit={handleSaveCashierSubmit} className="md:col-span-5 bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                  {editingCashier ? 'Edit Akun Kasir' : 'Daftar Kasir Baru'}
                </h2>
                
                {/* Nama Lengkap */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap Kasir *</label>
                  <input 
                    id="cashier_fullname_input"
                    type="text" 
                    required
                    placeholder="Siti Aminah"
                    value={cashierForm.fullName}
                    onChange={(e) => setCashierForm({ ...cashierForm, fullName: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-lg py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username Kasir *</label>
                  <input 
                    id="cashier_username_input"
                    type="text" 
                    required
                    placeholder="sitiaminah"
                    value={cashierForm.username}
                    onChange={(e) => setCashierForm({ ...cashierForm, username: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-lg py-2 px-3 text-xs font-mono font-medium outline-none transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password Kasir *</label>
                  <input 
                    id="cashier_password_input"
                    type="text" 
                    required
                    placeholder="123"
                    value={cashierForm.password}
                    onChange={(e) => setCashierForm({ ...cashierForm, password: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-lg py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>
              </div>

              {cashierError && (
                <p id="cashier_form_error" className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {cashierError}
                </p>
              )}

              {cashierSuccess && (
                <p id="cashier_form_success" className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 animate-pulse">
                  {cashierSuccess}
                </p>
              )}

              {/* Tombol Aksi */}
              <div className="flex gap-2 pt-2 border-t border-slate-150">
                {editingCashier && (
                  <button
                    id="cancel_edit_cashier_btn"
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                )}
                <button 
                  id="save_cashier_btn"
                  type="submit" 
                  disabled={isSavingCashier}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-md shadow-blue-600/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  {isSavingCashier ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{editingCashier ? 'Simpan' : 'Daftarkan'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* KOLOM KANAN: Daftar Kasir (Lebar 7/12) */}
            <div className="md:col-span-7 border border-slate-100 p-4 rounded-xl flex flex-col justify-between bg-white">
              <div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                  <span className="w-1 h-3 bg-slate-400 rounded-full"></span> Daftar Kasir Aktif
                </h2>
                
                {cashiers.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4 flex flex-col items-center justify-center">
                    <p className="text-xs text-slate-400 font-semibold">Belum ada kasir yang terdaftar.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Gunakan formulir untuk mendaftarkan akun kasir baru.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {cashiers.map((c) => (
                      <div 
                        key={c.id} 
                        className="p-3 bg-slate-50 border border-slate-150 hover:border-slate-250 hover:bg-slate-100/50 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {c.fullName}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700 flex items-center gap-0.5">
                              <AtSign className="w-2.5 h-2.5 text-slate-400" />
                              {c.username}
                            </span>
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-500 flex items-center gap-0.5">
                              <Key className="w-2.5 h-2.5 text-slate-400" />
                              {c.password}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            id={`edit_cashier_${c.username}`}
                            onClick={() => handleEditCashier(c)}
                            title="Edit Akun"
                            className="w-7 h-7 border border-slate-200 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center cursor-pointer transition-all text-slate-500 shadow-sm animate-fade-in"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete_cashier_${c.username}`}
                            onClick={() => handleDeleteClick(c.id, c.fullName)}
                            title="Hapus Akun"
                            className="w-7 h-7 border border-slate-200 rounded-lg bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center cursor-pointer transition-all text-slate-500 shadow-sm animate-fade-in"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Badge Footer Info */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Staff Kasir: <span className="font-mono font-bold text-slate-700">{cashiers.length} Orang</span></span>
                <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  Kasir Siap Bertransaksi
                </span>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>

    {/* Right Column: QRIS display, Backup, Reset Controls */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">
        
        {/* QRIS Real-time Visualizer Panel */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            {/* Header Panel QRIS */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <QrCode className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Pratinjau QRIS Toko</h2>
            </div>

            {/* QR Code & Keterangan */}
            <div className="flex flex-col items-center text-center bg-slate-50/60 rounded-xl p-5 border border-slate-100/80 mb-5">
              {/* Bingkai QR Code Modern */}
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200/60 mb-3">
                <img 
                  id="settings_qris_visual"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrisText)}`} 
                  alt="QRIS Toko" 
                  className="w-32 h-32 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">{shopName}</h3>
              <p className="text-[10px] font-mono text-slate-400 mt-1 max-w-[220px] truncate">
                {qrisText}
              </p>
            </div>
          </div>

          {/* Tombol Aksi QRIS */}
          <button 
            id="print_qris_sheet_btn"
            type="button"
            onClick={() => setShowQrisPrintSheet(true)}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Cetak QRIS Pajangan</span>
          </button>
        </div>

        {/* Database backup data logs & import restore */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            {/* Header Panel Data */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Download className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Ekspor & Impor Data</h2>
            </div>

            {/* Deskripsi Backup */}
            <p className="text-xs text-slate-500 leading-relaxed bg-indigo-50/30 p-4 rounded-xl border border-indigo-50/50 mb-5">
              Cadangkan (backup) seluruh data stok barang, catatan utang, profil toko, dan riwayat transaksi menjadi file <span className="font-bold text-indigo-600">JSON</span>. Anda dapat memulihkannya kapan saja di perangkat lain.
            </p>
          </div>

          {/* Grup Tombol Aksi Data */}
          <div className="space-y-2.5">
            {/* Tombol Ekspor */}
            <button 
              id="export_backup_data_btn"
              type="button"
              onClick={handleExportBackup}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-slate-900/5 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Ekspor Backup (.json)</span>
            </button>
            
            {/* Tombol Impor */}
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
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <Upload className="h-4 w-4 text-slate-500" />
                <span>Impor / Pulihkan Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 1: SISTEM AUTO-BACKUP */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-5 flex flex-col h-[480px]">
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Sistem Auto-Backup</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Pencadangan otomatis riwayat transaksi</p>
              </div>
            </div>
            
            <button
              id="manual_auto_backup_trigger"
              type="button"
              onClick={handleCreateManualBackup}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <SaveAll className="h-3.5 w-3.5" />
              <span>Backup Sekarang</span>
            </button>
          </div>

          {/* Info Deskripsi Ringkas */}
          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
            Data transaksi, utang, dan stok barang dicadangkan otomatis setiap kali Anda keluar aplikasi (logout) atau menutup tab browser.
          </p>

          {/* Container List Data (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scroll">
            {autoBackupsList.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Belum ada file auto-backup tersimpan.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Akan terbuat otomatis saat keluar aplikasi.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2.5">
                  {autoBackupsList.map((backup) => (
                    <div key={backup.id} className="bg-white border border-slate-200/70 rounded-xl p-3 hover:border-blue-300 transition-colors group">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="truncate max-w-[240px]">
                          <p className="text-xs font-mono font-semibold text-slate-700 truncate" title={backup.fileName}>
                            {backup.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(backup.timestamp).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })} • <span className="font-medium text-slate-500">Oleh: {backup.user.split(' ')[0]}</span>
                          </p>
                        </div>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                          {backup.data.transactions?.length || 0} Tx
                        </span>
                      </div>
                      <div className="flex justify-end gap-3 text-slate-400 pt-1.5 border-t border-slate-50">
                        <button
                          id={`download_auto_backup_${backup.id}`}
                          type="button"
                          onClick={() => handleDownloadAutoBackup(backup)}
                          className="hover:text-blue-600 p-0.5 transition-colors cursor-pointer"
                          title="Unduh"
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </button>
                        <button
                          id={`restore_auto_backup_${backup.id}`}
                          type="button"
                          onClick={() => handleRestoreAutoBackup(backup)}
                          className="hover:text-amber-600 p-0.5 transition-colors cursor-pointer"
                          title="Pulihkan"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          id={`delete_auto_backup_${backup.id}`}
                          type="button"
                          onClick={() => handleDeleteAutoBackupClick(backup.id)}
                          className="hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  id="clear_all_auto_backups_btn"
                  type="button"
                  onClick={handleClearAllAutoBackupsClick}
                  className="w-full mt-3 py-1.5 bg-red-50 hover:bg-red-100/80 text-red-600 text-[11px] font-bold rounded-lg transition-all border border-red-200/30 cursor-pointer"
                >
                  Bersihkan Semua Auto-Backup
                </button>
              </>
            )}
          </div>
        </div>

        {/* CARD 2: ZONA BAHAYA (DANGER ZONE) */}
        <div className="bg-rose-50/40 rounded-2xl shadow-xl shadow-rose-100/40 border border-rose-100 p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="p-2 bg-rose-100 rounded-xl">
              <FileWarning className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-700 tracking-tight">Zona Bahaya (Danger Zone)</h2>
              <p className="text-[10px] text-rose-500/70 mt-0.5">Tindakan tidak dapat dibatalkan</p>
            </div>
          </div>

          <p className="text-[11px] text-red-600/80 leading-relaxed">
            Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Pastikan Anda sudah mengekspor data backup sebelum melanjutkan.
          </p>

          <button
            id="factory_reset_app_btn"
            type="button"
            onClick={handleResetSystem}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm border-0 cursor-pointer active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Kosongkan & Reset Data</span>
          </button>

          <button
            id="reset_debts_btn"
            type="button"
            onClick={handleResetDebts}
            className="w-full py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset Catatan Utang</span>
          </button>

          <button
            id="reset_ppob_btn"
            type="button"
            onClick={handleResetPPOB}
            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Reset Transaksi PPOB & Digital</span>
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
