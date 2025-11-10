import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { z } from 'zod';

const teacherSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  subject: z.string().min(1),
});

export async function GET() {
  try {
    const teachers = await query<any[]>('SELECT * FROM Teacher ORDER BY createdAt DESC');
    return NextResponse.json(teachers);
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
    const validatedData = teacherSchema.parse(body);

    const id = generateId();
    await query('INSERT INTO Teacher (id, name, email, phone, subject) VALUES (?, ?, ?, ?, ?)', [id, validatedData.name, validatedData.email || null, validatedData.phone || null, validatedData.subject]);

    const teachers = await query<any[]>('SELECT * FROM Teacher WHERE id = ?', [id]);

    return NextResponse.json(teachers[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat guru' }, { status: 500 });
  }
}
