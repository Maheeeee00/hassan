import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, X, Save, Image } from 'lucide-react';
import { useApp } from '../context/useApp';

const categories = ['Clothing', 'Accessories', 'Home Decor', 'Gifts', 'Stationery'];

function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState(
    product || { name: '', category: categories[0], price: '', stock: '', description: '' }
  );
  const [imagePreview, setImagePreview] = useState(product?.image || null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setForm(f => ({ ...f, image: file }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    onSave({ ...form, price: Number(form.price), stock: Number(form.stock || 0), image: imagePreview });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="font-bold text-white">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Image Upload */}
          <div className="flex justify-center">
            <label className="cursor-pointer group">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#2a2a2a] group-hover:border-[#c9a84c] transition-colors flex items-center justify-center overflow-hidden bg-[#1a1a1a]">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <div className="text-center">
                    <Image size={24} className="text-gray-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">Add Photo</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Custom Embroidered Hoodie"
              required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Price (Rs.) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0"
                required
                min="0"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Stock Quantity</label>
            <input
              type="number"
              value={form.stock}
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
              placeholder="0"
              min="0"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Product description..."
              rows={3}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#2a2a2a] text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#c9a84c] text-black py-2.5 rounded-xl text-sm font-bold hover:bg-[#e8c96a] transition-colors flex items-center justify-center gap-2"
            >
              <Save size={15} />
              {product ? 'Update' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data) => {
    if (editProduct) {
      updateProduct(editProduct.id, data);
    } else {
      addProduct(data);
    }
    setModalOpen(false);
    setEditProduct(null);
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-[#111111] border border-[#2a2a2a] text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 transition-colors"
          />
        </div>
        <button
          onClick={() => { setEditProduct(null); setModalOpen(true); }}
          className="bg-[#c9a84c] text-black px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#e8c96a] transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Products count */}
      <p className="text-xs text-gray-500">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No products found</p>
          <p className="text-gray-600 text-sm mt-1">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div key={product.id} className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#c9a84c]/40 transition-colors">
              <div className="h-40 bg-[#1a1a1a] flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={40} className="text-gray-700" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-white text-sm leading-tight">{product.name}</h3>
                  <span className="text-xs bg-[#c9a84c]/10 text-[#c9a84c] px-2 py-0.5 rounded-full whitespace-nowrap border border-[#c9a84c]/20">
                    {product.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#c9a84c] font-bold">Rs. {product.price.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditProduct(product); setModalOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-[#c9a84c]/30 text-[#c9a84c] py-2 rounded-xl text-xs font-medium hover:bg-[#c9a84c]/10 transition-colors"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(product.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-red-900/40 text-red-400 py-2 rounded-xl text-xs font-medium hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <ProductModal
          product={editProduct}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-400 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-[#2a2a2a] text-gray-300 py-2.5 rounded-xl text-sm hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteProduct(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
