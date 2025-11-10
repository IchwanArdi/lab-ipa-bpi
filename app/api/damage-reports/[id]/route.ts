import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { DamageReportStatus } from '@/types/database';
import { z } from 'zod';

const updateReportSchema = z.object({
  status: z.enum(['PENDING', 'SELESAI']),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateReportSchema.parse(body);

    await query('UPDATE DamageReport SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [validatedData.status as DamageReportStatus, id]);

    // Get updated report with relations
    const reports = await query<any[]>(
      `SELECT 
        d.id, d.userId, d.itemId, d.description as report_description, d.photoUrl, d.status, d.createdAt, d.updatedAt,
        u.id as user_id, u.name as user_name, u.username as user_username,
        i.id as item_id, i.code as item_code, i.name as item_name, i.category as item_category, 
        i.stock as item_stock, i.\`condition\` as item_condition, i.description as item_description,
        i.createdAt as item_createdAt, i.updatedAt as item_updatedAt
      FROM DamageReport d
      INNER JOIN User u ON d.userId = u.id
      INNER JOIN Item i ON d.itemId = i.id
      WHERE d.id = ?`,
      [id]
    );

    const row = reports[0];
    const report = {
      id: row.id,
      userId: row.userId,
      itemId: row.itemId,
      description: row.report_description,
      photoUrl: row.photoUrl,
      status: row.status,
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
    };

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate laporan' }, { status: 500 });
  }
}
