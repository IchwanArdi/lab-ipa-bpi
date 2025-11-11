import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
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

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if username already exists (if username is being updated)
    if (validatedData.username) {
      const existingUser = await User.findOne({ username: validatedData.username, _id: { $ne: id } });

      if (existingUser) {
        return NextResponse.json({ error: 'Username sudah ada' }, { status: 400 });
      }
    }

    // Build update object
    const updateData: any = {};
    if (validatedData.username !== undefined) {
      updateData.username = validatedData.username;
    }
    if (validatedData.password !== undefined) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }
    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role as UserRole;
    }
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      gmail: user.gmail,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
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

    await connectDB();
    const { id } = await params;

    // Prevent deleting own account
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 });
  }
}
