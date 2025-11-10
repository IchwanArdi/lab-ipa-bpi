'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { SkeletonTable } from '@/components/Skeleton';
import { Teacher } from '@/types/database';
import { useDialog } from '@/components/DialogContext';

export default function GuruPage() {
  const { data: session } = useSession();
  const { showAlert, showConfirm } = useDialog();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
  });

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingTeacher(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
        });
        fetchTeachers();
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal menyimpan data', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email || '',
      phone: teacher.phone || '',
      subject: teacher.subject,
    });
    setShowModal(true);
  };

  const handleDelete = async (teacher: Teacher) => {
    const confirmed = await showConfirm(`Yakin ingin menghapus ${teacher.name}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTeachers();
      } else {
        await showAlert('Gagal menghapus data', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const columns = [
    { header: 'Nama', accessor: 'name' as const },
    { header: 'Email', accessor: (row: Teacher) => row.email || '-' },
    { header: 'Phone', accessor: (row: Teacher) => row.phone || '-' },
    { header: 'Mata Pelajaran', accessor: 'subject' as const },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mb-2" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Daftar Guru</h1>
          <p className="text-sm sm:text-base text-gray-600">Daftar guru IPA</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowModal(true)} size="sm" className="w-full sm:w-auto">
            Tambah Guru
          </Button>
        )}
      </div>

      <Card>
        <DataTable columns={columns} data={teachers} onEdit={isAdmin ? handleEdit : undefined} onDelete={isAdmin ? handleDelete : undefined} />
      </Card>

      {/* Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md border border-gray-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{editingTeacher ? 'Edit Guru' : 'Tambah Guru'}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTeacher(null);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
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
              <Input label="Nama" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Email (opsional)" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <Input label="Phone (opsional)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <Input label="Mata Pelajaran" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTeacher(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      subject: '',
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
