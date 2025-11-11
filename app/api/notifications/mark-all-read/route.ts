import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await Notification.updateMany({ userId: session.user.id, isRead: false }, { $set: { isRead: true } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return NextResponse.json({ error: 'Gagal menandai semua sebagai dibaca' }, { status: 500 });
  }
}
