'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { SkeletonTable } from '@/components/Skeleton';
import { User, UserRole } from '@/types/database';
import { useDialog } from '@/components/DialogContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type UserWithoutPassword = Omit<User, 'password'>;

export default function PenggunaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();
  const [users, setUsers] = useState<UserWithoutPassword[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, router]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithoutPassword | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'GURU' as UserRole,
    name: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const body: any = {
        username: formData.username,
        role: formData.role,
        name: formData.name,
      };

      // Only include password if it's provided (for new user or reset)
      if (!editingUser || formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          username: '',
          password: '',
          role: 'GURU',
          name: '',
        });
        fetchUsers();
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal menyimpan data', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const handleEdit = (user: UserWithoutPassword) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      name: user.name,
    });
    setShowModal(true);
  };

  const handleDelete = async (user: UserWithoutPassword) => {
    const confirmed = await showConfirm(`Yakin ingin menghapus ${user.name}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal menghapus data', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const handleResetPassword = (user: UserWithoutPassword) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '12345678',
      role: user.role,
      name: user.name,
    });
    setShowModal(true);
  };

  const columns = [
    {
      header: 'Username',
      accessor: (row: UserWithoutPassword) => <div className="font-medium text-gray-900">{row.username}</div>,
    },
    {
      header: 'Nama',
      accessor: (row: UserWithoutPassword) => <div className="font-medium text-gray-900">{row.name}</div>,
    },
    {
      header: 'Role',
      accessor: (row: UserWithoutPassword) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${row.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
          {row.role === 'ADMIN' ? 'Administrator' : 'Guru'}
        </span>
      ),
    },
    {
      header: 'Tanggal Dibuat',
      accessor: (row: UserWithoutPassword) => <div className="text-sm text-gray-600">{format(new Date(row.createdAt), 'dd MMM yyyy', { locale: id })}</div>,
    },
    {
      header: 'Terakhir Diupdate',
      accessor: (row: UserWithoutPassword) => <div className="text-sm text-gray-600">{format(new Date(row.updatedAt), 'dd MMM yyyy', { locale: id })}</div>,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-72 bg-gray-200 rounded-lg animate-pulse" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Manajemen Pengguna</h1>
          <p className="text-sm sm:text-base text-gray-600">Kelola akun pengguna sistem</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="w-full sm:w-auto">
          Tambah Pengguna
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={users} onEdit={handleEdit} onDelete={handleDelete} />
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md border border-gray-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  setFormData({
                    username: '',
                    password: '',
                    role: 'GURU',
                    name: '',
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
              <Input label="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingUser} />
              <Input
                label={editingUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                minLength={6}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                >
                  <option value="GURU">Guru</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <Input label="Nama" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({
                      username: '',
                      password: '',
                      role: 'GURU',
                      name: '',
                    });
                  }}
                >
                  Batal
                </Button>
              </div>
              {editingUser && (
                <Button type="button" variant="outline" onClick={() => handleResetPassword(editingUser)} className="w-full">
                  Reset Password ke Default
                </Button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
