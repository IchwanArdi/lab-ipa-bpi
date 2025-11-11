import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Loan from '@/models/Loan';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get loans that are due soon (within 3 days) or overdue
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const query: any = {
      status: { $in: ['DISETUJUI', 'DIPINJAM'] },
      returnDate: { $exists: true, $ne: null, $lte: threeDaysFromNow },
    };

    // Filter untuk GURU
    if (session.user.role === 'GURU') {
      query.userId = session.user.id;
    }

    const loans = await Loan.find(query).populate('userId', 'name').populate('itemId', 'name code').sort({ returnDate: 1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formattedReminders = loans
      .map((loan) => {
        if (!loan.returnDate) {
          return null;
        }

        const returnDate = new Date(loan.returnDate);
        const daysDiff = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilDue = isNaN(daysDiff) ? 0 : daysDiff;
        const isOverdue = daysUntilDue < 0;
        const daysOverdue = isOverdue ? Math.abs(daysUntilDue) : 0;

        return {
          id: loan._id.toString(),
          loanId: loan._id.toString(),
          userId: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any)._id.toString() : loan.userId.toString(),
          itemId: typeof loan.itemId === 'object' && loan.itemId ? (loan.itemId as any)._id.toString() : loan.itemId.toString(),
          itemName: typeof loan.itemId === 'object' && loan.itemId ? (loan.itemId as any).name : '',
          itemCode: typeof loan.itemId === 'object' && loan.itemId ? (loan.itemId as any).code : '',
          userName: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any).name : '',
          returnDate: loan.returnDate,
          borrowDate: loan.borrowDate,
          quantity: loan.quantity,
          status: loan.status,
          isOverdue,
          daysUntilDue,
          daysOverdue,
        };
      })
      .filter((r) => r !== null);

    return NextResponse.json(formattedReminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Gagal mengambil reminder' }, { status: 500 });
  }
}
