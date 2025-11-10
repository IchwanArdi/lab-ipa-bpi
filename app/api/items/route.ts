import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { z } from 'zod';

const itemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  stock: z.number().int().min(0),
  condition: z.enum(['BAIK', 'RUSAK']),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const items = await query<any[]>('SELECT * FROM Item ORDER BY createdAt DESC');
    return NextResponse.json(items);
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
    const validatedData = itemSchema.parse(body);

    // Check if code already exists
    const existingItems = await query<any[]>('SELECT * FROM Item WHERE code = ?', [validatedData.code]);

    if (existingItems && existingItems.length > 0) {
      return NextResponse.json({ error: 'Kode alat sudah ada' }, { status: 400 });
    }

    const id = generateId();
    await query('INSERT INTO Item (id, code, name, category, stock, `condition`, description) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      id,
      validatedData.code,
      validatedData.name,
      validatedData.category,
      validatedData.stock,
      validatedData.condition,
      validatedData.description || null,
    ]);

    const item = await query<any[]>('SELECT * FROM Item WHERE id = ?', [id]);

    return NextResponse.json(item[0], { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Data tidak valid',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: 'Gagal membuat alat',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
