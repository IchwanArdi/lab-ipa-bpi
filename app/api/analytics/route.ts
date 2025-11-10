import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // month, year
    const months = parseInt(searchParams.get('months') || '6');

    // Loan trends (last N months)
    const loanTrendsRaw = await query<any[]>(
      `
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'DIKEMBALIKAN' THEN 1 ELSE 0 END) as returned
      FROM Loan
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `,
      [months]
    );
    const loanTrends = loanTrendsRaw.map((item: any) => ({
      month: item.month,
      count: Number(item.count) || 0,
      returned: Number(item.returned) || 0,
    }));

    // Top borrowed items
    const topItemsRaw = await query<any[]>(`
      SELECT 
        i.id,
        i.name,
        i.code,
        i.category,
        COUNT(l.id) as borrowCount,
        SUM(l.quantity) as totalQuantity
      FROM Item i
      INNER JOIN Loan l ON i.id = l.itemId
      WHERE l.status IN ('DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN')
      GROUP BY i.id, i.name, i.code, i.category
      ORDER BY borrowCount DESC
      LIMIT 10
    `);
    const topItems = topItemsRaw.map((item: any) => ({
      id: item.id,
      name: item.name || '',
      code: item.code || '',
      category: item.category || '',
      borrowCount: Number(item.borrowCount) || 0,
      totalQuantity: Number(item.totalQuantity) || 0,
    }));

    // Category statistics
    const categoryStatsRaw = await query<any[]>(`
      SELECT 
        i.category,
        COUNT(DISTINCT l.id) as loanCount,
        COUNT(DISTINCT i.id) as itemCount,
        SUM(CASE WHEN l.status = 'DIKEMBALIKAN' THEN 1 ELSE 0 END) as returnedCount
      FROM Item i
      LEFT JOIN Loan l ON i.id = l.itemId
      GROUP BY i.category
      ORDER BY loanCount DESC
    `);
    const categoryStats = categoryStatsRaw.map((item: any) => ({
      category: item.category || '',
      loanCount: Number(item.loanCount) || 0,
      itemCount: Number(item.itemCount) || 0,
      returnedCount: Number(item.returnedCount) || 0,
    }));

    // Status distribution
    const statusDistributionRaw = await query<any[]>(`
      SELECT 
        status,
        COUNT(*) as count
      FROM Loan
      GROUP BY status
    `);
    const statusDistribution = statusDistributionRaw.map((item: any) => ({
      status: item.status || '',
      count: Number(item.count) || 0,
    }));

    // Monthly loan count (detailed)
    const monthlyLoansRaw = await query<any[]>(
      `
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'MENUNGGU' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'DISETUJUI' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'DIPINJAM' THEN 1 ELSE 0 END) as borrowed,
        SUM(CASE WHEN status = 'DIKEMBALIKAN' THEN 1 ELSE 0 END) as returned
      FROM Loan
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `,
      [months]
    );
    const monthlyLoans = monthlyLoansRaw.map((item: any) => ({
      month: item.month || '',
      total: Number(item.total) || 0,
      pending: Number(item.pending) || 0,
      approved: Number(item.approved) || 0,
      borrowed: Number(item.borrowed) || 0,
      returned: Number(item.returned) || 0,
    }));

    // Damage reports by category
    const damageByCategory = await query<any[]>(`
      SELECT 
        i.category,
        COUNT(d.id) as reportCount,
        SUM(CASE WHEN d.status = 'PENDING' THEN 1 ELSE 0 END) as pendingCount
      FROM DamageReport d
      INNER JOIN Item i ON d.itemId = i.id
      GROUP BY i.category
      ORDER BY reportCount DESC
    `);

    return NextResponse.json({
      loanTrends,
      topItems,
      categoryStats,
      statusDistribution,
      monthlyLoans,
      damageByCategory,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Gagal mengambil data analytics' }, { status: 500 });
  }
}
