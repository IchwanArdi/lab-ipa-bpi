import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Item from '@/models/Item';
import Loan from '@/models/Loan';
import DamageReport from '@/models/DamageReport';
import Card from '@/components/Card';
import RemindersList from '@/components/RemindersList';
import AnalyticsChartsWrapper from '@/components/AnalyticsChartsWrapper';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Package, ClipboardList, AlertTriangle, CheckCircle } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  await connectDB();

  // Query berbeda untuk ADMIN vs GURU
  const totalItems = await Item.countDocuments();

  const activeLoansQuery: any = {
    status: { $in: ['MENUNGGU', 'DISETUJUI', 'DIPINJAM'] },
  };
  if (userRole === 'GURU') {
    activeLoansQuery.userId = userId;
  }
  const activeLoans = await Loan.countDocuments(activeLoansQuery);

  const pendingReportsQuery: any = {
    status: 'PENDING',
  };
  if (userRole === 'GURU') {
    pendingReportsQuery.userId = userId;
  }
  const pendingReports = await DamageReport.countDocuments(pendingReportsQuery);

  // Recent loans query
  const recentLoansQuery: any = {};
  if (userRole === 'GURU') {
    recentLoansQuery.userId = userId;
  }
  const recentLoansData = await Loan.find(recentLoansQuery).populate('userId', 'name username').populate('itemId').sort({ createdAt: -1 }).limit(5);

  // Query tambahan untuk GURU
  let availableItemsCount = 0;
  if (userRole === 'GURU') {
    availableItemsCount = await Item.countDocuments({ stock: { $gt: 0 }, condition: 'BAIK' });
  }

  const recentLoans = recentLoansData.map((loan) => ({
    id: loan._id.toString(),
    userId: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any)._id.toString() : loan.userId.toString(),
    itemId: typeof loan.itemId === 'object' && loan.itemId ? (loan.itemId as any)._id.toString() : loan.itemId.toString(),
    quantity: loan.quantity,
    status: loan.status,
    borrowDate: loan.borrowDate,
    returnDate: loan.returnDate,
    notes: loan.notes,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    user: {
      id: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any)._id.toString() : loan.userId.toString(),
      name: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any).name : '',
      username: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any).username : '',
    },
    item:
      typeof loan.itemId === 'object' && loan.itemId
        ? {
            id: (loan.itemId as any)._id.toString(),
            code: (loan.itemId as any).code,
            name: (loan.itemId as any).name,
            category: (loan.itemId as any).category,
            stock: (loan.itemId as any).stock,
            condition: (loan.itemId as any).condition,
            description: (loan.itemId as any).description,
            createdAt: (loan.itemId as any).createdAt,
            updatedAt: (loan.itemId as any).updatedAt,
          }
        : null,
  }));

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Dashboard {userRole === 'ADMIN' ? 'Administrator' : 'Guru'}</h1>
        <p className="text-sm sm:text-base text-gray-600">{userRole === 'ADMIN' ? 'Ringkasan informasi laboratorium IPA' : 'Ringkasan peminjaman dan aktivitas Anda'}</p>
      </div>

      {/* Stats Cards - Berbeda untuk ADMIN vs GURU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {userRole === 'ADMIN' ? (
          <>
            {/* ADMIN: Total Alat */}
            <Card hover className="bg-linear-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Alat</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{totalItems}</p>
                  <p className="text-xs text-gray-500 mt-1">Semua alat di inventaris</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shrink-0">
                  <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </Card>

            {/* ADMIN: Peminjaman Aktif (Semua) */}
            <Card hover className="bg-linear-to-br from-green-50 to-green-100/50 border-green-200">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Peminjaman Aktif</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{activeLoans}</p>
                  <p className="text-xs text-gray-500 mt-1">Semua peminjaman aktif</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-linear-to-br from-green-500 to-green-600 shadow-lg shrink-0">
                  <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </Card>

            {/* ADMIN: Laporan Pending */}
            <Card hover className="bg-linear-to-br from-yellow-50 to-yellow-100/50 border-yellow-200 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Laporan Pending</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">{pendingReports}</p>
                  <p className="text-xs text-gray-500 mt-1">Menunggu review</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-linear-to-br from-yellow-500 to-yellow-600 shadow-lg shrink-0">
                  <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* GURU: Alat Tersedia */}
            <Card hover className="bg-linear-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Alat Tersedia</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{availableItemsCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Siap untuk dipinjam</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shrink-0">
                  <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </Card>

            {/* GURU: Peminjaman Saya */}
            <Card hover className="bg-linear-to-br from-green-50 to-green-100/50 border-green-200">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Peminjaman Saya</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{activeLoans}</p>
                  <p className="text-xs text-gray-500 mt-1">Peminjaman aktif</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-linear-to-br from-green-500 to-green-600 shadow-lg shrink-0">
                  <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </Card>

            {/* GURU: Laporan Saya */}
            <Card hover className="bg-linear-to-br from-yellow-50 to-yellow-100/50 border-yellow-200 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Laporan Saya</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">{pendingReports}</p>
                  <p className="text-xs text-gray-500 mt-1">Menunggu review</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-linear-to-br from-yellow-500 to-yellow-600 shadow-lg shrink-0">
                  <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Reminders - Filter per role */}
      <RemindersList />

      {/* Analytics Charts - Hanya untuk ADMIN */}
      {userRole === 'ADMIN' && <AnalyticsChartsWrapper />}

      {/* Recent Activities - Berbeda untuk ADMIN vs GURU */}
      <Card title={userRole === 'ADMIN' ? 'Aktivitas Terbaru' : 'Peminjaman Terbaru Saya'} hover>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tanggal</th>
                {userRole === 'ADMIN' && <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Peminjam</th>}
                <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Alat</th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Jumlah</th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentLoans.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 5 : 4} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Tidak ada aktivitas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {format(new Date(loan.createdAt), 'dd MMM yyyy', {
                        locale: id,
                      })}
                    </td>
                    {userRole === 'ADMIN' && <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">{loan.user.name}</td>}
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">
                      <div className="truncate max-w-[150px] sm:max-w-none">{loan.item?.name}</div>
                      {userRole === 'ADMIN' && <div className="sm:hidden text-xs text-gray-500 mt-1">{loan.user.name}</div>}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden md:table-cell">{loan.quantity}</td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          loan.status === 'MENUNGGU'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : loan.status === 'DISETUJUI'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : loan.status === 'DIPINJAM'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {loan.status === 'MENUNGGU' ? 'Menunggu' : loan.status === 'DISETUJUI' ? 'Disetujui' : loan.status === 'DIPINJAM' ? 'Dipinjam' : 'Dikembalikan'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
