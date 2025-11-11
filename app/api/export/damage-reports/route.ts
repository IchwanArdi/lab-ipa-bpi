import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import DamageReport from '@/models/DamageReport';
import * as XLSX from 'xlsx';

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

    const reports = await DamageReport.find(query)
      .populate('userId', 'name')
      .populate('itemId', 'code name category')
      .sort({ createdAt: -1 });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      reports.map((report) => ({
        Tanggal: new Date(report.createdAt).toLocaleDateString('id-ID'),
        Pelapor: typeof report.userId === 'object' && report.userId ? (report.userId as any).name : '',
        'Kode Alat': typeof report.itemId === 'object' && report.itemId ? (report.itemId as any).code : '',
        'Nama Alat': typeof report.itemId === 'object' && report.itemId ? (report.itemId as any).name : '',
        Kategori: typeof report.itemId === 'object' && report.itemId ? (report.itemId as any).category : '',
        Deskripsi: report.description,
        Status: report.status === 'PENDING' ? 'Pending' : 'Selesai',
        'Ada Foto': report.photoUrl ? 'Ya' : 'Tidak',
      }))
    );

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Tanggal
      { wch: 20 }, // Pelapor
      { wch: 15 }, // Kode Alat
      { wch: 30 }, // Nama Alat
      { wch: 20 }, // Kategori
      { wch: 50 }, // Deskripsi
      { wch: 12 }, // Status
      { wch: 10 }, // Ada Foto
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Kerusakan');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan-kerusakan-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting damage reports:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 });
  }
}
