import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
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

    await connectDB();
    const users = await User.find().select('_id username role name gmail createdAt updatedAt').sort({ createdAt: -1 });

    // Transform _id to id for compatibility
    const formattedUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      gmail: user.gmail,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json(formattedUsers);
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
    const validatedData = userSchema.parse(body);

    if (!validatedData.password) {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: validatedData.username });

    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah ada' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const id = generateId();

    const user = await User.create({
      _id: id,
      username: validatedData.username,
      password: hashedPassword,
      role: validatedData.role as UserRole,
      name: validatedData.name,
    });

    return NextResponse.json(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        gmail: user.gmail,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 });
  }
}
