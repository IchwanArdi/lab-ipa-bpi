'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useDialog } from '@/components/DialogContext';
import { User, UserRole } from '@/types/database';
import { User as UserIcon, Lock, Save, LogOut, Calendar, Shield, Upload, X, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type UserWithoutPassword = Omit<User, 'password'>;

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserWithoutPassword | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    profileImage: '',
    gmail: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          password: '',
          profileImage: data.profileImage || '',
          gmail: data.gmail || '',
        });
        setImagePreview(data.profileImage || null);
      } else {
        await showAlert('Gagal mengambil data profile', { type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      await showAlert('Terjadi kesalahan', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      await showAlert('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP', { type: 'error' });
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      await showAlert('Ukuran file terlalu besar. Maksimal 2MB', { type: 'error' });
      return;
    }

    setUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadRes = await fetch('/api/profile/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        setFormData({ ...formData, profileImage: url });

        // Update profile immediately
        const updateRes = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileImage: url }),
        });

        if (updateRes.ok) {
          const updatedProfile = await updateRes.json();
          setProfile(updatedProfile);

          // Update session to reflect new profileImage
          await updateSession({
            ...session,
            user: {
              ...session?.user,
              profileImage: updatedProfile.profileImage,
            },
          });

          // Refresh to update navbar and sidebar
          router.refresh();

          await showAlert('Gambar profile berhasil diupload', { type: 'success' });
        }
      } else {
        const error = await uploadRes.json();
        await showAlert(error.error || 'Gagal mengupload gambar', { type: 'error' });
        setImagePreview(profile?.profileImage || null);
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan saat mengupload gambar', { type: 'error' });
      setImagePreview(profile?.profileImage || null);
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = async () => {
    const confirmed = await showConfirm('Yakin ingin menghapus gambar profile?');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: '' }),
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        setFormData({ ...formData, profileImage: '' });
        setImagePreview(null);

        // Update session to reflect removed profileImage
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            profileImage: null,
          },
        });

        // Refresh to update navbar and sidebar
        router.refresh();

        await showAlert('Gambar profile berhasil dihapus', { type: 'success' });
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal menghapus gambar', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const body: any = {
        name: formData.name,
      };

      // Only include password if it's provided
      if (formData.password && formData.password.trim() !== '') {
        body.password = formData.password;
      }

      // Include profileImage if it's been updated
      if (formData.profileImage !== undefined) {
        body.profileImage = formData.profileImage;
      }

      // Include gmail
      if (formData.gmail !== undefined) {
        body.gmail = formData.gmail;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        setFormData({ ...formData, password: '' });
        setIsEditing(false);

        // Update session
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: updatedProfile.name,
            profileImage: updatedProfile.profileImage || null,
          },
        });

        // Refresh to update navbar and sidebar
        router.refresh();

        await showAlert('Profile berhasil diperbarui', { type: 'success' });
      } else {
        const error = await res.json();
        await showAlert(error.error || 'Gagal memperbarui profile', { type: 'error' });
      }
    } catch (error) {
      await showAlert('Terjadi kesalahan', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        password: '',
        profileImage: profile.profileImage || '',
        gmail: profile.gmail || '',
      });
      setImagePreview(profile.profileImage || null);
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Yakin ingin keluar?');
    if (confirmed) {
      await signOut({ callbackUrl: '/login' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <Card>
          <div className="space-y-4">
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Gagal memuat data profile</p>
            <Button onClick={fetchProfile} className="mt-4" size="sm">
              Coba Lagi
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Profile Saya</h1>
        <p className="text-sm sm:text-base text-gray-600">Kelola informasi akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Info Card */}
        <div className="lg:col-span-1">
          <Card hover>
            <div className="text-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
                {imagePreview || profile.profileImage ? (
                  <img src={imagePreview || profile.profileImage || ''} alt={profile.name} className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-full h-full rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg">{profile.name.charAt(0).toUpperCase()}</div>
                )}
                {!isEditing && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                  </label>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{profile.name}</h2>
              <p className="text-sm text-gray-500 mb-4">@{profile.username}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>{profile.role === 'ADMIN' ? 'Administrator' : 'Guru'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Bergabung {format(new Date(profile.createdAt), 'dd MMM yyyy', { locale: id })}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Edit Form Card */}
        <div className="lg:col-span-2">
          <Card hover>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informasi Akun</h2>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} size="sm" variant="primary">
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <Input value={profile.username} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Username tidak dapat diubah</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <Input value={profile.role === 'ADMIN' ? 'Administrator' : 'Guru'} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Role tidak dapat diubah</p>
                </div>

                <Input label="Nama Lengkap" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Masukkan nama lengkap" />

                <Input label="Gmail" type="email" value={formData.gmail} onChange={(e) => setFormData({ ...formData, gmail: e.target.value })} placeholder="Masukkan alamat Gmail" />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gambar Profile</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      {imagePreview || profile.profileImage ? (
                        <div className="relative">
                          <img src={imagePreview || profile.profileImage || ''} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                          <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                          <UserIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer transition-colors border border-blue-200">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">{uploadingImage ? 'Mengupload...' : 'Pilih Gambar'}</span>
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, atau WEBP. Maksimal 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password Baru</label>
                  <div className="relative">
                    <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Kosongkan jika tidak ingin mengubah password" minLength={6} />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter. Kosongkan jika tidak ingin mengubah.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCancel} className="flex-1" disabled={saving}>
                    Batal
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">{profile.username}</div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${profile.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {profile.role === 'ADMIN' ? 'Administrator' : 'Guru'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">{profile.name}</div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gmail</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">{profile.gmail || '-'}</div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
                      <LogOut className="w-4 h-4 mr-2" />
                      Keluar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
