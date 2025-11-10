import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateId } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/database';

export async function POST() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Check if admin already exists
    const existingAdmins = await query<any[]>('SELECT * FROM User WHERE username = ?', ['admin']);

    let admin;
    if (existingAdmins && existingAdmins.length > 0) {
      admin = existingAdmins[0];
    } else {
      const adminId = generateId();
      await query('INSERT INTO User (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)', [adminId, 'admin', hashedPassword, UserRole.ADMIN, 'Administrator']);
      const admins = await query<any[]>('SELECT * FROM User WHERE id = ?', [adminId]);
      admin = admins[0];
    }

    // Check if guru already exists
    const existingGurus = await query<any[]>('SELECT * FROM User WHERE username = ?', ['guru1']);

    let guru;
    if (existingGurus && existingGurus.length > 0) {
      guru = existingGurus[0];
    } else {
      const guruId = generateId();
      await query('INSERT INTO User (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)', [guruId, 'guru1', hashedPassword, UserRole.GURU, 'Guru IPA 1']);
      const gurus = await query<any[]>('SELECT * FROM User WHERE id = ?', [guruId]);
      guru = gurus[0];
    }

    return NextResponse.json({
      success: true,
      message: 'Seed berhasil!',
      users: { admin, guru },
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
