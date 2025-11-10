import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await query<any[]>('SELECT code, name, category, stock, `condition`, description, createdAt FROM Item ORDER BY createdAt DESC');

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
