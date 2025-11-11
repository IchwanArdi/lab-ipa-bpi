'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SkeletonTable } from '@/components/Skeleton';
import { Loan, LoanStatus, Item } from '@/types/database';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useDialog } from '@/components/DialogContext';

type LoanWithRelations = Loan & {
  user: { id: string; name: string; username: string };
  item: Item;
};

export default function PeminjamanPage() {
  const { data: session } = useSession();
  const { showAlert, showConfirm } = useDialog();
  const [loans, setLoans] = useState<LoanWithRelations[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: 1,
    borrowDate: '',
    returnDate: '',
    notes: '',
  });

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchLoans();
    fetchItems();
  }, [filterStatus]);

  const fetchLoans = async () => {
    try {
      const url = filterStatus ? `/api/loans?status=${filterStatus}` : '/api/loans';
      const res = await fetch(url);
      const data = await res.json();
      setLoans(data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      // Tampilkan semua item, tapi yang bisa dipinjam akan di-highlight di dropdown
      // User tetap bisa melihat semua alat meskipun stok 0 atau rusak
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({
          itemId: '',
          quantity: 1,
          borrowDate: '',
          returnDate: '',
          notes: '',
        });
        fetchLoans();
        fetchItems();
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal membuat peminjaman', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const handleStatusChange = async (loan: LoanWithRelations, newStatus: LoanStatus) => {
    try {
      const res = await fetch(`/api/loans/${loan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchLoans();
        fetchItems();
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal mengupdate status', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  // Kolom berbeda untuk ADMIN vs GURU
  const columns = isAdmin
    ? [
        {
          header: 'Tanggal',
          accessor: (row: LoanWithRelations) => format(new Date(row.createdAt), 'dd MMM yyyy', { locale: id }),
        },
        {
          header: 'Peminjam',
          accessor: (row: LoanWithRelations) => row.user.name,
        },
        {
          header: 'Alat',
          accessor: (row: LoanWithRelations) => row.item.name,
        },
        {
          header: 'Jumlah',
          accessor: 'quantity' as const,
        },
        {
          header: 'Tanggal Pinjam',
          accessor: (row: LoanWithRelations) => format(new Date(row.borrowDate), 'dd MMM yyyy', { locale: id }),
        },
        {
          header: 'Status',
          accessor: (row: LoanWithRelations) => <StatusBadge status={row.status} />,
        },
      ]
    : [
        {
          header: 'Tanggal',
          accessor: (row: LoanWithRelations) => format(new Date(row.createdAt), 'dd MMM yyyy', { locale: id }),
        },
        {
          header: 'Alat',
          accessor: (row: LoanWithRelations) => row.item.name,
        },
        {
          header: 'Jumlah',
          accessor: 'quantity' as const,
        },
        {
          header: 'Tanggal Pinjam',
          accessor: (row: LoanWithRelations) => format(new Date(row.borrowDate), 'dd MMM yyyy', { locale: id }),
        },
        {
          header: 'Tanggal Kembali',
          accessor: (row: LoanWithRelations) => (row.returnDate ? format(new Date(row.returnDate), 'dd MMM yyyy', { locale: id }) : '-'),
        },
        {
          header: 'Status',
          accessor: (row: LoanWithRelations) => <StatusBadge status={row.status} />,
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">{isAdmin ? 'Kelola Peminjaman' : 'Peminjaman Saya'}</h1>
          <p className="text-sm sm:text-base text-gray-600">{isAdmin ? 'Kelola semua peminjaman alat laboratorium' : 'Lihat dan kelola peminjaman Anda'}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Export Excel hanya untuk ADMIN */}
          {isAdmin && (
            <Button
              onClick={() => {
                const url = filterStatus ? `/api/export/loans?status=${filterStatus}` : '/api/export/loans';
                window.open(url, '_blank');
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
          {/* Hanya GURU yang bisa meminjam, ADMIN hanya mengelola */}
          {!isAdmin && (
            <Button onClick={() => setShowModal(true)} size="sm" className="w-full sm:w-auto">
              Pinjam Alat
            </Button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Status</option>
          <option value="MENUNGGU">Menunggu</option>
          <option value="DISETUJUI">Disetujui</option>
          <option value="DIPINJAM">Dipinjam</option>
          <option value="DIKEMBALIKAN">Dikembalikan</option>
        </select>
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
                {isAdmin && <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (isAdmin ? 1 : 0)} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
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
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    {columns.map((column, index) => (
                      <td key={index} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        <div className="whitespace-nowrap">{typeof column.accessor === 'function' ? column.accessor(loan) : String(loan[column.accessor])}</div>
                      </td>
                    ))}
                    {isAdmin && (
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex gap-1 sm:gap-2">
                          {loan.status === 'MENUNGGU' && (
                            <button
                              onClick={async () => {
                                const confirmed = await showConfirm('Setujui peminjaman ini?');
                                if (confirmed) {
                                  handleStatusChange(loan, 'DISETUJUI');
                                }
                              }}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm"
                            >
                              Setujui
                            </button>
                          )}
                          {loan.status === 'DISETUJUI' && (
                            <button
                              onClick={async () => {
                                const confirmed = await showConfirm('Tandai sebagai dipinjam?');
                                if (confirmed) {
                                  handleStatusChange(loan, 'DIPINJAM');
                                }
                              }}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm"
                            >
                              Tandai Dipinjam
                            </button>
                          )}
                          {loan.status === 'DIPINJAM' && (
                            <button
                              onClick={async () => {
                                const confirmed = await showConfirm('Tandai sebagai dikembalikan?');
                                if (confirmed) {
                                  handleStatusChange(loan, 'DIKEMBALIKAN');
                                }
                              }}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm"
                            >
                              Tandai Dikembalikan
                            </button>
                          )}
                          {loan.status === 'DIKEMBALIKAN' && <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-gray-400 text-xs sm:text-sm">Selesai</span>}
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pinjam Alat</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    itemId: '',
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
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alat</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                >
                  <option value="">Pilih Alat</option>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stock === 0 || item.condition !== 'BAIK'}>
                        {item.name} (Stok: {item.stock}) {item.stock === 0 ? '- Stok Habis' : item.condition !== 'BAIK' ? '- Rusak' : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Tidak ada alat tersedia
                    </option>
                  )}
                </select>
                {items.length === 0 && <p className="mt-2 text-sm text-red-600">Tidak ada alat yang bisa dipinjam. Pastikan ada alat dengan stok &gt; 0 dan kondisi BAIK.</p>}
              </div>
              <Input
                label="Jumlah"
                type="number"
                value={isNaN(formData.quantity) ? '1' : formData.quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 1 : parseInt(value, 10);
                  setFormData({
                    ...formData,
                    quantity: isNaN(numValue) ? 1 : Math.max(1, numValue),
                  });
                }}
                required
                min={1}
              />
              <Input label="Tanggal Pinjam" type="date" value={formData.borrowDate} onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })} required />
              <Input label="Tanggal Kembali (opsional)" type="date" value={formData.returnDate} onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })} />
              <Input label="Catatan (opsional)" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      itemId: '',
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
