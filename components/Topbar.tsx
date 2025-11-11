'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { UserRole } from '@/types/database';
import { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';

interface TopbarProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    profileImage?: string | null;
  };
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/inventaris': 'Inventaris Alat',
  '/dashboard/peminjaman': 'Peminjaman Alat',
  '/dashboard/barang-rusak': 'Barang Rusak',
  '/dashboard/tata-tertib': 'Tata Tertib',
  '/dashboard/k3': 'K3 / Keamanan',
  '/dashboard/pengguna': 'Manajemen Pengguna',
};

export default function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (sidebarOpen && sidebar && backdrop) {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    } else if (!sidebarOpen && sidebar && backdrop) {
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-30 shadow-sm">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-200 shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{pageTitles[pathname] || 'Dashboard'}</h2>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-0.5">Selamat datang kembali</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Avatar - Mobile: hanya avatar, Desktop: avatar + info */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user.profileImage ? (
                <Image src={user.profileImage} alt={user.name} width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white shadow-md shrink-0" />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role === 'ADMIN' ? 'Administrator' : 'Guru'}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button onClick={handleLogout} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95 whitespace-nowrap">
              <span className="hidden sm:inline">Keluar</span>
              <svg className="sm:hidden w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
