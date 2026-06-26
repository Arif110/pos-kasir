import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw,
  Sparkles,
  Barcode,
  X,
  PackagePlus,
  ArrowRightLeft
} from 'lucide-react';
import { Product, ShopSettings } from '../types';

interface StokTabProps {
  products: Product[];
  shopSettings: ShopSettings;
  onSaveProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function StokTab({ 
  products, 
  shopSettings, 
  onSaveProduct, 
  onDeleteProduct 
}: StokTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [filterLowStock, setFilterLowStock] = useState(false);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Product forms
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    name: '',
    category: '',
    price: 0,
    purchasePrice: 0,
    stock: 0,
    minStock: 5
  });

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category))).filter(Boolean)];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.includes(searchQuery);
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesLowStock = !filterLowStock || p.stock <= p.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleOpenAddModal = () => {
    setFormData({
      id: 'prod_' + Date.now(),
      code: '',
      name: '',
      category: 'Makanan',
      price: 0,
      purchasePrice: 0,
      stock: 0,
      minStock: 5
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setFormData({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      price: p.price,
      purchasePrice: p.purchasePrice,
      stock: p.stock,
      minStock: p.minStock
    });
    setShowEditModal(true);
  };

  const handleGenerateBarcode = () => {
    // Generate a beautiful 12-digit random numeric string representing a custom SKU
    const randomCode = '899' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setFormData(prev => ({ ...prev, code: randomCode }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Nama dan Barcode wajib diisi!');
      return;
    }

    if (formData.price < formData.purchasePrice) {
      if (!confirm('Harga jual lebih rendah dari harga beli (potensi rugi). Anda yakin ingin melanjutkan?')) {
        return;
      }
    }

    const savedProduct: Product = {
      id: formData.id,
      code: formData.code.trim(),
      name: formData.name.trim(),
      category: formData.category.trim() || 'Umum',
      price: Number(formData.price),
      purchasePrice: Number(formData.purchasePrice),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock)
    };

    await onSaveProduct(savedProduct);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleDelete = async (p: Product) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${p.name}"?`)) {
      await onDeleteProduct(p.id);
    }
  };

  const formatPrice = (num: number) => {
    return shopSettings.currencySymbol + ' ' + num.toLocaleString('id-ID');
  };

  return (
    <div className="space-y-4">
      {/* Search Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              id="stock_search_input"
              type="text"
              placeholder="Cari SKU atau nama barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors text-sm"
            />
          </div>

          {/* Category Dropdown Filter */}
          <select
            id="stock_category_filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Kategori: {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Right buttons: Low stock filter and Add item */}
        <div className="flex gap-2.5 w-full md:w-auto justify-end">
          <button
            id="filter_low_stock_btn"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterLowStock 
                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-sm' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Peringatan Stok Rendah</span>
          </button>

          <button
            id="add_new_product_btn"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Stock Inventory Table View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider font-mono">
                <th className="p-4">SKU / Kode</th>
                <th className="p-4">Nama Barang</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Harga Beli</th>
                <th className="p-4 text-right">Harga Jual</th>
                <th className="p-4 text-right">Margin / Profit</th>
                <th className="p-4 text-center">Stok</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock <= p.minStock && p.stock > 0;
                const margin = p.price - p.purchasePrice;
                const profitPercent = p.purchasePrice > 0 ? Math.round((margin / p.purchasePrice) * 100) : 0;

                return (
                  <tr 
                    id={`table_row_${p.id}`}
                    key={p.id} 
                    className={`hover:bg-slate-50 transition-colors ${
                      isOutOfStock 
                        ? 'bg-red-50/20 text-slate-500' 
                        : isLowStock 
                          ? 'bg-amber-50/20 text-slate-800' 
                          : 'text-slate-700'
                    }`}
                  >
                    <td className="p-4 font-mono text-xs">{p.code}</td>
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {isOutOfStock && (
                          <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                            Habis
                          </span>
                        )}
                        {isLowStock && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            <span>Rendah</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-slate-600">{formatPrice(p.purchasePrice)}</td>
                    <td className="p-4 text-right font-mono text-xs text-emerald-700 font-extrabold">{formatPrice(p.price)}</td>
                    <td className="p-4 text-right font-mono text-xs">
                      <div className="text-slate-900 font-bold">{formatPrice(margin)}</div>
                      <div className="text-[10px] text-slate-400">Margin: {profitPercent}%</div>
                    </td>
                    <td className="p-4 text-center font-bold">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                        isOutOfStock 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : isLowStock 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {p.stock} unit
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`edit_prod_${p.id}`}
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded transition-colors"
                          title="Edit Barang"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete_prod_${p.id}`}
                          onClick={() => handleDelete(p)}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded transition-colors"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada data barang yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modals */}
      {(showAddModal || showEditModal) && (
        <div id="product_modal_popup" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="text-base font-bold flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-400" />
                <span>{showAddModal ? 'Tambah Barang Baru' : 'Edit Detail Barang'}</span>
              </h3>
              <button
                id="close_product_modal"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Product Code SKU Barcode */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">SKU / Kode Barcode *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Barcode className="w-4 h-4" />
                      </span>
                      <input
                        id="form_prod_code"
                        type="text"
                        required
                        placeholder="Scan atau ketik kode barcode..."
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    {showAddModal && (
                      <button
                        id="generate_barcode_btn"
                        type="button"
                        onClick={handleGenerateBarcode}
                        className="px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                        title="Buat SKU Otomatis"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                        <span>Auto SKU</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Nama Barang *</label>
                  <input
                    id="form_prod_name"
                    type="text"
                    required
                    placeholder="Contoh: Kopi Bubuk Toraja 250gr"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Kategori *</label>
                  <select
                    id="form_prod_category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Cemilan">Cemilan</option>
                    <option value="Bahan Pokok">Bahan Pokok</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>

                {/* Initial Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Jumlah Stok *</label>
                  <input
                    id="form_prod_stock"
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Harga Beli *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                      {shopSettings.currencySymbol}
                    </span>
                    <input
                      id="form_prod_purchase"
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={formData.purchasePrice || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Harga Jual *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                      {shopSettings.currencySymbol}
                    </span>
                    <input
                      id="form_prod_price"
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>

                {/* Min stock limit warning threshold */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 tracking-wider">Limit Peringatan Minimum</label>
                  <input
                    id="form_prod_min"
                    type="number"
                    min="1"
                    placeholder="5"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 3 }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                    Notifikasi menyala jika stok berada di bawah batas ini.
                  </span>
                </div>

                {/* Calculated Profit helper */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="text-slate-800 uppercase font-bold tracking-wide">Estimasi Margin Profit</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Selisih harga jual dan beli</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-emerald-700">
                      {formatPrice(Math.max(0, formData.price - formData.purchasePrice))}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      Profit: {formData.purchasePrice > 0 ? Math.round(((formData.price - formData.purchasePrice) / formData.purchasePrice) * 100) : 0}%
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit Controls */}
              <div className="border-t border-slate-150 pt-5 mt-6 flex justify-end gap-2.5">
                <button
                  id="cancel_product_form"
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  id="submit_product_form"
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
