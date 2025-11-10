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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        d.id,
        d.description,
        d.photoUrl,
        d.status,
        d.createdAt,
        u.name as userName,
        i.code as itemCode,
        i.name as itemName,
        i.category as itemCategory
      FROM DamageReport d
      INNER JOIN User u ON d.userId = u.id
      INNER JOIN Item i ON d.itemId = i.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (session.user.role === 'GURU') {
      sql += ' AND d.userId = ?';
      params.push(session.user.id);
    }
    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY d.createdAt DESC';

    const reports = await query<any[]>(sql, params);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      reports.map((report) => ({
        Tanggal: new Date(report.createdAt).toLocaleDateString('id-ID'),
        Pelapor: report.userName,
        'Kode Alat': report.itemCode,
        'Nama Alat': report.itemName,
        Kategori: report.itemCategory,
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
