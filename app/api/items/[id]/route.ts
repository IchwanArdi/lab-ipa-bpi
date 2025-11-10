import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { z } from 'zod';

const itemSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  condition: z.enum(['BAIK', 'RUSAK']).optional(),
  description: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const items = await query<any[]>('SELECT * FROM Item WHERE id = ?', [id]);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(items[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = itemSchema.parse(body);

    // Check if code already exists (if code is being updated)
    if (validatedData.code) {
      const existingItems = await query<any[]>('SELECT * FROM Item WHERE code = ? AND id != ?', [validatedData.code, id]);

      if (existingItems && existingItems.length > 0) {
        return NextResponse.json({ error: 'Kode alat sudah ada' }, { status: 400 });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.code !== undefined) {
      updates.push('code = ?');
      values.push(validatedData.code);
    }
    if (validatedData.name !== undefined) {
      updates.push('name = ?');
      values.push(validatedData.name);
    }
    if (validatedData.category !== undefined) {
      updates.push('category = ?');
      values.push(validatedData.category);
    }
    if (validatedData.stock !== undefined) {
      updates.push('stock = ?');
      values.push(validatedData.stock);
    }
    if (validatedData.condition !== undefined) {
      updates.push('`condition` = ?');
      values.push(validatedData.condition);
    }
    if (validatedData.description !== undefined) {
      updates.push('description = ?');
      values.push(validatedData.description);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    values.push(id);
    await query(`UPDATE Item SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, values);

    const items = await query<any[]>('SELECT * FROM Item WHERE id = ?', [id]);

    return NextResponse.json(items[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate alat' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await query('DELETE FROM Item WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Alat berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus alat' }, { status: 500 });
  }
}
