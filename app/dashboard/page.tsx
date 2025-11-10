import { query } from '@/lib/db';
import { auth } from '@/lib/auth';
import Card from '@/components/Card';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import RemindersList from '@/components/RemindersList';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Package, ClipboardList, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  // Query berbeda untuk ADMIN vs GURU
  let totalItemsQuery = 'SELECT COUNT(*) as count FROM Item';
  let activeLoansQuery = 'SELECT COUNT(*) as count FROM Loan WHERE status IN (?, ?, ?)';
  let activeLoansParams: any[] = ['MENUNGGU', 'DISETUJUI', 'DIPINJAM'];
  let pendingReportsQuery = 'SELECT COUNT(*) as count FROM DamageReport WHERE status = ?';
  let pendingReportsParams: any[] = ['PENDING'];
  let recentLoansQuery = `SELECT l.*, u.id as user_id, u.name as user_name, u.username as user_username, i.id as item_id, i.code as item_code, i.name as item_name, i.category as item_category, i.stock as item_stock, i.\`condition\` as item_condition, i.description as item_description, i.createdAt as item_createdAt, i.updatedAt as item_updatedAt FROM Loan l INNER JOIN User u ON l.userId = u.id INNER JOIN Item i ON l.itemId = i.id`;

  // Filter untuk GURU
  if (userRole === 'GURU') {
    // Perbaiki: query COUNT tidak pakai alias, langsung userId
    activeLoansQuery += ' AND userId = ?';
    activeLoansParams.push(userId);
    // Untuk GURU, query pending reports perlu join dengan User
    pendingReportsQuery = 'SELECT COUNT(*) as count FROM DamageReport WHERE status = ? AND userId = ?';
    pendingReportsParams = ['PENDING', userId];
    recentLoansQuery += ' WHERE l.userId = ?';
  }

  recentLoansQuery += ' ORDER BY l.createdAt DESC LIMIT 5';

  const [totalItemsResult, activeLoansResult, pendingReportsResult, recentLoansResult] = await Promise.all([
    query<any[]>(totalItemsQuery),
    query<any[]>(activeLoansQuery, activeLoansParams),
    query<any[]>(pendingReportsQuery, pendingReportsParams),
    query<any[]>(recentLoansQuery, userRole === 'GURU' ? [userId] : []),
  ]);

  const totalItems = totalItemsResult[0]?.count || 0;
  const activeLoans = activeLoansResult[0]?.count || 0;
  const pendingReports = pendingReportsResult[0]?.count || 0;

  // Query tambahan untuk GURU
  let availableItemsCount = 0;
  if (userRole === 'GURU') {
    const availableItemsResult = await query<any[]>('SELECT COUNT(*) as count FROM Item WHERE stock > 0 AND `condition` = ?', ['BAIK']);
    availableItemsCount = availableItemsResult[0]?.count || 0;
  }

  const recentLoans = recentLoansResult.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    itemId: row.itemId,
    quantity: row.quantity,
    status: row.status,
    borrowDate: row.borrowDate,
    returnDate: row.returnDate,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: {
      id: row.user_id,
      name: row.user_name,
      username: row.user_username,
    },
    item: {
      id: row.item_id,
      code: row.item_code,
      name: row.item_name,
      category: row.item_category,
      stock: row.item_stock,
      condition: row.item_condition,
      description: row.item_description,
      createdAt: row.item_createdAt,
      updatedAt: row.item_updatedAt,
    },
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
      {userRole === 'ADMIN' && <AnalyticsCharts />}

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
                      <div className="truncate max-w-[150px] sm:max-w-none">{loan.item.name}</div>
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
