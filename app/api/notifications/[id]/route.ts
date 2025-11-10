import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    // Verify notification belongs to user
    const notifications = await query<any[]>('SELECT * FROM Notification WHERE id = ? AND userId = ?', [id, session.user.id]);

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
    }

    if (isRead !== undefined) {
      await query('UPDATE Notification SET isRead = ? WHERE id = ?', [isRead, id]);
    }

    const updated = await query<any[]>('SELECT * FROM Notification WHERE id = ?', [id]);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Gagal mengupdate notifikasi' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify notification belongs to user
    const notifications = await query<any[]>('SELECT * FROM Notification WHERE id = ? AND userId = ?', [id, session.user.id]);

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
    }

    await query('DELETE FROM Notification WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Gagal menghapus notifikasi' }, { status: 500 });
  }
}
