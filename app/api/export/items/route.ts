import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Item from '@/models/Item';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const items = await Item.find().select('code name category stock condition description createdAt').sort({ createdAt: -1 });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      items.map((item) => ({
        Kode: item.code,
        Nama: item.name,
        Kategori: item.category,
        Stok: item.stock,
        Kondisi: item.condition,
        Deskripsi: item.description || '',
        'Tanggal Dibuat': new Date(item.createdAt).toLocaleDateString('id-ID'),
      }))
    );

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Kode
      { wch: 30 }, // Nama
      { wch: 20 }, // Kategori
      { wch: 10 }, // Stok
      { wch: 12 }, // Kondisi
      { wch: 40 }, // Deskripsi
      { wch: 18 }, // Tanggal
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaris');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inventaris-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting items:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 });
  }
}
