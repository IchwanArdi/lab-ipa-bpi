import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const query: any = { userId: session.user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json(
      notifications.map((n) => ({
        id: n._id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        relatedType: n.relatedType,
        relatedId: n.relatedId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }))
    );
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

    await connectDB();
    const body = await request.json();
    const { userId, title, message, type = 'INFO', relatedType, relatedId } = body;

    if (!userId || !title || !message || !relatedType) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const id = generateId();
    const notification = await Notification.create({
      _id: id,
      userId,
      title,
      message,
      type,
      relatedType,
      relatedId: relatedId || undefined,
    });

    return NextResponse.json(
      {
        id: notification._id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        relatedType: notification.relatedType,
        relatedId: notification.relatedId,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Gagal membuat notifikasi' }, { status: 500 });
  }
}
