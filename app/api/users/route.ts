import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/database';

const userSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'GURU']),
  name: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await query<any[]>('SELECT id, username, role, name, createdAt, updatedAt FROM User ORDER BY createdAt DESC');

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = userSchema.parse(body);

    if (!validatedData.password) {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 });
    }

    // Check if username already exists
    const existingUsers = await query<any[]>('SELECT * FROM User WHERE username = ?', [validatedData.username]);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Username sudah ada' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const id = generateId();

    await query('INSERT INTO User (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)', [id, validatedData.username, hashedPassword, validatedData.role as UserRole, validatedData.name]);

    const users = await query<any[]>('SELECT id, username, role, name, createdAt, updatedAt FROM User WHERE id = ?', [id]);

    return NextResponse.json(users[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 });
  }
}
