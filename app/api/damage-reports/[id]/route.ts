import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import DamageReport from '@/models/DamageReport';
import { DamageReportStatus } from '@/types/database';
import { z } from 'zod';

const updateReportSchema = z.object({
  status: z.enum(['PENDING', 'SELESAI']),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateReportSchema.parse(body);

    const report = await DamageReport.findByIdAndUpdate(id, { status: validatedData.status as DamageReportStatus }, { new: true })
      .populate('userId', 'name username')
      .populate('itemId');

    if (!report) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate laporan' }, { status: 500 });
  }
}
