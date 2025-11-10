import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { notifyDamageReportCreated } from '@/lib/notifications';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        d.*,
        u.id as user_id, u.name as user_name, u.username as user_username,
        i.*
      FROM DamageReport d
      INNER JOIN User u ON d.userId = u.id
      INNER JOIN Item i ON d.itemId = i.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (session.user.role === 'GURU') {
      sql += ' AND d.userId = ?';
      params.push(session.user.id);
    }
    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY d.createdAt DESC';

    const reports = await query<any[]>(sql, params);

    // Transform results
    const formattedReports = reports.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      itemId: row.itemId,
      description: row.description,
      photoUrl: row.photoUrl,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.user_id,
        name: row.user_name,
        username: row.user_username,
      },
      item: {
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        stock: row.stock,
        condition: row.condition,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    }));

    return NextResponse.json(formattedReports);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya GURU yang bisa melaporkan kerusakan, ADMIN tidak bisa melaporkan
    if (session.user.role !== 'GURU') {
      return NextResponse.json({ error: 'Hanya guru yang dapat melaporkan kerusakan' }, { status: 403 });
    }

    const formData = await request.formData();
    const itemId = formData.get('itemId') as string;
    const description = formData.get('description') as string;
    const photo = formData.get('photo') as File | null;

    if (!itemId || !description) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    let photoUrl: string | undefined;

    if (photo && photo.size > 0) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `${Date.now()}-${photo.name}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'damage-reports');
      const filepath = join(uploadDir, filename);

      // Create directory if it doesn't exist
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      await writeFile(filepath, buffer);
      photoUrl = `/uploads/damage-reports/${filename}`;
    }

    const id = generateId();
    await query('INSERT INTO DamageReport (id, userId, itemId, description, photoUrl) VALUES (?, ?, ?, ?, ?)', [id, session.user.id, itemId, description, photoUrl || null]);

    // Get created report with relations
    const reports = await query<any[]>(
      `SELECT 
        d.*,
        u.id as user_id, u.name as user_name, u.username as user_username,
        i.*
      FROM DamageReport d
      INNER JOIN User u ON d.userId = u.id
      INNER JOIN Item i ON d.itemId = i.id
      WHERE d.id = ?`,
      [id]
    );

    const row = reports[0];
    const report = {
      id: row.id,
      userId: row.userId,
      itemId: row.itemId,
      description: row.description,
      photoUrl: row.photoUrl,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.user_id,
        name: row.user_name,
        username: row.user_username,
      },
      item: {
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        stock: row.stock,
        condition: row.condition,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    };

    // Notify admins about new damage report
    try {
      const admins = await query<any[]>('SELECT id FROM User WHERE role = ?', ['ADMIN']);
      const adminIds = admins.map((admin: any) => admin.id);
      await notifyDamageReportCreated(id, session.user.id, row.name, adminIds);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat laporan' }, { status: 500 });
  }
}
