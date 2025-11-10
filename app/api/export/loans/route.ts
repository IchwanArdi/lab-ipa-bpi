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
    const format = searchParams.get('format') || 'xlsx'; // xlsx or pdf

    let sql = `
      SELECT 
        l.id,
        l.quantity,
        l.status,
        l.borrowDate,
        l.returnDate,
        l.notes,
        l.createdAt,
        u.name as userName,
        i.code as itemCode,
        i.name as itemName,
        i.category as itemCategory
      FROM Loan l
      INNER JOIN User u ON l.userId = u.id
      INNER JOIN Item i ON l.itemId = i.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (session.user.role === 'GURU') {
      sql += ' AND l.userId = ?';
      params.push(session.user.id);
    }
    if (status) {
      sql += ' AND l.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY l.createdAt DESC';

    const loans = await query<any[]>(sql, params);

    if (format === 'xlsx') {
      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        loans.map((loan) => ({
          Tanggal: new Date(loan.createdAt).toLocaleDateString('id-ID'),
          Peminjam: loan.userName,
          'Kode Alat': loan.itemCode,
          'Nama Alat': loan.itemName,
          Kategori: loan.itemCategory,
          Jumlah: loan.quantity,
          'Tanggal Pinjam': new Date(loan.borrowDate).toLocaleDateString('id-ID'),
          'Tanggal Kembali': loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('id-ID') : '-',
          Status: loan.status === 'MENUNGGU' ? 'Menunggu' : loan.status === 'DISETUJUI' ? 'Disetujui' : loan.status === 'DIPINJAM' ? 'Dipinjam' : 'Dikembalikan',
          Catatan: loan.notes || '',
        }))
      );

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // Tanggal
        { wch: 20 }, // Peminjam
        { wch: 15 }, // Kode Alat
        { wch: 30 }, // Nama Alat
        { wch: 20 }, // Kategori
        { wch: 10 }, // Jumlah
        { wch: 15 }, // Tanggal Pinjam
        { wch: 15 }, // Tanggal Kembali
        { wch: 15 }, // Status
        { wch: 40 }, // Catatan
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Peminjaman');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="peminjaman-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else {
      // PDF export using jsPDF
      const { jsPDF } = require('jspdf');
      const autoTable = require('jspdf-autotable');

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Laporan Peminjaman Alat', 14, 15);
      doc.setFontSize(10);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

      autoTable(doc, {
        startY: 28,
        head: [['Tanggal', 'Peminjam', 'Alat', 'Jumlah', 'Status']],
        body: loans.map((loan) => [
          new Date(loan.createdAt).toLocaleDateString('id-ID'),
          loan.userName,
          loan.itemName,
          loan.quantity,
          loan.status === 'MENUNGGU' ? 'Menunggu' : loan.status === 'DISETUJUI' ? 'Disetujui' : loan.status === 'DIPINJAM' ? 'Dipinjam' : 'Dikembalikan',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      const buffer = Buffer.from(doc.output('arraybuffer'));

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="peminjaman-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting loans:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 });
  }
}
