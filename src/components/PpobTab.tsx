import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  History, 
  Trash2, 
  Clock,
  Loader2,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Smartphone,
  Edit3,
  Copy,
  AlertCircle,
  AlertTriangle,
  X,
  Printer,
  Sparkles,
  Wallet,
  ArrowLeftRight,
  Activity,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Struktur data TypeScript untuk keamanan tipe data produk PPOB
interface ProdukPPOB {
  nama: string;
  modal: number;
  jual: number;
}

// Struktur data untuk riwayat yang ditarik dari Firestore
interface RiwayatPPOB {
  id: string;
  layanan: string;
  target: string;
  bankPenerima: string;
  biayaModal: number;
  biayaJual: number;
  profitToko: number;
  tanggal: any;
  produk: string;
}

const servicesList = [
  {
    id: "Pulsa",
    name: "Pulsa",
    icon: Smartphone,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    hoverBg: "hover:bg-blue-500/20",
    border: "border-blue-500/20",
    activeBorder: "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.35)]",
    desc: "Pulsa & Paket Data",
    badge: "Seluler"
  },
  {
    id: "Token Listrik / PLN",
    name: "Token PLN",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    hoverBg: "hover:bg-amber-500/20",
    border: "border-amber-500/20",
    activeBorder: "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]",
    desc: "Token & Tagihan Listrik",
    badge: "Listrik"
  },
  {
    id: "E-Wallet",
    name: "E-Wallet",
    icon: Wallet,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    hoverBg: "hover:bg-emerald-500/20",
    border: "border-emerald-500/20",
    activeBorder: "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]",
    desc: "Gopay, OVO, Dana, Shopee",
    badge: "E-Money"
  },
  {
    id: "Transfer Bank / Non-Bank",
    name: "Kirim Uang",
    icon: ArrowLeftRight,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    hoverBg: "hover:bg-sky-500/20",
    border: "border-sky-500/20",
    activeBorder: "border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.35)]",
    desc: "Transfer Bank Se-Indonesia",
    badge: "Transfer"
  },
  {
    id: "BPJS",
    name: "BPJS",
    icon: Activity,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    hoverBg: "hover:bg-rose-500/20",
    border: "border-rose-500/20",
    activeBorder: "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)]",
    desc: "Iuran BPJS Kesehatan",
    badge: "Kesehatan"
  },
  {
    id: "Voucher Game",
    name: "Game",
    icon: Gamepad2,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    hoverBg: "hover:bg-purple-500/20",
    border: "border-purple-500/20",
    activeBorder: "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.35)]",
    desc: "Diamonds & Voucher Game",
    badge: "Gaming"
  }
];

export default function PpobTab() {
  const [layanan, setLayanan] = useState<string>('Pulsa');
  const [nomorTujuan, setNomorTujuan] = useState<string>('');
  const [bankTujuan, setBankTujuan] = useState<string>('BRI');
  const [nominalJual, setNominalJual] = useState<number>(0);
  const [hargaModal, setHargaModal] = useState<number>(0);
  const [uangBayar, setUangBayar] = useState<number>(0);
  const [indexProduk, setIndexProduk] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fitur Operator Pulsa & Nominal Manual
  const [operatorPulsa, setOperatorPulsa] = useState<string>('Telkomsel (Simpati, As, Loop, By.U)');
  const [operatorEWallet, setOperatorEWallet] = useState<string>('DANA');
  const [tipeNominalPulsa, setTipeNominalPulsa] = useState<'preset' | 'manual'>('preset');
  const [manualNominal, setManualNominal] = useState<number>(0);
  const [manualModal, setManualModal] = useState<number>(0);
  const [manualJual, setManualJual] = useState<number>(0);

  // Fitur PLN / Token Listrik
  const [tipePLN, setTipePLN] = useState<'token' | 'tagihan'>('token');
  const [pascabayarDetail, setPascabayarDetail] = useState<{
    namaPelanggan: string;
    tarifDaya: string;
    tagihanUtama: number;
    adminFee: number;
    totalTagihan: number;
  } | null>(null);

  // Helper untuk generate 20 digit token PLN
  const generateTokenCode = (): string => {
    let result = '';
    for (let i = 0; i < 5; i++) {
      const segment = Math.floor(1000 + Math.random() * 9000).toString();
      result += (i === 0 ? '' : '-') + segment;
    }
    return result;
  };

  // State untuk menyimpan daftar riwayat dan akumulasi profit PPOB dari Firestore
  const [listRiwayat, setListRiwayat] = useState<RiwayatPPOB[]>([]);
  const [totalOmzet, setTotalOmzet] = useState<number>(0);
  const [totalModal, setTotalModal] = useState<number>(0);
  const [totalProfit, setTotalProfit] = useState<number>(0);

  // Mengelompokkan transaksi berdasarkan kategori layanan (layanan) untuk visualisasi
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalJual: number; id: string; name: string; color: string; bg: string; icon: any }> = {
      "Pulsa": { count: 0, totalJual: 0, id: "Pulsa", name: "Pulsa", color: "text-blue-400", bg: "bg-blue-500", icon: Smartphone },
      "Token Listrik / PLN": { count: 0, totalJual: 0, id: "Token Listrik / PLN", name: "Token PLN", color: "text-amber-400", bg: "bg-amber-500", icon: Zap },
      "E-Wallet": { count: 0, totalJual: 0, id: "E-Wallet", name: "E-Wallet", color: "text-emerald-400", bg: "bg-emerald-500", icon: Wallet },
      "Transfer Bank / Non-Bank": { count: 0, totalJual: 0, id: "Transfer Bank / Non-Bank", name: "Kirim Uang", color: "text-sky-400", bg: "bg-sky-500", icon: ArrowLeftRight },
      "BPJS": { count: 0, totalJual: 0, id: "BPJS", name: "BPJS", color: "text-rose-400", bg: "bg-rose-500", icon: Activity },
      "Voucher Game": { count: 0, totalJual: 0, id: "Voucher Game", name: "Game", color: "text-purple-400", bg: "bg-purple-500", icon: Gamepad2 }
    };

    listRiwayat.forEach((tx) => {
      const lay = tx.layanan;
      if (stats[lay]) {
        stats[lay].count += 1;
        stats[lay].totalJual += tx.biayaJual || 0;
      }
    });

    const statsArray = Object.values(stats);
    const maxCount = Math.max(...statsArray.map(s => s.count), 1);
    const maxJual = Math.max(...statsArray.map(s => s.totalJual), 1);

    return {
      items: statsArray.sort((a, b) => b.count - a.count || b.totalJual - a.totalJual),
      maxCount,
      maxJual,
      totalCount: listRiwayat.length
    };
  }, [listRiwayat]);

  // State untuk Modals Kustom (Pengganti window.alert / confirm)
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [receiptState, setReceiptState] = useState<{
    isOpen: boolean;
    tx: RiwayatPPOB | null;
  }>({
    isOpen: false,
    tx: null
  });

  interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertState({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };

  const showReceipt = (tx: RiwayatPPOB) => {
    setReceiptState({ isOpen: true, tx });
  };

  const operatorList = [
    "Telkomsel (Simpati, As, Loop, By.U)",
    "Indosat Ooredoo (IM3, Mentari)",
    "XL Axiata (XL, Axis)",
    "Smartfren",
    "Three (3)"
  ];

  const ewalletList = [
    "DANA",
    "GoPay",
    "OVO",
    "LinkAja",
    "ShopeePay"
  ];

  const nominalPresetsPulsa = [
    { nama: "Pulsa 5.000", modal: 5300, jual: 7000, nominal: 5000 },
    { nama: "Pulsa 10.000", modal: 10200, jual: 12000, nominal: 10000 },
    { nama: "Pulsa 20.000", modal: 20200, jual: 22000, nominal: 20000 },
    { nama: "Pulsa 25.000", modal: 25200, jual: 27000, nominal: 25000 },
    { nama: "Pulsa 50.000", modal: 50200, jual: 52000, nominal: 50000 },
    { nama: "Pulsa 100.000", modal: 100200, jual: 102000, nominal: 100000 },
    { nama: "Pulsa 200.000", modal: 200200, jual: 202000, nominal: 200000 },
  ];

  // Data produk digital retail tiruan
  const masterDataPPOB: Record<string, ProdukPPOB[]> = {
    Pulsa: [], // Di-override oleh form khusus Pulsa
    "Token Listrik / PLN": [
      { nama: "Token PLN 20.000", modal: 20000, jual: 22500 },
      { nama: "Token PLN 50.000", modal: 50000, jual: 52500 },
      { nama: "Token PLN 100.000", modal: 100000, jual: 102500 },
    ],
    "E-Wallet": [
      { nama: "Top Up Dana 10.000", modal: 10000, jual: 12000 },
      { nama: "Top Up Dana 50.000", modal: 50000, jual: 52000 },
      { nama: "Top Up ShopeePay 20.000", modal: 20000, jual: 22000 },
      { nama: "Top Up GoPay 50.000", modal: 50000, jual: 52000 },
    ],
    "Transfer Bank / Non-Bank": [
      { nama: "Transfer Rp 100.000", modal: 100000, jual: 105000 },
      { nama: "Transfer Rp 500.000", modal: 500000, jual: 505000 },
      { nama: "Transfer Rp 1.000.000", modal: 1000000, jual: 106500 },
    ],
    BPJS: [
      { nama: "BPJS Kesehatan Kelas 3 (1 Bulan)", modal: 35000, jual: 37500 },
      { nama: "BPJS Kesehatan Kelas 2 (1 Bulan)", modal: 100000, jual: 102500 },
    ],
    "Voucher Game": [
      { nama: "Mobile Legends 86 Diamonds", modal: 19000, jual: 23000 },
      { nama: "Free Fire 50 Diamonds", modal: 7200, jual: 10000 },
    ]
  };

  // EFFECT: Mendengarkan data transaksi PPOB secara real-time & hitung profit otomatis
  useEffect(() => {
    const unsubscribe = dbService.subscribePPOBTransactions((data) => {
      let omzet = 0;
      let modal = 0;
      let profit = 0;

      data.forEach((item) => {
        omzet += item.biayaJual || 0;
        modal += item.biayaModal || 0;
        profit += item.profitToko || 0;
      });

      setListRiwayat(data);
      setTotalOmzet(omzet);
      setTotalModal(modal);
      setTotalProfit(profit);
    });

    return () => unsubscribe();
  }, []);

  // Effect: Hitung Tagihan Pascabayar PLN secara Otomatis saat ID dimasukkan secara valid
  useEffect(() => {
    if (layanan === 'Token Listrik / PLN' && tipePLN === 'tagihan') {
      const err = getValidationError('Token Listrik / PLN', nomorTujuan);
      if (nomorTujuan && !err) {
        // Gunakan penjumlahan karakter digit ID secara deterministik agar nilai konsisten untuk ID yang sama
        const numVal = nomorTujuan.split('').reduce((acc, char) => acc + (parseInt(char) || 0), 0);
        const names = [
          "Budi Santoso", "Siti Aminah", "Ahmad Hidayat", "Dewi Sartika", 
          "Heri Prasetyo", "Novi Anggraini", "Rudi Hermawan", "Rina Lestari"
        ];
        const name = names[numVal % names.length];
        const dayas = ["R1 / 450 VA", "R1 / 900 VA", "R1M / 900 VA", "R1 / 1300 VA", "R1 / 2200 VA"];
        const daya = dayas[numVal % dayas.length];
        
        // Buat tagihan deterministik antara Rp 45.000 hingga Rp 380.000
        const tagihanUtama = 45000 + (numVal % 15) * 20000 + (parseInt(nomorTujuan.slice(-2)) || 0) * 150;
        const adminFee = 3000;
        const total = tagihanUtama + adminFee;

        setPascabayarDetail({
          namaPelanggan: name,
          tarifDaya: daya,
          tagihanUtama: tagihanUtama,
          adminFee: adminFee,
          totalTagihan: total
        });

        // Set otomatis untuk transaksi kasir
        setNominalJual(total);
        setHargaModal(total - 2500); // Keuntungan Rp 2.500
        setIndexProduk('tagihan');
      } else {
        setPascabayarDetail(null);
        if (indexProduk === 'tagihan') {
          setNominalJual(0);
          setHargaModal(0);
          setIndexProduk('');
        }
      }
    } else {
      setPascabayarDetail(null);
    }
  }, [nomorTujuan, layanan, tipePLN]);

  const getValidationError = (lay: string, num: string): string | null => {
    if (!num) return null;
    const cleanDigits = num.replace(/\D/g, '');

    switch (lay) {
      case 'Pulsa':
        if (!/^[0-9+\s-]+$/.test(num)) {
          return 'Nomor HP hanya boleh berisi angka, spasi, atau tanda minus.';
        }
        if (!num.startsWith('08') && !num.startsWith('62') && !num.startsWith('+62')) {
          return 'Nomor HP Indonesia harus dimulai dengan 08, 62, atau +62.';
        }
        if (cleanDigits.length < 9 || cleanDigits.length > 15) {
          return `Panjang nomor HP harus antara 9-15 digit (saat ini: ${cleanDigits.length} digit).`;
        }
        break;

      case 'Token Listrik / PLN':
        if (!/^\d+$/.test(num)) {
          return 'Nomor meteran/ID PLN hanya boleh berisi angka.';
        }
        if (num.length < 11 || num.length > 12) {
          return `ID PLN / Nomor Meteran harus 11 atau 12 digit (saat ini: ${num.length} digit).`;
        }
        break;

      case 'E-Wallet':
        if (!/^[0-9+\s-]+$/.test(num)) {
          return 'ID E-Wallet / Nomor HP hanya boleh berisi angka, spasi, atau tanda minus.';
        }
        if (!num.startsWith('08') && !num.startsWith('62') && !num.startsWith('+62')) {
          return 'Nomor E-Wallet / HP harus dimulai dengan 08, 62, atau +62.';
        }
        if (cleanDigits.length < 9 || cleanDigits.length > 15) {
          return `Panjang nomor HP E-Wallet harus antara 9-15 digit (saat ini: ${cleanDigits.length} digit).`;
        }
        break;

      case 'Transfer Bank / Non-Bank':
        if (!/^\d+$/.test(num)) {
          return 'Nomor rekening bank hanya boleh berisi angka.';
        }
        if (num.length < 10 || num.length > 18) {
          return `Nomor rekening biasanya antara 10-18 digit (saat ini: ${num.length} digit).`;
        }
        break;

      case 'BPJS':
        if (!/^\d+$/.test(num)) {
          return 'Nomor Virtual Account BPJS hanya boleh berisi angka.';
        }
        if (num.length < 11 || num.length > 16) {
          return `Nomor BPJS/VA harus antara 11-16 digit (saat ini: ${num.length} digit).`;
        }
        break;

      case 'Voucher Game':
        if (num.length < 3) {
          return 'ID Player terlalu pendek (minimal 3 karakter).';
        }
        if (!/^[a-zA-Z0-9()\s-]+$/.test(num)) {
          return 'ID Player hanya boleh berisi huruf, angka, spasi, tanda kurung, atau minus.';
        }
        break;

      default:
        break;
    }
    return null;
  };

  const getPlaceholder = () => {
    switch (layanan) {
      case 'Pulsa':
        return 'Contoh: 081234567890';
      case 'Token Listrik / PLN':
        return 'Contoh ID Meteran: 14123456789';
      case 'E-Wallet':
        return 'Contoh: 085712345678';
      case 'Transfer Bank / Non-Bank':
        return 'Contoh nomor rekening: 123456789012 (BRI/BCA)';
      case 'BPJS':
        return 'Contoh nomor VA BPJS: 8888801234567890';
      case 'Voucher Game':
        return 'Contoh: 12345678(9876)';
      default:
        return 'Masukkan nomor atau ID tujuan...';
    }
  };

  const validationError = getValidationError(layanan, nomorTujuan);
  const isSubmitDisabled = loading || !nomorTujuan || !!validationError || nominalJual === 0 || indexProduk === "";

  const selectProduct = (val: string) => {
    setIndexProduk(val);
    setUangBayar(0);

    if (val === "") {
      setNominalJual(0);
      setHargaModal(0);
      setTipeNominalPulsa('preset');
      return;
    }

    if (layanan === 'Pulsa') {
      if (val === "manual") {
        setTipeNominalPulsa('manual');
        setNominalJual(manualJual);
        setHargaModal(manualModal);
      } else {
        setTipeNominalPulsa('preset');
        const preset = nominalPresetsPulsa[parseInt(val)];
        setNominalJual(preset.jual);
        setHargaModal(preset.modal);
      }
    } else if (layanan === 'Token Listrik / PLN') {
      if (val === "manual") {
        setTipeNominalPulsa('manual');
        setNominalJual(manualJual);
        setHargaModal(manualModal);
      } else {
        setTipeNominalPulsa('preset');
        const produk = masterDataPPOB[layanan][parseInt(val)];
        setNominalJual(produk.jual);
        setHargaModal(produk.modal);
      }
    } else if (layanan === 'E-Wallet') {
      setTipeNominalPulsa('manual');
      setNominalJual(manualJual);
      setHargaModal(manualModal);
    } else if (layanan === 'BPJS') {
      if (val === "manual") {
        setTipeNominalPulsa('manual');
        setNominalJual(manualJual);
        setHargaModal(manualModal);
      } else {
        setTipeNominalPulsa('preset');
        const produk = masterDataPPOB[layanan][parseInt(val)];
        setNominalJual(produk.jual);
        setHargaModal(produk.modal);
      }
    } else if (layanan === 'Voucher Game') {
      if (val === "manual") {
        setTipeNominalPulsa('manual');
        setNominalJual(manualJual);
        setHargaModal(manualModal);
      } else {
        setTipeNominalPulsa('preset');
        const produk = masterDataPPOB[layanan][parseInt(val)];
        setNominalJual(produk.jual);
        setHargaModal(produk.modal);
      }
    } else {
      setTipeNominalPulsa('preset');
      const produk = masterDataPPOB[layanan][parseInt(val)];
      setNominalJual(produk.jual);
      setHargaModal(produk.modal);
    }
  };

  const handlePilihProduk = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectProduct(e.target.value);
  };

  const handleManualPriceChange = (field: 'nominal' | 'modal' | 'jual', value: number) => {
    if (field === 'nominal') {
      setManualNominal(value);
    } else if (field === 'modal') {
      setManualModal(value);
      setHargaModal(value);
    } else if (field === 'jual') {
      setManualJual(value);
      setNominalJual(value);
    }
  };

  const handleProsesTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorTujuan || nominalJual === 0 || indexProduk === "") {
      showAlert("Form Belum Lengkap", "Mohon lengkapi Nomor Tujuan/ID dan Pilih Nominal Paket!", "error");
      return;
    }

    const err = getValidationError(layanan, nomorTujuan);
    if (err) {
      showToast(err, "error");
      showAlert("Nomor / ID Tidak Valid", err, "error");
      return;
    }

    let namaProduk = '';
    if (layanan === 'Pulsa') {
      const opName = operatorPulsa;
      if (indexProduk === 'manual') {
        namaProduk = `Pulsa ${opName} ${manualNominal.toLocaleString('id-ID')} (Manual)`;
      } else {
        const preset = nominalPresetsPulsa[parseInt(indexProduk)];
        namaProduk = `Pulsa ${opName} ${preset.nominal.toLocaleString('id-ID')}`;
      }
    } else if (layanan === 'Token Listrik / PLN') {
      if (tipePLN === 'token') {
        const tokenCode = generateTokenCode();
        if (indexProduk === 'manual') {
          namaProduk = `Token PLN ${manualNominal.toLocaleString('id-ID')} (KODE: ${tokenCode})`;
        } else {
          namaProduk = `${masterDataPPOB[layanan][parseInt(indexProduk)].nama} (KODE: ${tokenCode})`;
        }
      } else {
        namaProduk = `Tagihan PLN Pascabayar (${pascabayarDetail?.namaPelanggan || 'Pelanggan'})`;
      }
    } else if (layanan === 'E-Wallet') {
      namaProduk = `Top Up ${operatorEWallet} ${manualNominal.toLocaleString('id-ID')} (Manual)`;
    } else if (layanan === 'Transfer Bank / Non-Bank') {
      namaProduk = `Transfer ${bankTujuan} Rp ${manualNominal.toLocaleString('id-ID')} (Manual)`;
    } else if (layanan === 'BPJS') {
      if (indexProduk === 'manual') {
        namaProduk = `Bayar BPJS Kesehatan Rp ${manualNominal.toLocaleString('id-ID')} (Manual)`;
      } else {
        const produk = masterDataPPOB[layanan][parseInt(indexProduk)];
        namaProduk = produk.nama;
      }
    } else if (layanan === 'Voucher Game') {
      if (indexProduk === 'manual') {
        namaProduk = `Voucher Game ${manualNominal.toLocaleString('id-ID')} Diamonds (Manual)`;
      } else {
        const produk = masterDataPPOB[layanan][parseInt(indexProduk)];
        namaProduk = produk.nama;
      }
    } else {
      const produk = masterDataPPOB[layanan][parseInt(indexProduk)];
      namaProduk = produk.nama;
    }

    const keuntungan = nominalJual - hargaModal;
    setLoading(true);

    try {
      const newPPOB: RiwayatPPOB = {
        id: `ppob_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        layanan: layanan,
        target: nomorTujuan,
        bankPenerima: layanan === 'Transfer Bank / Non-Bank' ? bankTujuan : '-',
        biayaModal: hargaModal,
        biayaJual: nominalJual,
        profitToko: keuntungan,
        produk: namaProduk,
        tanggal: new Date().toISOString()
      };
      await dbService.savePPOBTransaction(newPPOB);

      // Tampilkan struk bukti bayar digital kustom yang cantik!
      showReceipt(newPPOB);

      // Reset Form Isian setelah sukses
      setNomorTujuan('');
      setNominalJual(0);
      setHargaModal(0);
      setUangBayar(0);
      setIndexProduk('');
      setManualNominal(0);
      setManualModal(0);
      setManualJual(0);
      setTipeNominalPulsa('preset');
    } catch (error) {
      console.error(error);
      showAlert("Transaksi Gagal", "Gagal memproses transaksi PPOB!", "error");
    } finally {
      setLoading(false);
    }
  };

  const clearLocalHistory = async () => {
    showConfirm(
      'Hapus Riwayat',
      'PERINGATAN: Apakah Anda yakin ingin menghapus seluruh riwayat transaksi digital PPOB dari penyimpanan Lokal? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        setLoading(true);
        try {
          await dbService.clearPPOBTransactions();
          showAlert('Dikosongkan', 'Seluruh riwayat PPOB berhasil dikosongkan!', 'success');
        } catch (err) {
          console.error(err);
          showAlert('Gagal', 'Gagal mengosongkan riwayat.', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const kembalian = uangBayar - nominalJual;

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#F4F4F7] min-h-screen font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6 animate-scaleIn">
        {/* Header Tab */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-br from-sky-600 via-cyan-500 to-emerald-500 rounded-3xl p-6 shadow-xl text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner shrink-0">
              <Zap className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-title text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-sky-200 shrink-0" /> Panel Transaksi PPOB & Digital
              </h3>
              <p className="text-xs text-cyan-100 font-semibold uppercase tracking-widest mt-0.5">Penyimpanan Lokal Offline-First</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <div className="hidden sm:flex items-center gap-2 bg-white/15 text-white px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
              Sistem Aktif
            </div>
            {listRiwayat.length > 0 && (
              <button
                type="button"
                onClick={clearLocalHistory}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-rose-100 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Kosongkan Riwayat</span>
              </button>
            )}
          </div>
        </div>

        {/* STATS / KARTU RINGKASAN DATA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TOTAL OMSET */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Omset PPOB</p>
            <h3 className="font-title text-3xl font-bold text-slate-800 mt-2 font-mono">Rp {totalOmzet.toLocaleString('id-ID')}</h3>
            <TrendingUp className="absolute right-6 bottom-6 h-8 w-8 text-sky-500/15 group-hover:text-sky-500/30 transition-colors" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-transparent opacity-50"></div>
          </div>

          {/* TOTAL MODAL */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Modal PPOB</p>
            <h3 className="font-title text-3xl font-bold text-slate-800 mt-2 font-mono">Rp {totalModal.toLocaleString('id-ID')}</h3>
            <CreditCard className="absolute right-6 bottom-6 h-8 w-8 text-blue-500/15 group-hover:text-blue-500/30 transition-colors" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-50"></div>
          </div>

          {/* KEUNTUNGAN BERSIH */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-md bg-emerald-50/10">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 animate-bounce" /> Keuntungan Bersih PPOB
            </p>
            <h3 className="font-title text-3xl font-bold text-emerald-600 mt-2 font-mono">Rp {totalProfit.toLocaleString('id-ID')}</h3>
            <TrendingUp className="absolute right-6 bottom-6 h-8 w-8 text-emerald-500/15 group-hover:text-emerald-500/30 transition-colors" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-50"></div>
          </div>
        </div>

        {/* VISUALISASI DATA: ANALISIS TRANSAKSI TERPOPULER */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                <TrendingUp className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-title text-base font-bold text-slate-800 tracking-wide">Analisis Layanan Terpopuler</h4>
                <p className="text-xs text-slate-500">Peringkat kategori digital berdasarkan frekuensi transaksi terbanyak.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
              <History className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-600">Total Transaksi: <span className="text-cyan-600 font-mono">{categoryStats.totalCount}</span></span>
            </div>
          </div>

          {categoryStats.totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-slate-500 max-w-sm">Belum ada transaksi terekam untuk visualisasi. Silakan lakukan transaksi digital baru di bawah ini!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SISI KIRI: HORIZONTAL BAR CHART */}
              <div className="space-y-4">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Visualisasi Grafik Batang</p>
                <div className="space-y-4">
                  {categoryStats.items.map((item, index) => {
                    const IconComponent = item.icon;
                    const percentage = (item.count / categoryStats.maxCount) * 100;
                    
                    return (
                      <div key={item.id} className="space-y-1 group">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-700">
                            <IconComponent className={`h-4 w-4 ${item.color.replace('-400', '-500')}`} />
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                            <span className="font-extrabold text-slate-800">{item.count} Tx</span>
                            <span>•</span>
                            <span>Rp {item.totalJual.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                        
                        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <motion.div
                            className={`h-full rounded-full opacity-90`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                            style={{
                              backgroundColor: item.bg === 'bg-blue-500' || item.bg === 'bg-blue-500/10' ? '#3b82f6' :
                                               item.bg === 'bg-amber-500' || item.bg === 'bg-amber-500/10' ? '#f59e0b' :
                                               item.bg === 'bg-emerald-500' || item.bg === 'bg-emerald-500/10' ? '#10b981' :
                                               item.bg === 'bg-sky-500' || item.bg === 'bg-sky-500/10' ? '#0ea5e9' :
                                               item.bg === 'bg-rose-500' || item.bg === 'bg-rose-500/10' ? '#f43f5e' :
                                               '#06b6d4'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SISI KANAN: RINGKASAN BENTO LIST CARDS */}
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Ringkasan Statistik Kontribusi</p>
                  
                  {/* Grid Bento untuk Kategori Top */}
                  <div className="grid grid-cols-2 gap-3">
                    {categoryStats.items.slice(0, 4).map((item, index) => {
                      const IconComponent = item.icon;
                      const contributionPercent = categoryStats.totalCount > 0 
                        ? Math.round((item.count / categoryStats.totalCount) * 100) 
                        : 0;

                      return (
                        <div key={item.id} className="bg-slate-50 border border-slate-200/60 hover:border-slate-300 hover:bg-slate-100/50 rounded-xl p-3.5 transition-all duration-300 relative group overflow-hidden shadow-sm">
                          {/* Badge Number Peringkat */}
                          <div className="absolute top-2 right-2 text-[10px] font-black font-mono text-slate-300 group-hover:text-slate-400 transition-colors">
                            #{index + 1}
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-white shadow-xs">
                              <IconComponent className={`h-3.5 w-3.5 ${item.color.replace('-400', '-500')}`} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 truncate pr-4">{item.name}</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="text-sm font-black text-slate-800 font-mono">{item.count} <span className="text-[9px] font-medium text-slate-500">Tx</span></div>
                            <div className="text-[10px] font-bold text-cyan-600">{contributionPercent}% dari total</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 flex items-center justify-between text-cyan-900 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-500 shrink-0 animate-pulse" />
                    <span className="text-[11px] font-semibold text-cyan-800">Saran Optimasi:</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {categoryStats.items[0]?.count > 0 
                      ? `${categoryStats.items[0].name} Paling Laris!` 
                      : 'Siap Menganalisis'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Grid Utama Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Form Input Transaksi */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h2 className="font-title text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-cyan-500" /> Menu Transaksi Baru
              </h2>
              <p className="text-xs text-slate-500 mt-1">Pilih layanan digital, masukkan nomor tujuan, dan proses pembayaran.</p>
            </div>

            <form onSubmit={handleProsesTransaksi} className="space-y-5">
              {/* Pilih Kategori Layanan (Visual Grid with Icons) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Kategori Layanan Digital</label>
                  <span className="text-[10px] text-purple-400 font-extrabold bg-purple-500/10 px-2 py-0.5 rounded-full tracking-wider uppercase">Proses Cepat</span>
                </div>
                
                {/* Grid Responsif - 3 Kolom di Mobile & Desktop, sangat ringkas */}
                <div className="grid grid-cols-3 gap-2">
                  {servicesList.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = layanan === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        disabled={loading}
                        onClick={() => {
                          setLayanan(item.id); 
                          setNominalJual(0); 
                          setHargaModal(0); 
                          setUangBayar(0);
                          setManualNominal(0);
                          setManualModal(0);
                          setManualJual(0);
                          if (item.id === 'E-Wallet' || item.id === 'Transfer Bank / Non-Bank') {
                            setIndexProduk('manual');
                            setTipeNominalPulsa('manual');
                          } else {
                            setIndexProduk('');
                            setTipeNominalPulsa('preset');
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-300 relative cursor-pointer group select-none ${
                          isSelected 
                            ? `${item.bg} ${item.activeBorder} text-white` 
                            : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        {/* Circle Icon Container */}
                        <div className={`p-2 rounded-lg mb-1 transition-all duration-300 ${
                          isSelected ? 'bg-white/10 scale-105' : 'bg-white/[0.03] group-hover:bg-white/5'
                        }`}>
                          <IconComponent className={`h-4 w-4 ${isSelected ? item.color : 'text-gray-400 group-hover:text-gray-200'}`} />
                        </div>
                        
                        {/* Label Name */}
                        <span className={`text-[10px] font-extrabold tracking-tight truncate w-full ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                          {item.name}
                        </span>
                        
                        {/* Active Indicator Bar */}
                        {isSelected && (
                          <div className="absolute bottom-1 w-3 h-0.5 rounded-full bg-purple-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Khusus Opsi Operator & Provider (PULSA) */}
              {layanan === 'Pulsa' && (
                <div className="space-y-1.5 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <label className="block font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-cyan-500" />
                    <span>Pilih Operator / Provider</span>
                  </label>
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-all">
                    <select 
                      value={operatorPulsa}
                      disabled={loading}
                      onChange={(e) => setOperatorPulsa(e.target.value)}
                      className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 focus:outline-none appearance-none cursor-pointer pr-10 font-semibold"
                    >
                      {operatorList.map((op, idx) => (
                        <option key={idx} value={op} className="bg-white text-slate-800">{op}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Khusus Opsi E-Wallet */}
              {layanan === 'E-Wallet' && (
                <div className="space-y-1.5 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <label className="block font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-cyan-500" />
                    <span>Pilih E-Wallet</span>
                  </label>
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-all">
                    <select 
                      value={operatorEWallet}
                      disabled={loading}
                      onChange={(e) => setOperatorEWallet(e.target.value)}
                      className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 focus:outline-none appearance-none cursor-pointer pr-10 font-semibold"
                    >
                      {ewalletList.map((op, idx) => (
                        <option key={idx} value={op} className="bg-white text-slate-800">{op}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Khusus Opsi Transfer Bank / Non-Bank */}
              {layanan === 'Transfer Bank / Non-Bank' && (
                <div className="space-y-1.5 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <label className="block font-bold text-xs text-slate-500 uppercase tracking-wider">Pilih Bank / Lembaga</label>
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-all">
                    <select 
                      value={bankTujuan} 
                      disabled={loading}
                      onChange={(e) => setBankTujuan(e.target.value)}
                      className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 focus:outline-none appearance-none cursor-pointer pr-10 font-semibold"
                    >
                      <option value="BRI" className="bg-white text-slate-800">BRI (Bank Rakyat Indonesia)</option>
                      <option value="BCA" className="bg-white text-slate-800">BCA (Bank Central Asia)</option>
                      <option value="BNI" className="bg-white text-slate-800">BNI (Bank Negara Indonesia)</option>
                      <option value="Mandiri" className="bg-white text-slate-800">Bank Mandiri</option>
                      <option value="BSI" className="bg-white text-slate-800">BSI (Bank Syariah Indonesia)</option>
                      <option value="Jago" className="bg-white text-slate-800">Bank Jago</option>
                      <option value="SeaBank" className="bg-white text-slate-800">SeaBank</option>
                      <option value="Allo" className="bg-white text-slate-800">Allo Bank</option>
                      <option value="Neobank" className="bg-white text-slate-800">Neobank (BNC)</option>
                      <option value="POS" className="bg-white text-slate-800">PT Pos Indonesia (Non-Bank)</option>
                      <option value="Pegadaian" className="bg-white text-slate-800">Pegadaian (Non-Bank)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Input No HP / ID / No Rekening */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 block">
                    {layanan === 'Token Listrik / PLN' ? 'ID Pelanggan / Meteran' : 
                     layanan === 'Transfer Bank / Non-Bank' ? 'No. Rekening Penerima' : 
                     layanan === 'BPJS' ? 'Nomor Virtual Account / Peserta' : 'No. Handphone / ID Game'}
                  </label>
                  
                  {/* Real-time Validation Status Badge */}
                  {nomorTujuan && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        validationError 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs'
                      }`}
                    >
                      {validationError ? 'Belum Sesuai ⚠️' : 'Format Sesuai ✨'}
                    </motion.span>
                  )}
                </div>

                <div className="relative rounded-xl overflow-hidden transition-all duration-300">
                  <input 
                    type="text"
                    required
                    disabled={loading}
                    value={nomorTujuan}
                    onChange={(e) => {
                      const val = e.target.value;
                      
                      // Filter characters based on the active digital service
                      if (['Token Listrik / PLN', 'Transfer Bank / Non-Bank', 'BPJS'].includes(layanan)) {
                        const clean = val.replace(/\D/g, '');
                        if (clean !== val) {
                          showToast("Layanan ini hanya menerima input angka/numerik!", "warning");
                        }
                        
                        // Limit maximum characters based on service rules
                        const maxLength = layanan === 'Token Listrik / PLN' ? 12 : layanan === 'BPJS' ? 16 : 18;
                        if (clean.length > maxLength) {
                          showToast(`Panjang nomor maksimal ${maxLength} digit!`, "warning");
                          setNomorTujuan(clean.slice(0, maxLength));
                        } else {
                          setNomorTujuan(clean);
                        }
                      } else if (layanan === 'Voucher Game') {
                        // Alphanumeric, spaces, parentheses, minus
                        const clean = val.replace(/[^a-zA-Z0-9()\s-]/g, '');
                        if (clean !== val) {
                          showToast("ID Game hanya boleh berisi huruf, angka, spasi, tanda kurung, atau minus!", "warning");
                        }
                        if (clean.length > 30) {
                          showToast("ID Game maksimal 30 karakter!", "warning");
                          setNomorTujuan(clean.slice(0, 30));
                        } else {
                          setNomorTujuan(clean);
                        }
                      } else {
                        // For Pulsa and E-Wallet
                        const clean = val.replace(/[^0-9+\s-]/g, '');
                        if (clean !== val) {
                          showToast("Hanya menerima angka, spasi, tanda minus (-), atau +62!", "warning");
                        }
                        if (clean.length > 15) {
                          showToast("Panjang nomor HP maksimal 15 digit!", "warning");
                          setNomorTujuan(clean.slice(0, 15));
                        } else {
                          setNomorTujuan(clean);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (nomorTujuan) {
                        const err = getValidationError(layanan, nomorTujuan);
                        if (err) {
                          showToast(err, "warning");
                        } else {
                          showToast("Input valid dan siap diproses!", "success");
                        }
                      }
                    }}
                    placeholder={getPlaceholder()}
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-slate-800 ${
                      nomorTujuan && validationError 
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' 
                        : nomorTujuan 
                          ? 'border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500 bg-emerald-50/30'
                          : 'border-slate-200 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white'
                    }`}
                  />
                </div>
                {nomorTujuan && validationError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-rose-500 font-semibold flex items-start gap-1.5 mt-1.5 bg-rose-50 border border-rose-200 rounded-xl p-3"
                  >
                    <span className="shrink-0 text-rose-500">⚠️</span>
                    <span>{validationError}</span>
                  </motion.p>
                )}
              </div>

              {/* Opsi Tipe PLN (Prabayar / Pascabayar) */}
              {layanan === 'Token Listrik / PLN' && (
                <div className="space-y-2 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <label className="block font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-cyan-500 animate-pulse" />
                    <span>Kategori Listrik PLN</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/50 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setTipePLN('token');
                        setIndexProduk('');
                        setNominalJual(0);
                        setHargaModal(0);
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                        tipePLN === 'token'
                          ? 'bg-white text-cyan-600 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🔌 Token (Prabayar)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipePLN('tagihan');
                        setIndexProduk('');
                        setNominalJual(0);
                        setHargaModal(0);
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                        tipePLN === 'tagihan'
                          ? 'bg-white text-cyan-600 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📄 Tagihan (Pascabayar)
                    </button>
                  </div>
                </div>
              )}

              {/* Visual Invoice Tagihan Listrik PLN Pascabayar */}
              {layanan === 'Token Listrik / PLN' && tipePLN === 'tagihan' && (
                <div className="space-y-3">
                  {pascabayarDetail ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fadeIn">
                      <div className="flex items-center gap-2 border-b border-dashed border-slate-200 pb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <h5 className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">Detail Tagihan Otomatis</h5>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nama Pelanggan</span>
                          <strong className="text-slate-800 font-bold">{pascabayarDetail.namaPelanggan}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tarif / Daya</span>
                          <strong className="text-slate-800 font-bold">{pascabayarDetail.tarifDaya}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tagihan Listrik</span>
                          <strong className="text-slate-800 font-mono">Rp {pascabayarDetail.tagihanUtama.toLocaleString('id-ID')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Biaya Admin PLN</span>
                          <strong className="text-slate-800 font-mono">Rp {pascabayarDetail.adminFee.toLocaleString('id-ID')}</strong>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-emerald-600">
                          <span className="font-bold">Total Tagihan</span>
                          <strong className="text-sm font-black font-mono">Rp {pascabayarDetail.totalTagihan.toLocaleString('id-ID')}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center text-xs text-slate-500 font-medium">
                      🔍 Masukkan ID Pelanggan 11-12 digit di atas untuk melihat detail tagihan secara otomatis.
                    </div>
                  )}
                </div>
              )}

              {/* Pilihan Paket / Nominal */}
              {layanan !== 'E-Wallet' && layanan !== 'Transfer Bank / Non-Bank' && !(layanan === 'Token Listrik / PLN' && tipePLN === 'tagihan') && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Nominal / Paket</label>
                  
                  {/* Select Dropdown (as fallback or secondary control) */}
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-all">
                    <select 
                      value={indexProduk}
                      disabled={loading}
                      onChange={handlePilihProduk}
                      className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 focus:outline-none appearance-none cursor-pointer pr-10 font-semibold"
                    >
                      <option value="" className="bg-white text-slate-500">-- Pilih Paket --</option>
                      {layanan === 'Pulsa' ? (
                        <>
                          {nominalPresetsPulsa.map((item, i) => (
                            <option key={i} value={i} className="bg-white text-slate-800">{item.nama} - (Rp {item.jual.toLocaleString('id-ID')})</option>
                          ))}
                          <option value="manual" className="font-bold text-cyan-600 bg-white">✨ Ketik Nominal Manual (Bebas) ✨</option>
                        </>
                      ) : layanan === 'Token Listrik / PLN' ? (
                        <>
                          {masterDataPPOB[layanan].map((item, i) => (
                            <option key={i} value={i} className="bg-white text-slate-800">{item.nama} - (Rp {item.jual.toLocaleString('id-ID')})</option>
                          ))}
                          <option value="manual" className="font-bold text-cyan-600 bg-white">✨ Ketik Nominal Manual (Bebas) ✨</option>
                        </>
                      ) : layanan === 'BPJS' ? (
                        <>
                          {masterDataPPOB[layanan].map((item, i) => (
                            <option key={i} value={i} className="bg-white text-slate-800">{item.nama} - (Rp {item.jual.toLocaleString('id-ID')})</option>
                          ))}
                          <option value="manual" className="font-bold text-cyan-600 bg-white">✨ Ketik Nominal Manual (Bebas) ✨</option>
                        </>
                      ) : layanan === 'Voucher Game' ? (
                        <>
                          {masterDataPPOB[layanan].map((item, i) => (
                            <option key={i} value={i} className="bg-white text-slate-800">{item.nama} - (Rp {item.jual.toLocaleString('id-ID')})</option>
                          ))}
                          <option value="manual" className="font-bold text-cyan-600 bg-white">✨ Ketik Nominal Manual (Bebas) ✨</option>
                        </>
                      ) : (
                        masterDataPPOB[layanan].map((item, i) => (
                          <option key={i} value={i} className="bg-white text-slate-800">{item.nama} - (Rp {item.jual.toLocaleString('id-ID')})</option>
                        ))
                      )}
                    </select>
                    <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none h-4 w-4" />
                  </div>

                  {/* Gorgeous Visual Grid Chips */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {layanan === 'Pulsa' && nominalPresetsPulsa.map((item, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => selectProduct(String(i))}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                          indexProduk === String(i)
                            ? 'bg-cyan-50 border-cyan-500 text-slate-800 shadow-sm'
                            : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-800 truncate">{item.nama}</div>
                        <div className="text-[11px] font-mono font-extrabold text-cyan-600 mt-1">Rp {item.jual.toLocaleString('id-ID')}</div>
                        {indexProduk === String(i) && (
                          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-cyan-500 flex items-center justify-center text-white text-[8px] font-bold">✓</div>
                        )}
                      </button>
                    ))}

                    {layanan !== 'Pulsa' && masterDataPPOB[layanan] && masterDataPPOB[layanan].map((item, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => selectProduct(String(i))}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                          indexProduk === String(i)
                            ? 'bg-cyan-50 border-cyan-500 text-slate-800 shadow-sm'
                            : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-800 truncate">{item.nama}</div>
                        <div className="text-[11px] font-mono font-extrabold text-cyan-600 mt-1">Rp {item.jual.toLocaleString('id-ID')}</div>
                        {indexProduk === String(i) && (
                          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-cyan-500 flex items-center justify-center text-white text-[8px] font-bold">✓</div>
                        )}
                      </button>
                    ))}

                    {/* Manual Option Visual Card */}
                    <button
                      type="button; submit"
                      onClick={() => selectProduct('manual')}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                        indexProduk === 'manual'
                          ? 'bg-cyan-50 border-cyan-500 text-slate-800 shadow-sm'
                          : 'bg-slate-50 border-dashed border-slate-300 text-cyan-600 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs text-cyan-600 flex items-center gap-1">✨ Manual</div>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">Ketik nominal bebas</div>
                      {indexProduk === 'manual' && (
                        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-cyan-500 flex items-center justify-center text-white text-[8px] font-bold">✓</div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Jika Pilihan Nominal Adalah Manual (Ketik Manual) untuk Pulsa / Token / BPJS / Voucher Game / E-Wallet / Transfer Bank */}
              {((layanan === 'Pulsa' || layanan === 'Token Listrik / PLN' || layanan === 'BPJS' || layanan === 'Voucher Game') && tipeNominalPulsa === 'manual' && indexProduk === 'manual') || (layanan === 'E-Wallet') || (layanan === 'Transfer Bank / Non-Bank') ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-1">
                     <Edit3 className="h-4 w-4 text-cyan-500" />
                     <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {layanan === 'Pulsa' ? 'Ketik Nominal & Harga Pulsa' : 
                       layanan === 'Token Listrik / PLN' ? 'Ketik Nominal & Harga Token PLN' : 
                       layanan === 'BPJS' ? 'Ketik Nominal & Harga BPJS Kesehatan' :
                       layanan === 'Voucher Game' ? 'Ketik Jumlah Diamond & Harga' :
                       layanan === 'E-Wallet' ? `Ketik Nominal & Harga Top Up ${operatorEWallet}` : 
                       `Ketik Nominal & Harga Transfer ${bankTujuan}`}
                     </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                      {layanan === 'Voucher Game' ? 'Jumlah Diamond' : 'Nominal (Rp)'}
                    </label>
                    <input 
                      type="number" 
                      value={manualNominal || ''} 
                      onChange={(e) => handleManualPriceChange('nominal', Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      placeholder={layanan === 'Voucher Game' ? 'Contoh: 86' : 'Contoh: 50000'}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider">Harga Modal (Rp)</label>
                      <input 
                        type="number" 
                        value={manualModal || ''} 
                        onChange={(e) => handleManualPriceChange('modal', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        placeholder="Contoh: 50200"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider">Harga Jual (Rp)</label>
                      <input 
                        type="number" 
                        value={manualJual || ''} 
                        onChange={(e) => handleManualPriceChange('jual', Number(e.target.value))}
                        className="w-full bg-white border border-cyan-500/40 rounded-xl px-3 py-2 text-sm font-bold text-cyan-600 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-cyan-50/10"
                        placeholder="Contoh: 52000"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Untuk Token Listrik / PLN Preset yang Memiliki Nominal Tapi Ingin Edit Harga */}
              {layanan === 'Token Listrik / PLN' && indexProduk !== '' && indexProduk !== 'manual' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-1">
                    <Edit3 className="h-4 w-4 text-cyan-500" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {tipePLN === 'tagihan' ? 'Sesuaikan Harga Tagihan PLN (Edit Harga)' : 'Sesuaikan Harga Token Listrik (Edit Harga)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider">Harga Modal (Rp)</label>
                      <input 
                        type="number" 
                        value={hargaModal || ''} 
                        onChange={(e) => setHargaModal(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider">Harga Jual (Rp)</label>
                      <input 
                        type="number" 
                        value={nominalJual || ''} 
                        onChange={(e) => setNominalJual(Number(e.target.value))}
                        className="w-full bg-white border border-cyan-500/40 rounded-xl px-3 py-2 text-sm font-bold text-cyan-600 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-cyan-50/10"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Kalkulator Kasir */}
              {nominalJual > 0 && (
                <div className="bg-cyan-50/50 border border-cyan-100 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Total Tagihan</span>
                    <strong className="text-lg font-extrabold text-slate-800 font-mono">Rp {nominalJual.toLocaleString('id-ID')}</strong>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block font-bold text-[10px] text-cyan-800 uppercase tracking-wider">Uang Pembayaran Konsumen</label>
                    <input 
                      type="number" 
                      value={uangBayar || ''} 
                      disabled={loading}
                      onChange={(e) => setUangBayar(Number(e.target.value))} 
                      className="w-full bg-white border border-cyan-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none transition-all text-slate-800 font-mono"
                      placeholder="Input uang tunai konsumen..."
                    />
                  </div>

                  {uangBayar >= nominalJual && (
                    <div className="flex justify-between items-center pt-2 border-t border-cyan-100 text-emerald-600">
                      <span className="text-xs font-bold uppercase tracking-wider">Kembalian</span>
                      <span className="text-sm font-extrabold font-mono">Rp {kembalian.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* BUTTON PROSES */}
              <motion.button 
                type="submit"
                disabled={isSubmitDisabled}
                whileHover={isSubmitDisabled ? {} : { scale: 1.02, boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" }}
                whileTap={isSubmitDisabled ? {} : { scale: 0.98 }}
                className="relative overflow-hidden w-full mt-8 bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white font-title text-sm font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
              >
                {/* Glowing fluid background during loading */}
                {loading && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-600"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{ backgroundSize: '200% 200%' }}
                  />
                )}

                {/* Shimmer pulse effect when active */}
                {loading && (
                  <span className="absolute inset-x-0 bottom-0 h-1 bg-white/30 overflow-hidden">
                    <motion.span 
                      className="block h-full bg-white"
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      style={{ position: 'absolute', width: '30%' }}
                    />
                  </span>
                )}
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0 text-white" />
                      <span className="tracking-widest uppercase font-black text-xs">Menyimpan Ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-purple-200 shrink-0" />
                      <span>Proses Transaksi & Cetak</span>
                    </>
                  )}
                </span>
              </motion.button>
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Riwayat Transaksi */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-md min-h-[500px]">
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Riwayat Transaksi Digital</h4>
                <p className="text-[11px] text-slate-500">Daftar transaksi PPOB yang tersimpan secara lokal dan aman</p>
              </div>
              <span className="bg-cyan-50 text-cyan-600 border border-cyan-100 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {listRiwayat.length} Record
              </span>
            </div>

            {/* List Riwayat */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {listRiwayat.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
                  <History className="h-10 w-10 text-slate-400 mx-auto mb-3 animate-bounce" />
                  <p className="text-xs font-semibold text-slate-500">Belum ada riwayat transaksi</p>
                  <p className="text-[10px] text-slate-400 mt-1">Silakan lakukan pengisian transaksi digital pada panel form sebelah kiri</p>
                </div>
              ) : (
                listRiwayat.map((tx) => {
                  let waktuStr = '-';
                  if (tx.tanggal) {
                    const d = tx.tanggal.toDate ? tx.tanggal.toDate() : new Date(tx.tanggal);
                    waktuStr = d.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) + ' - ' + d.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    });
                  }

                  const tokenMatch = tx.produk.match(/KODE:\s*([\d-]+)/);
                  const parsedToken = tokenMatch ? tokenMatch[1] : null;
                  const displayProdukName = parsedToken ? tx.produk.replace(/\(KODE:[\s\d-]+\)/, '').trim() : tx.produk;

                  return (
                    <div key={tx.id} className="flex justify-between items-start p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-xs">
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-extrabold bg-cyan-50 text-cyan-600 border border-cyan-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            {tx.layanan}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {waktuStr}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 truncate">{displayProdukName}</h5>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                          ID: {tx.target} {tx.bankPenerima !== '-' ? `(${tx.bankPenerima})` : ''}
                        </p>
                        
                        {parsedToken && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 max-w-[280px]">
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block">KODE TOKEN PLN (20 DIGIT)</span>
                              <code className="text-xs font-mono font-extrabold text-amber-900 tracking-wider block truncate">{parsedToken}</code>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(parsedToken);
                                showToast("Kode Token PLN berhasil disalin!", "success");
                              }}
                              title="Salin Kode Token"
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-slate-800 font-mono block">
                          Rp {tx.biayaJual.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] font-semibold text-emerald-600 font-mono">
                          +{tx.profitToko.toLocaleString('id-ID')} profit
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>* Otomatis menyimpan riwayat transaksi secara aman</span>
            <span>Penyimpanan Lokal</span>
          </div>
        </div>

      </div>

      {/* Custom Modals using AnimatePresence */}
      <AnimatePresence>
        {/* 1. Alert Modal */}
        {alertState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
            >
              {alertState.type === 'success' && (
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              )}
              {alertState.type === 'error' && (
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 text-rose-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
              )}
              {alertState.type === 'info' && (
                <div className="mx-auto w-12 h-12 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-cyan-600 animate-pulse" />
                </div>
              )}

              <h3 className="text-center text-lg font-bold text-slate-800 tracking-wide">{alertState.title}</h3>
              <p className="text-center text-xs text-slate-500 mt-2 leading-relaxed">{alertState.message}</p>

              <button
                type="button"
                onClick={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}

        {/* 2. Confirm Modal */}
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 animate-bounce text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>

              <h3 className="text-center text-lg font-bold text-slate-800 tracking-wide">{confirmState.title}</h3>
              <p className="text-center text-xs text-slate-500 mt-2 leading-relaxed">{confirmState.message}</p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmState.onConfirm();
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 3. Gorgeous Receipt (Struk) Modal */}
        {receiptState.isOpen && receiptState.tx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptState(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative max-w-md w-full bg-white text-slate-800 rounded-3xl p-6 shadow-2xl z-10 border border-slate-200 overflow-hidden"
            >
              {/* Header Struk */}
              <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 animate-pulse" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-950 uppercase tracking-wide">Transaksi Sukses</h3>
                <p className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold mt-0.5">Bukti Pembayaran Digital</p>
              </div>

              {/* Body Struk */}
              <div className="mt-5 space-y-4 font-mono text-xs">
                {/* Info Toko & Transaksi */}
                <div className="grid grid-cols-2 gap-y-2 text-slate-600 border-b border-slate-100 pb-3">
                  <div>No. Invoice:</div>
                  <div className="text-right font-bold text-slate-900 truncate">{receiptState.tx.id}</div>
                  <div>Waktu:</div>
                  <div className="text-right font-bold text-slate-900">
                    {new Date(receiptState.tx.tanggal).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Detil Layanan */}
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans font-bold uppercase tracking-wider text-[10px]">Kategori</span>
                    <strong className="text-slate-900 font-sans font-extrabold bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest">{receiptState.tx.layanan}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tujuan / ID:</span>
                    <strong className="text-slate-900 font-bold text-sm tracking-wider">{receiptState.tx.target}</strong>
                  </div>
                  {receiptState.tx.bankPenerima !== '-' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank Penerima:</span>
                      <strong className="text-slate-900 font-extrabold">{receiptState.tx.bankPenerima}</strong>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 shrink-0">Produk:</span>
                    <strong className="text-slate-900 text-right font-bold ml-4 leading-relaxed truncate max-w-[180px]">{receiptState.tx.produk}</strong>
                  </div>
                </div>

                {/* Harga tagihan */}
                <div className="border-t-2 border-dashed border-slate-300 pt-4 space-y-2.5">
                  <div className="flex justify-between text-sm text-slate-900 font-bold">
                    <span>Total Biaya:</span>
                    <span className="text-base text-slate-950 font-black">Rp {receiptState.tx.biayaJual.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {/* Simulated barcode for aesthetics */}
                  <div className="flex flex-col items-center justify-center pt-2 pb-1 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="h-6 flex items-center tracking-[4px] text-slate-500 font-serif text-[18px] select-none opacity-80">
                      ||| | ||| || ||| | ||
                    </div>
                    <span className="text-[8px] tracking-widest text-slate-400 mt-0.5">THANK YOU FOR YOUR PATRONAGE</span>
                  </div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const textToCopy = `
=== BUKTI PEMBAYARAN DIGITAL ===
Invoice   : ${receiptState.tx?.id}
Layanan   : ${receiptState.tx?.layanan}
Tujuan/ID : ${receiptState.tx?.target} ${receiptState.tx?.bankPenerima !== '-' ? `(${receiptState.tx?.bankPenerima})` : ''}
Produk    : ${receiptState.tx?.produk}
Total     : Rp ${receiptState.tx?.biayaJual.toLocaleString('id-ID')}
Waktu     : ${new Date(receiptState.tx?.tanggal).toLocaleString('id-ID')}
Terima kasih telah melakukan transaksi di toko kami.
                    `.trim();
                    navigator.clipboard.writeText(textToCopy);
                    showAlert("Bukti Disalin", "Bukti transaksi digital berhasil disalin ke clipboard!", "success");
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Struk</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Struk</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setReceiptState(prev => ({ ...prev, isOpen: false }))}
                className="w-full mt-3 text-center text-slate-400 hover:text-slate-600 font-bold text-xs py-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-2xl border shadow-2xl pointer-events-auto backdrop-blur-md flex items-start gap-3 border-slate-100 ${
                toast.type === 'success' ? 'bg-[#ECFDF5]/95 text-emerald-800 border-emerald-200/50' :
                toast.type === 'error' ? 'bg-[#FFF5F5]/95 text-rose-800 border-rose-200/50' :
                toast.type === 'warning' ? 'bg-[#FFFBEB]/95 text-amber-800 border-amber-200/50' :
                'bg-[#F0F9FF]/95 text-sky-800 border-sky-200/50'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
                {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                {toast.type === 'info' && <Sparkles className="h-5 w-5 text-sky-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold font-sans leading-relaxed tracking-wide">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  </div>
  );
}
