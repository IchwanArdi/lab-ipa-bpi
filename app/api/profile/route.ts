import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
  profileImage: z.string().optional().or(z.literal('')).nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await query<any[]>('SELECT id, username, role, name, profileImage, createdAt, updatedAt FROM User WHERE id = ?', [session.user.id]);

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Gagal mengambil data profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.name !== undefined) {
      updates.push('name = ?');
      values.push(validatedData.name);
    }

    if (validatedData.password && validatedData.password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (validatedData.profileImage !== undefined) {
      updates.push('profileImage = ?');
      values.push(validatedData.profileImage || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    values.push(session.user.id);
    await query(`UPDATE User SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, values);

    const users = await query<any[]>('SELECT id, username, role, name, profileImage, createdAt, updatedAt FROM User WHERE id = ?', [session.user.id]);

    return NextResponse.json(users[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Gagal mengupdate profile' }, { status: 500 });
  }
}
