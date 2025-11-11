import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Item from '@/models/Item';
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
    await connectDB();
    const { id } = await params;
    const item = await Item.findById(id);

    if (!item) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
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

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const validatedData = itemSchema.parse(body);

    // Check if code already exists (if code is being updated)
    if (validatedData.code) {
      const existingItem = await Item.findOne({ code: validatedData.code, _id: { $ne: id } });

      if (existingItem) {
        return NextResponse.json({ error: 'Kode alat sudah ada' }, { status: 400 });
      }
    }

    const item = await Item.findByIdAndUpdate(id, validatedData, { new: true, runValidators: true });

    if (!item) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
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

    await connectDB();
    const { id } = await params;
    const item = await Item.findByIdAndDelete(id);

    if (!item) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Alat berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus alat' }, { status: 500 });
  }
}
