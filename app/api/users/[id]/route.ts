import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/database';

const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'GURU']).optional(),
  name: z.string().min(1).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if username already exists (if username is being updated)
    if (validatedData.username) {
      const existingUsers = await query<any[]>('SELECT * FROM User WHERE username = ? AND id != ?', [validatedData.username, id]);

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json({ error: 'Username sudah ada' }, { status: 400 });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.username !== undefined) {
      updates.push('username = ?');
      values.push(validatedData.username);
    }
    if (validatedData.password !== undefined) {
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (validatedData.role !== undefined) {
      updates.push('role = ?');
      values.push(validatedData.role as UserRole);
    }
    if (validatedData.name !== undefined) {
      updates.push('name = ?');
      values.push(validatedData.name);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    values.push(id);
    await query(`UPDATE User SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, values);

    const users = await query<any[]>('SELECT id, username, role, name, createdAt, updatedAt FROM User WHERE id = ?', [id]);

    return NextResponse.json(users[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent deleting own account
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    await query('DELETE FROM User WHERE id = ?', [id]);

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 });
  }
}
