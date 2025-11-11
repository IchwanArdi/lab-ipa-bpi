import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Loan from '@/models/Loan';
import Item from '@/models/Item';
import DamageReport from '@/models/DamageReport';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const months = parseInt(searchParams.get('months') || '6');

    // Calculate date range
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Loan trends (last N months) - using aggregation
    const loanTrendsAgg = await Loan.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          count: { $sum: 1 },
          returned: {
            $sum: { $cond: [{ $eq: ['$status', 'DIKEMBALIKAN'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const loanTrends = loanTrendsAgg.map((item: any) => ({
      month: item._id,
      count: item.count || 0,
      returned: item.returned || 0,
    }));

    // Top borrowed items
    const topItemsAgg = await Loan.aggregate([
      {
        $match: {
          status: { $in: ['DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN'] },
        },
      },
      {
        $group: {
          _id: '$itemId',
          borrowCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $sort: { borrowCount: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'item',
        },
      },
      {
        $unwind: '$item',
      },
    ]);

    const topItems = topItemsAgg.map((item: any) => ({
      id: item._id,
      name: item.item.name || '',
      code: item.item.code || '',
      category: item.item.category || '',
      borrowCount: item.borrowCount || 0,
      totalQuantity: item.totalQuantity || 0,
    }));

    // Category statistics
    const categoryStatsAgg = await Loan.aggregate([
      {
        $match: {
          status: { $in: ['DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN'] },
        },
      },
      {
        $lookup: {
          from: 'items',
          localField: 'itemId',
          foreignField: '_id',
          as: 'item',
        },
      },
      {
        $unwind: '$item',
      },
      {
        $group: {
          _id: '$item.category',
          loanCount: { $sum: 1 },
          returnedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'DIKEMBALIKAN'] }, 1, 0] },
          },
        },
      },
    ]);

    const itemCountsByCategory = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          itemCount: { $sum: 1 },
        },
      },
    ]);

    const categoryMap = new Map();
    itemCountsByCategory.forEach((item: any) => {
      categoryMap.set(item._id, item.itemCount);
    });

    const categoryStats = categoryStatsAgg.map((item: any) => ({
      category: item._id || '',
      loanCount: item.loanCount || 0,
      itemCount: categoryMap.get(item._id) || 0,
      returnedCount: item.returnedCount || 0,
    }));

    // Status distribution
    const statusDistributionAgg = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusDistribution = statusDistributionAgg.map((item: any) => ({
      status: item._id || '',
      count: item.count || 0,
    }));

    // Monthly loan count (detailed)
    const monthlyLoansAgg = await Loan.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'MENUNGGU'] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'DISETUJUI'] }, 1, 0] },
          },
          borrowed: {
            $sum: { $cond: [{ $eq: ['$status', 'DIPINJAM'] }, 1, 0] },
          },
          returned: {
            $sum: { $cond: [{ $eq: ['$status', 'DIKEMBALIKAN'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const monthlyLoans = monthlyLoansAgg.map((item: any) => ({
      month: item._id || '',
      total: item.total || 0,
      pending: item.pending || 0,
      approved: item.approved || 0,
      borrowed: item.borrowed || 0,
      returned: item.returned || 0,
    }));

    // Damage reports by category
    const damageByCategoryAgg = await DamageReport.aggregate([
      {
        $lookup: {
          from: 'items',
          localField: 'itemId',
          foreignField: '_id',
          as: 'item',
        },
      },
      {
        $unwind: '$item',
      },
      {
        $group: {
          _id: '$item.category',
          reportCount: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { reportCount: -1 },
      },
    ]);

    const damageByCategory = damageByCategoryAgg.map((item: any) => ({
      category: item._id || '',
      reportCount: item.reportCount || 0,
      pendingCount: item.pendingCount || 0,
    }));

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
