import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateId } from '@/lib/utils';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await connectDB();

    // Hash password
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Check if admin already exists
    let admin = await User.findOne({ username: 'admin' });

    if (!admin) {
      const adminId = generateId();
      admin = await User.create({
        _id: adminId,
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Administrator',
      });
    }

    // Check if guru already exists
    let guru = await User.findOne({ username: 'guru1' });

    if (!guru) {
      const guruId = generateId();
      guru = await User.create({
        _id: guruId,
        username: 'guru1',
        password: hashedPassword,
        role: 'GURU',
        name: 'Guru IPA 1',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Seed berhasil!',
      users: {
        admin: {
          id: admin._id,
          username: admin.username,
          role: admin.role,
          name: admin.name,
        },
        guru: {
          id: guru._id,
          username: guru.username,
          role: guru.role,
          name: guru.name,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal melakukan seed',
      },
      { status: 500 }
    );
  }
}
