import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
  profileImage: z.string().optional().or(z.literal('')).nullable(),
  gmail: z.string().email('Format email tidak valid').optional().or(z.literal('')).nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('_id username role name gmail profileImage createdAt updatedAt');

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      gmail: user.gmail,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
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

    await connectDB();
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Build update object
    const updateData: any = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.password && validatedData.password.trim() !== '') {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    if (validatedData.profileImage !== undefined) {
      updateData.profileImage = validatedData.profileImage || null;
    }

    if (validatedData.gmail !== undefined) {
      updateData.gmail = validatedData.gmail && validatedData.gmail.trim() !== '' ? validatedData.gmail : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(session.user.id, updateData, { new: true, runValidators: true });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      gmail: user.gmail,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Gagal mengupdate profile' }, { status: 500 });
  }
}
