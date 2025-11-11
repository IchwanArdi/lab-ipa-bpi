import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    // Verify notification belongs to user
    const notification = await Notification.findOne({ _id: id, userId: session.user.id });

    if (!notification) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
    }

    if (isRead !== undefined) {
      notification.isRead = isRead;
      await notification.save();
    }

    return NextResponse.json({
      id: notification._id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedType: notification.relatedType,
      relatedId: notification.relatedId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
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

    await connectDB();
    const { id } = await params;

    // Verify notification belongs to user
    const notification = await Notification.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!notification) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Gagal menghapus notifikasi' }, { status: 500 });
  }
}
