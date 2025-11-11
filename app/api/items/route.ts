import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Item from '@/models/Item';
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
    await connectDB();
    const items = await Item.find().sort({ createdAt: -1 });
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

    await connectDB();
    const body = await request.json();
    const validatedData = itemSchema.parse(body);

    // Check if code already exists
    const existingItem = await Item.findOne({ code: validatedData.code });

    if (existingItem) {
      return NextResponse.json({ error: 'Kode alat sudah ada' }, { status: 400 });
    }

    const id = generateId();
    const item = await Item.create({
      _id: id,
      ...validatedData,
    });

    return NextResponse.json(item, { status: 201 });
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
