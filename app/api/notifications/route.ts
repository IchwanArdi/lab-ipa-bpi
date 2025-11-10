import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let sql = 'SELECT * FROM Notification WHERE userId = ?';
    const params: any[] = [session.user.id];

    if (unreadOnly) {
      sql += ' AND isRead = FALSE';
    }

    sql += ' ORDER BY createdAt DESC LIMIT 50';

    const notifications = await query<any[]>(sql, params);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, message, type = 'INFO', relatedType, relatedId } = body;

    if (!userId || !title || !message || !relatedType) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const id = generateId();
    await query('INSERT INTO Notification (id, userId, title, message, type, relatedType, relatedId) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, userId, title, message, type, relatedType, relatedId || null]);

    const notifications = await query<any[]>('SELECT * FROM Notification WHERE id = ?', [id]);

    return NextResponse.json(notifications[0], { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Gagal membuat notifikasi' }, { status: 500 });
  }
}
