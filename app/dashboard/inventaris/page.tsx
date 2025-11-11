'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { SkeletonTable } from '@/components/Skeleton';
import { Item, ItemCondition } from '@/types/database';
import { useDialog } from '@/components/DialogContext';

export default function InventarisPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [borrowingItem, setBorrowingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    stock: 0,
    condition: 'BAIK' as ItemCondition,
    description: '',
  });
  const [borrowData, setBorrowData] = useState({
    quantity: 1,
    borrowDate: '',
    returnDate: '',
    notes: '',
  });

  const isAdmin = session?.user?.role === 'ADMIN';
  const isGuru = session?.user?.role === 'GURU';

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      // Untuk GURU, default filter hanya alat tersedia (tapi tetap bisa lihat semua)
      if (isGuru) {
        // Tampilkan semua, tapi highlight yang tersedia
        setItems(data);
      } else {
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';

      // Prepare data - ensure all fields are valid
      const submitData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        stock: Number(formData.stock) || 0,
        condition: formData.condition,
        description: formData.description?.trim() || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
          code: '',
          name: '',
          category: '',
          stock: 0,
          condition: 'BAIK',
          description: '',
        });
        fetchItems();
      } else {
        const errorData = await res.json();
        let errorMessage = errorData.error || 'Gagal menyimpan data';

        if (errorData.details && Array.isArray(errorData.details)) {
          const detailMessages = errorData.details.map((d: any) => `- ${d.field}: ${d.message}`).join('\n');
          errorMessage = `${errorMessage}\n\nDetail:\n${detailMessages}`;
        } else if (errorData.details) {
          errorMessage = `${errorMessage}\n\nDetail: ${JSON.stringify(errorData.details, null, 2)}`;
        }

        await showAlert(errorMessage, { type: 'error' });
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      await showAlert('Terjadi kesalahan: ' + (error instanceof Error ? error.message : 'Unknown error'), { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      stock: item.stock,
      condition: item.condition,
      description: item.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (item: Item) => {
    const confirmed = await showConfirm(`Yakin ingin menghapus ${item.name}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchItems();
      } else {
        await showAlert('Gagal menghapus data', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const handleBorrow = async (item: Item) => {
    // Cek apakah stok tersedia dan kondisi baik
    if (item.stock <= 0) {
      await showAlert('Stok alat tidak tersedia', { type: 'warning' });
      return;
    }
    if (item.condition !== 'BAIK') {
      await showAlert('Alat dalam kondisi rusak, tidak dapat dipinjam', { type: 'warning' });
      return;
    }
    setBorrowingItem(item);
    setBorrowData({
      quantity: 1,
      borrowDate: '',
      returnDate: '',
      notes: '',
    });
    setShowBorrowModal(true);
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowingItem) return;

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: borrowingItem.id,
          quantity: borrowData.quantity,
          borrowDate: borrowData.borrowDate,
          returnDate: borrowData.returnDate || undefined,
          notes: borrowData.notes || undefined,
        }),
      });

      if (res.ok) {
        await showAlert('Peminjaman berhasil dibuat! Menunggu persetujuan admin.', { type: 'success' });
        setShowBorrowModal(false);
        setBorrowingItem(null);
        setBorrowData({
          quantity: 1,
          borrowDate: '',
          returnDate: '',
          notes: '',
        });
        // Redirect ke halaman peminjaman untuk melihat status
        router.push('/dashboard/peminjaman');
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal membuat peminjaman', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const columns = [
    { header: 'Kode', accessor: 'code' as const },
    { header: 'Nama', accessor: 'name' as const },
    { header: 'Kategori', accessor: 'category' as const },
    { header: 'Stok', accessor: 'stock' as const },
    {
      header: 'Kondisi',
      accessor: (row: Item) => <span className={`px-2 py-1 rounded text-xs font-medium ${row.condition === 'BAIK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.condition}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <Card>
          <SkeletonTable rows={6} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">{isAdmin ? 'Inventaris Alat' : 'Daftar Alat'}</h1>
          <p className="text-sm sm:text-base text-gray-600">{isAdmin ? 'Kelola daftar alat laboratorium' : 'Lihat dan pinjam alat laboratorium yang tersedia'}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Export Excel hanya untuk ADMIN */}
          {isAdmin && (
            <Button
              onClick={() => {
                window.open('/api/export/items', '_blank');
              }}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => setShowModal(true)} size="sm" className="w-full sm:w-auto">
              Tambah Alat
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {column.header}
                  </th>
                ))}
                {(isAdmin || isGuru) && <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (isAdmin || isGuru ? 1 : 0)} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">Tidak ada data</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    {columns.map((column, index) => (
                      <td key={index} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        <div className="whitespace-nowrap">{typeof column.accessor === 'function' ? column.accessor(row) : String(row[column.accessor])}</div>
                      </td>
                    ))}
                    {(isAdmin || isGuru) && (
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex gap-1 sm:gap-2">
                          {isAdmin && (
                            <>
                              <button onClick={() => handleEdit(row)} className="px-2 sm:px-3 py-1 sm:py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm">
                                Edit
                              </button>
                              <button onClick={() => handleDelete(row)} className="px-2 sm:px-3 py-1 sm:py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm">
                                Hapus
                              </button>
                            </>
                          )}
                          {isGuru && (
                            <>
                              {row.stock > 0 && row.condition === 'BAIK' ? (
                                <button onClick={() => handleBorrow(row)} className="px-2 sm:px-3 py-1 sm:py-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm">
                                  Pinjam
                                </button>
                              ) : (
                                <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-gray-400 text-xs sm:text-sm" title={row.stock === 0 ? 'Stok habis' : 'Alat rusak'}>
                                  {row.stock === 0 ? 'Stok Habis' : 'Rusak'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md border border-gray-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{editingItem ? 'Edit Alat' : 'Tambah Alat'}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  setFormData({
                    code: '',
                    name: '',
                    category: '',
                    stock: 0,
                    condition: 'BAIK',
                    description: '',
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <Input label="Kode Alat" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingItem} />
              <Input label="Nama Alat" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Kategori" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
              <Input
                label="Stok"
                type="number"
                value={isNaN(formData.stock) ? '0' : formData.stock}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseInt(value, 10);
                  setFormData({ ...formData, stock: isNaN(numValue) ? 0 : numValue });
                }}
                required
                min={0}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kondisi</label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition: e.target.value as ItemCondition,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                >
                  <option value="BAIK">Baik</option>
                  <option value="RUSAK">Rusak</option>
                </select>
              </div>
              <Input label="Deskripsi (opsional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" isLoading={submitting}>
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setFormData({
                      code: '',
                      name: '',
                      category: '',
                      stock: 0,
                      condition: 'BAIK',
                      description: '',
                    });
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pinjam untuk GURU */}
      {showBorrowModal && borrowingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md border border-gray-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pinjam Alat</h2>
              <button
                onClick={() => {
                  setShowBorrowModal(false);
                  setBorrowingItem(null);
                  setBorrowData({
                    quantity: 1,
                    borrowDate: '',
                    returnDate: '',
                    notes: '',
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700">Alat yang dipinjam:</p>
              <p className="text-lg font-bold text-blue-700">{borrowingItem.name}</p>
              <p className="text-xs text-gray-600">Stok tersedia: {borrowingItem.stock}</p>
            </div>
            <form onSubmit={handleBorrowSubmit} className="space-y-3 sm:space-y-4">
              <Input
                label="Jumlah"
                type="number"
                value={isNaN(borrowData.quantity) ? '1' : borrowData.quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 1 : parseInt(value, 10);
                  setBorrowData({
                    ...borrowData,
                    quantity: isNaN(numValue) ? 1 : Math.max(1, Math.min(numValue, borrowingItem.stock)),
                  });
                }}
                required
                min={1}
                max={borrowingItem.stock}
              />
              <Input label="Tanggal Pinjam" type="date" value={borrowData.borrowDate} onChange={(e) => setBorrowData({ ...borrowData, borrowDate: e.target.value })} required />
              <Input label="Tanggal Kembali (opsional)" type="date" value={borrowData.returnDate} onChange={(e) => setBorrowData({ ...borrowData, returnDate: e.target.value })} />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan (opsional)</label>
                <textarea
                  value={borrowData.notes}
                  onChange={(e) => setBorrowData({ ...borrowData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  placeholder="Contoh: Untuk praktikum kelas 7A"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Ajukan Peminjaman
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowBorrowModal(false);
                    setBorrowingItem(null);
                    setBorrowData({
                      quantity: 1,
                      borrowDate: '',
                      returnDate: '',
                      notes: '',
                    });
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
