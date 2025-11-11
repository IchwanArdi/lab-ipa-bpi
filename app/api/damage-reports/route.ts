import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import DamageReport from '@/models/DamageReport';
import Item from '@/models/Item';
import User from '@/models/User';
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

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (session.user.role === 'GURU') {
      query.userId = session.user.id;
    }
    if (status) {
      query.status = status;
    }

    const reports = await DamageReport.find(query).populate('userId', 'name username').populate('itemId').sort({ createdAt: -1 });

    const formattedReports = reports.map((report) => ({
      id: report._id,
      userId: report.userId,
      itemId: report.itemId,
      description: report.description,
      photoUrl: report.photoUrl,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      user: {
        id: typeof report.userId === 'object' && report.userId ? (report.userId as any)._id : report.userId,
        name: typeof report.userId === 'object' && report.userId ? (report.userId as any).name : '',
        username: typeof report.userId === 'object' && report.userId ? (report.userId as any).username : '',
      },
      item:
        typeof report.itemId === 'object' && report.itemId
          ? {
              id: (report.itemId as any)._id,
              code: (report.itemId as any).code,
              name: (report.itemId as any).name,
              category: (report.itemId as any).category,
              stock: (report.itemId as any).stock,
              condition: (report.itemId as any).condition,
              description: (report.itemId as any).description,
              createdAt: (report.itemId as any).createdAt,
              updatedAt: (report.itemId as any).updatedAt,
            }
          : null,
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

    await connectDB();
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
    const report = await DamageReport.create({
      _id: id,
      userId: session.user.id,
      itemId,
      description,
      photoUrl: photoUrl || undefined,
    });

    // Populate relations
    await report.populate('userId', 'name username');
    await report.populate('itemId');

    // Notify admins about new damage report
    try {
      const admins = await User.find({ role: 'ADMIN' }).select('_id');
      const adminIds = admins.map((admin) => admin._id.toString());
      await notifyDamageReportCreated(id, session.user.id, (report.itemId as any).name, adminIds);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      {
        id: report._id,
        userId: report.userId,
        itemId: report.itemId,
        description: report.description,
        photoUrl: report.photoUrl,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        user: {
          id: typeof report.userId === 'object' && report.userId ? (report.userId as any)._id : report.userId,
          name: typeof report.userId === 'object' && report.userId ? (report.userId as any).name : '',
          username: typeof report.userId === 'object' && report.userId ? (report.userId as any).username : '',
        },
        item:
          typeof report.itemId === 'object' && report.itemId
            ? {
                id: (report.itemId as any)._id,
                code: (report.itemId as any).code,
                name: (report.itemId as any).name,
                category: (report.itemId as any).category,
                stock: (report.itemId as any).stock,
                condition: (report.itemId as any).condition,
                description: (report.itemId as any).description,
                createdAt: (report.itemId as any).createdAt,
                updatedAt: (report.itemId as any).updatedAt,
              }
            : null,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat laporan' }, { status: 500 });
  }
}
