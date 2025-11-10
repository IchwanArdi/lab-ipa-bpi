import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get loans that are due soon (within 3 days) or overdue
    // Filter per role: GURU hanya lihat miliknya, ADMIN lihat semua
    let remindersQuery = `
      SELECT 
        l.*,
        u.id as user_id, u.name as user_name,
        i.id as item_id, i.name as item_name, i.code as item_code
      FROM Loan l
      INNER JOIN User u ON l.userId = u.id
      INNER JOIN Item i ON l.itemId = i.id
      WHERE l.status IN ('DISETUJUI', 'DIPINJAM')
        AND l.returnDate IS NOT NULL
        AND DATE(l.returnDate) <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    `;

    // Filter untuk GURU
    if (session.user.role === 'GURU') {
      remindersQuery += ' AND l.userId = ?';
    }

    remindersQuery += ' ORDER BY l.returnDate ASC';

    const reminders = await query<any[]>(remindersQuery, session.user.role === 'GURU' ? [session.user.id] : []);

    const formattedReminders = reminders
      .map((row: any) => {
        if (!row.returnDate) {
          return null;
        }

        const returnDate = new Date(row.returnDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validate dates
        if (isNaN(returnDate.getTime())) {
          return null;
        }

        const daysDiff = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilDue = isNaN(daysDiff) ? 0 : daysDiff;
        const isOverdue = daysUntilDue < 0;
        const daysOverdue = isOverdue ? Math.abs(daysUntilDue) : 0;

        return {
          id: row.id,
          loanId: row.id,
          userId: row.userId,
          itemId: row.itemId,
          itemName: row.item_name || '',
          itemCode: row.item_code || '',
          userName: row.user_name || '',
          returnDate: row.returnDate,
          borrowDate: row.borrowDate,
          quantity: Number(row.quantity) || 0,
          status: row.status || '',
          isOverdue,
          daysUntilDue,
          daysOverdue,
        };
      })
      .filter((r: any) => r !== null);

    return NextResponse.json(formattedReminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Gagal mengambil reminder' }, { status: 500 });
  }
}
