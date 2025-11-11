'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types/database';
import { LayoutDashboard, Package, ClipboardList, AlertTriangle, FileText, Shield, Users, User } from 'lucide-react';

interface SidebarProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    profileImage?: string | null;
  };
}

// Menu untuk semua user
const commonMenuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventaris', href: '/dashboard/inventaris', icon: Package },
  { name: 'Tata Tertib', href: '/dashboard/tata-tertib', icon: FileText },
  { name: 'K3', href: '/dashboard/k3', icon: Shield },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

// Menu khusus GURU (untuk meminjam dan melaporkan)
const guruOnlyItems = [
  { name: 'Peminjaman Saya', href: '/dashboard/peminjaman', icon: ClipboardList },
  { name: 'Laporan Saya', href: '/dashboard/barang-rusak', icon: AlertTriangle },
];

// Menu khusus ADMIN (untuk mengelola)
const adminOnlyItems = [
  { name: 'Kelola Peminjaman', href: '/dashboard/peminjaman', icon: ClipboardList },
  { name: 'Kelola Laporan', href: '/dashboard/barang-rusak', icon: AlertTriangle },
  { name: 'Manajemen Pengguna', href: '/dashboard/pengguna', icon: Users },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <div
        id="sidebar-backdrop"
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden hidden transition-opacity duration-300"
        onClick={() => {
          const sidebar = document.getElementById('sidebar');
          const backdrop = document.getElementById('sidebar-backdrop');
          if (sidebar && backdrop) {
            sidebar.classList.add('-translate-x-full');
            backdrop.classList.add('hidden');
          }
        }}
      />

      {/* Sidebar */}
      <aside id="sidebar" className="fixed top-0 left-0 z-50 h-screen w-64 bg-white/95 backdrop-blur-lg border-r border-gray-200/50 shadow-xl transform -translate-x-full lg:translate-x-0 transition-all duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-gray-200/50 bg-linear-to-r from-blue-600 to-blue-700">
            <h1 className="text-xl font-bold text-white">Lab IPA BPI</h1>
            <p className="text-sm text-blue-100">Bandung</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {/* Menu untuk semua user */}
            {commonMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-[1.02]' : 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]'}
                  `}
                  onClick={() => {
                    const sidebar = document.getElementById('sidebar');
                    const backdrop = document.getElementById('sidebar-backdrop');
                    if (window.innerWidth < 1024 && sidebar && backdrop) {
                      sidebar.classList.add('-translate-x-full');
                      backdrop.classList.add('hidden');
                    }
                  }}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* Menu khusus GURU (untuk meminjam dan melaporkan) */}
            {user.role === 'GURU' && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktivitas Saya</p>
                {guruOnlyItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-[1.02]' : 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]'}
                      `}
                      onClick={() => {
                        const sidebar = document.getElementById('sidebar');
                        const backdrop = document.getElementById('sidebar-backdrop');
                        if (window.innerWidth < 1024 && sidebar && backdrop) {
                          sidebar.classList.add('-translate-x-full');
                          backdrop.classList.add('hidden');
                        }
                      }}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Menu khusus ADMIN (mengelola semua) */}
            {user.role === 'ADMIN' && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manajemen</p>
                {adminOnlyItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-[1.02]' : 'text-gray-700 hover:bg-gray-100 hover:scale-[1.01]'}
                      `}
                      onClick={() => {
                        const sidebar = document.getElementById('sidebar');
                        const backdrop = document.getElementById('sidebar-backdrop');
                        if (window.innerWidth < 1024 && sidebar && backdrop) {
                          sidebar.classList.add('-translate-x-full');
                          backdrop.classList.add('hidden');
                        }
                      }}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-md" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">{user.name.charAt(0).toUpperCase()}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role === 'ADMIN' ? 'Administrator' : 'Guru'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
