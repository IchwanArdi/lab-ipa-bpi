import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { z } from 'zod';

const teacherSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  subject: z.string().min(1).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teachers = await query<any[]>('SELECT * FROM Teacher WHERE id = ?', [id]);

    if (!teachers || teachers.length === 0) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(teachers[0]);
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
    const validatedData = teacherSchema.parse(body);

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.name !== undefined) {
      updates.push('name = ?');
      values.push(validatedData.name);
    }
    if (validatedData.email !== undefined) {
      updates.push('email = ?');
      values.push(validatedData.email || null);
    }
    if (validatedData.phone !== undefined) {
      updates.push('phone = ?');
      values.push(validatedData.phone || null);
    }
    if (validatedData.subject !== undefined) {
      updates.push('subject = ?');
      values.push(validatedData.subject);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    values.push(id);
    await query(`UPDATE Teacher SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, values);

    const teachers = await query<any[]>('SELECT * FROM Teacher WHERE id = ?', [id]);

    return NextResponse.json(teachers[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate guru' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await query('DELETE FROM Teacher WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Guru berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus guru' }, { status: 500 });
  }
}
