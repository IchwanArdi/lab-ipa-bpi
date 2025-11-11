'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { SkeletonTable } from '@/components/Skeleton';
import { DamageReport, DamageReportStatus, Item } from '@/types/database';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useDialog } from '@/components/DialogContext';
import { Eye, CheckCircle, X } from 'lucide-react';

type DamageReportWithRelations = DamageReport & {
  user: { id: string; name: string; username: string };
  item: Item;
};

export default function BarangRusakPage() {
  const { data: session } = useSession();
  const { showAlert, showConfirm } = useDialog();
  const [reports, setReports] = useState<DamageReportWithRelations[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DamageReportWithRelations | null>(null);
  const [formData, setFormData] = useState({
    itemId: '',
    description: '',
    photo: null as File | null,
  });

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchReports();
    fetchItems();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/damage-reports');
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('itemId', formData.itemId);
      formDataToSend.append('description', formData.description);
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      const res = await fetch('/api/damage-reports', {
        method: 'POST',
        body: formDataToSend,
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({
          itemId: '',
          description: '',
          photo: null,
        });
        fetchReports();
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal membuat laporan', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const handleStatusChange = async (report: DamageReportWithRelations, newStatus: DamageReportStatus) => {
    try {
      const res = await fetch(`/api/damage-reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchReports();
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
          accessor: (row: DamageReportWithRelations) => format(new Date(row.createdAt), 'dd MMM yyyy', { locale: id }),
        },
        {
          header: 'Pelapor',
          accessor: (row: DamageReportWithRelations) => row.user.name,
        },
        {
          header: 'Alat',
          accessor: (row: DamageReportWithRelations) => row.item.name,
        },
        {
          header: 'Deskripsi',
          accessor: (row: DamageReportWithRelations) => <span className="max-w-xs truncate block">{row.description}</span>,
        },
        {
          header: 'Foto',
          accessor: (row: DamageReportWithRelations) =>
            row.photoUrl ? (
              <div className="relative">
                <Image src={row.photoUrl} alt="Foto kerusakan" width={48} height={48} className="w-12 h-12 object-cover rounded border border-gray-200" unoptimized={row.photoUrl.startsWith('http')} />
              </div>
            ) : (
              <span className="text-gray-400 text-xs">Tidak ada foto</span>
            ),
        },
        {
          header: 'Status',
          accessor: (row: DamageReportWithRelations) => <StatusBadge status={row.status} />,
        },
      ]
    : [
        {
          header: 'Tanggal',
          accessor: (row: DamageReportWithRelations) => format(new Date(row.createdAt), 'dd MMM yyyy', { locale: id }),
        },
        {
          header: 'Alat',
          accessor: (row: DamageReportWithRelations) => row.item.name,
        },
        {
          header: 'Deskripsi',
          accessor: (row: DamageReportWithRelations) => <span className="max-w-xs truncate block">{row.description}</span>,
        },
        {
          header: 'Foto',
          accessor: (row: DamageReportWithRelations) =>
            row.photoUrl ? (
              <div className="relative">
                <Image src={row.photoUrl} alt="Foto kerusakan" width={48} height={48} className="w-12 h-12 object-cover rounded border border-gray-200" unoptimized={row.photoUrl.startsWith('http')} />
              </div>
            ) : (
              <span className="text-gray-400 text-xs">Tidak ada foto</span>
            ),
        },
        {
          header: 'Status',
          accessor: (row: DamageReportWithRelations) => <StatusBadge status={row.status} />,
        },
      ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-44 bg-gray-200 rounded-lg animate-pulse mb-2" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">{isAdmin ? 'Kelola Laporan Kerusakan' : 'Laporan Saya'}</h1>
          <p className="text-sm sm:text-base text-gray-600">{isAdmin ? 'Kelola semua laporan barang rusak/pecah' : 'Lihat dan kelola laporan kerusakan Anda'}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Export Excel hanya untuk ADMIN */}
          {isAdmin && (
            <Button
              onClick={() => {
                window.open('/api/export/damage-reports', '_blank');
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
          {/* Hanya GURU yang bisa melaporkan kerusakan, ADMIN hanya mengelola */}
          {!isAdmin && (
            <Button onClick={() => setShowModal(true)} size="sm" className="w-full sm:w-auto">
              Laporkan Kerusakan
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
                {isAdmin && <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.length === 0 ? (
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
                reports.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    {columns.map((column, index) => (
                      <td key={index} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        <div className="whitespace-nowrap">{typeof column.accessor === 'function' ? column.accessor(row) : String(row[column.accessor as keyof DamageReportWithRelations])}</div>
                      </td>
                    ))}
                    {isAdmin && (
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex gap-1 sm:gap-2">
                          <button
                            onClick={() => {
                              setSelectedReport(row);
                              setShowDetailModal(true);
                            }}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm flex items-center gap-1"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Detail</span>
                          </button>
                          {row.status === 'PENDING' && (
                            <button
                              onClick={async () => {
                                const confirmed = await showConfirm('Tandai laporan sebagai selesai?');
                                if (confirmed) {
                                  await handleStatusChange(row, 'SELESAI');
                                  await showAlert('Laporan berhasil ditandai sebagai selesai', { type: 'success' });
                                }
                              }}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm flex items-center gap-1"
                              title="Tandai Selesai"
                            >
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Selesai</span>
                            </button>
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Laporkan Kerusakan</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    itemId: '',
                    description: '',
                    photo: null,
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
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi Kerusakan</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Foto (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      photo: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                />
              </div>
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
                      description: '',
                      photo: null,
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

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-2xl border border-gray-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Detail Laporan Kerusakan</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedReport(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Laporan</label>
                  <p className="text-sm text-gray-900">{format(new Date(selectedReport.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <StatusBadge status={selectedReport.status} />
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pelapor</label>
                    <p className="text-sm text-gray-900">{selectedReport.user.name}</p>
                    <p className="text-xs text-gray-500">@{selectedReport.user.username}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Alat</label>
                  <p className="text-sm text-gray-900">{selectedReport.item.name}</p>
                  <p className="text-xs text-gray-500">Kode: {selectedReport.item.code}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Kerusakan</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedReport.description}</p>
              </div>

              {selectedReport.photoUrl && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Foto Kerusakan</label>
                  <div className="relative">
                    <Image src={selectedReport.photoUrl} alt="Foto kerusakan" width={512} height={512} className="w-full max-w-md rounded-lg border border-gray-200" unoptimized={selectedReport.photoUrl.startsWith('http')} />
                  </div>
                </div>
              )}

              {isAdmin && selectedReport.status === 'PENDING' && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={async () => {
                      const confirmed = await showConfirm('Tandai laporan sebagai selesai?');
                      if (confirmed) {
                        await handleStatusChange(selectedReport, 'SELESAI');
                        await showAlert('Laporan berhasil ditandai sebagai selesai', { type: 'success' });
                        setShowDetailModal(false);
                        setSelectedReport(null);
                        fetchReports();
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tandai sebagai Selesai
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
