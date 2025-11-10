import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { notifyLoanCreated } from '@/lib/notifications';
import { z } from 'zod';

const loanSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
  borrowDate: z.string(),
  returnDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let sql =
      'SELECT l.*, u.id as user_id, u.name as user_name, u.username as user_username, i.id as item_id, i.code as item_code, i.name as item_name, i.category as item_category, i.stock as item_stock, i.`condition` as item_condition, i.description as item_description, i.createdAt as item_createdAt, i.updatedAt as item_updatedAt FROM Loan l INNER JOIN User u ON l.userId = u.id INNER JOIN Item i ON l.itemId = i.id WHERE 1=1';
    const params: any[] = [];

    if (session.user.role === 'GURU') {
      sql += ' AND l.userId = ?';
      params.push(session.user.id);
    }
    if (status) {
      sql += ' AND l.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY l.createdAt DESC';

    const loans = await query<any[]>(sql, params);

    // Transform results to match expected format
    const formattedLoans = loans.map((row: any) => ({
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

    return NextResponse.json(formattedLoans);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya GURU yang bisa membuat peminjaman, ADMIN tidak bisa meminjam
    if (session.user.role !== 'GURU') {
      return NextResponse.json({ error: 'Hanya guru yang dapat meminjam alat' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = loanSchema.parse(body);

    // Check item stock
    const items = await query<any[]>('SELECT * FROM Item WHERE id = ?', [validatedData.itemId]);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    const item = items[0];

    if (item.stock < validatedData.quantity) {
      return NextResponse.json({ error: 'Stok tidak mencukupi' }, { status: 400 });
    }

    const id = generateId();
    await query('INSERT INTO Loan (id, userId, itemId, quantity, borrowDate, returnDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      id,
      session.user.id,
      validatedData.itemId,
      validatedData.quantity,
      validatedData.borrowDate,
      validatedData.returnDate || null,
      validatedData.notes || null,
    ]);

    // Get created loan with relations
    const loans = await query<any[]>(
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

    const row = loans[0];
    const loan = {
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

    // Notify admins about new loan request
    try {
      const admins = await query<any[]>('SELECT id FROM User WHERE role = ?', ['ADMIN']);
      const adminIds = admins.map((admin: any) => admin.id);
      await notifyLoanCreated(id, session.user.id, row.name, adminIds);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat peminjaman' }, { status: 500 });
  }
}
