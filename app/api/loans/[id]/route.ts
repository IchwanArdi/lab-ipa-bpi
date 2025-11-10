import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { notifyLoanStatusChanged } from '@/lib/notifications';
import { LoanStatus } from '@/types/database';
import { z } from 'zod';

const updateLoanSchema = z.object({
  status: z.enum(['MENUNGGU', 'DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN']).optional(),
  returnDate: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLoanSchema.parse(body);

    const loans = await query<any[]>('SELECT l.*, i.* FROM Loan l INNER JOIN Item i ON l.itemId = i.id WHERE l.id = ?', [id]);

    if (!loans || loans.length === 0) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    const loan = loans[0];

    // Only admin can change status
    if (validatedData.status && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If status changed to DIKEMBALIKAN, update item stock
    if (validatedData.status === 'DIKEMBALIKAN' && loan.status !== 'DIKEMBALIKAN') {
      await query('UPDATE Item SET stock = stock + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [loan.quantity, loan.itemId]);
    }

    // If status changed from MENUNGGU to DISETUJUI/DIPINJAM, decrease stock
    if (loan.status === 'MENUNGGU' && (validatedData.status === 'DISETUJUI' || validatedData.status === 'DIPINJAM')) {
      if (loan.stock < loan.quantity) {
        return NextResponse.json({ error: 'Stok tidak mencukupi' }, { status: 400 });
      }

      await query('UPDATE Item SET stock = stock - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [loan.quantity, loan.itemId]);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.status !== undefined) {
      updates.push('status = ?');
      values.push(validatedData.status as LoanStatus);
    }
    if (validatedData.returnDate !== undefined) {
      updates.push('returnDate = ?');
      values.push(validatedData.returnDate);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE Loan SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, values);
    }

    // Get updated loan with relations
    const updatedLoans = await query<any[]>(
      `SELECT 
        l.*,
        u.id as user_id, u.name as user_name, u.username as user_username,
        i.*
      FROM Loan l
      INNER JOIN User u ON l.userId = u.id
      INNER JOIN Item i ON l.itemId = i.id
      WHERE l.id = ?`,
      [id]
    );

    const row = updatedLoans[0];
    const updatedLoan = {
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
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        stock: row.stock,
        condition: row.condition,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    };

    // Notify user if status changed
    if (validatedData.status && validatedData.status !== loan.status) {
      try {
        await notifyLoanStatusChanged(id, row.userId, validatedData.status, row.name);
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json(updatedLoan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate peminjaman' }, { status: 500 });
  }
}
