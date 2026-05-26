import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const emptyForm = {
  name: '',
  sku: '',
  qrCode: '',
  category: '',
  price: 0,
  stock: 0,
  description: '',
  imageUrl: '',
  isActive: true
};

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const title = useMemo(() => (editingId ? 'Edit Product' : 'New Product'), [editingId]);

  async function loadProducts(search = query) {
    const [productResponse, statsResponse] = await Promise.all([
      api.get('/products', { params: { search, limit: 100 } }),
      api.get('/scans/stats')
    ]);
    setProducts(productResponse.data.items);
    setStats(statsResponse.data);
  }

  useEffect(() => {
    loadProducts('').catch((err) => setError(err.response?.data?.message || err.message));
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function submitProduct(event) {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock)
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save product');
    }
  }

  function editProduct(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      sku: product.sku,
      qrCode: product.qrCode,
      category: product.category,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      isActive: product.isActive
    });
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    await loadProducts();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <section className="glass rounded-lg p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-50">{title}</h1>
            <p className="text-sm text-slate-400">Create and maintain QR-linked inventory</p>
          </div>
          {editingId && (
            <button className="btn btn-secondary px-3 py-2" onClick={resetForm}>
              <X size={17} />
            </button>
          )}
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-red-200">{error}</div>}

        <form onSubmit={submitProduct} className="grid gap-4">
          <input className="field" placeholder="Product name" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
          <div className="grid gap-4 md:grid-cols-2">
            <input className="field" placeholder="SKU" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} required />
            <input className="field" placeholder="QR code value" value={form.qrCode} onChange={(e) => updateField('qrCode', e.target.value)} required />
          </div>
          <input className="field" placeholder="Category" value={form.category} onChange={(e) => updateField('category', e.target.value)} required />
          <div className="grid gap-4 md:grid-cols-2">
            <input className="field" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => updateField('price', e.target.value)} required />
            <input className="field" type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} required />
          </div>
          <input className="field" placeholder="Image URL" value={form.imageUrl} onChange={(e) => updateField('imageUrl', e.target.value)} />
          <textarea className="field min-h-24" placeholder="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-300">
            <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
            Active product
          </label>
          <button className="btn btn-primary">
            <Plus size={18} />
            {editingId ? 'Update Product' : 'Add Product'}
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Products', products.length],
            ['Matched Scans', stats?.matched ?? 0],
            ['Unknown Scans', stats?.unmatched ?? 0]
          ].map(([label, value]) => (
            <div key={label} className="glass rounded-lg p-4">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-1 text-3xl font-black text-slate-50">{value}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-lg p-5">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-slate-500" size={18} />
              <input className="field pl-10" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => loadProducts(query)}>
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">QR</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-slate-900 text-slate-200">
                    <td className="py-3 pr-4 font-semibold">{product.name}</td>
                    <td className="py-3 pr-4">{product.sku}</td>
                    <td className="max-w-[180px] truncate py-3 pr-4">{product.qrCode}</td>
                    <td className="py-3 pr-4">{Number(product.price).toFixed(2)}</td>
                    <td className="py-3 pr-4">{product.stock}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button className="btn btn-secondary px-3 py-2" onClick={() => editProduct(product)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-danger px-3 py-2" onClick={() => deleteProduct(product._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
