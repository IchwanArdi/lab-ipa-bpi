import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Loan from '@/models/Loan';
import Item from '@/models/Item';
import { notifyLoanStatusChanged } from '@/lib/notifications';
import { LoanStatus } from '@/types/database';
import { z } from 'zod';

const updateLoanSchema = z.object({
  status: z.enum(['MENUNGGU', 'DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN']).optional(),
  returnDate: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLoanSchema.parse(body);

    const loan = await Loan.findById(id).populate('itemId');

    if (!loan) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    const item = loan.itemId as any;

    // Only admin can change status
    if (validatedData.status && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If status changed to DIKEMBALIKAN, update item stock
    if (validatedData.status === 'DIKEMBALIKAN' && loan.status !== 'DIKEMBALIKAN') {
      await Item.findByIdAndUpdate(loan.itemId, { $inc: { stock: loan.quantity } });
    }

    // If status changed from MENUNGGU to DISETUJUI/DIPINJAM, decrease stock
    if (loan.status === 'MENUNGGU' && (validatedData.status === 'DISETUJUI' || validatedData.status === 'DIPINJAM')) {
      if (item.stock < loan.quantity) {
        return NextResponse.json({ error: 'Stok tidak mencukupi' }, { status: 400 });
      }

      await Item.findByIdAndUpdate(loan.itemId, { $inc: { stock: -loan.quantity } });
    }

    // Build update object
    const updateData: any = {};
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status as LoanStatus;
    }
    if (validatedData.returnDate !== undefined) {
      updateData.returnDate = validatedData.returnDate ? new Date(validatedData.returnDate) : null;
    }

    const updatedLoan = await Loan.findByIdAndUpdate(id, updateData, { new: true }).populate('userId', 'name username').populate('itemId');

    if (!updatedLoan) {
      return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 });
    }

    // Notify user if status changed
    if (validatedData.status && validatedData.status !== loan.status) {
      try {
        await notifyLoanStatusChanged(id, (updatedLoan.userId as any)._id?.toString() || updatedLoan.userId.toString(), validatedData.status, (updatedLoan.itemId as any).name);
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      id: updatedLoan._id,
      userId: updatedLoan.userId,
      itemId: updatedLoan.itemId,
      quantity: updatedLoan.quantity,
      status: updatedLoan.status,
      borrowDate: updatedLoan.borrowDate,
      returnDate: updatedLoan.returnDate,
      notes: updatedLoan.notes,
      createdAt: updatedLoan.createdAt,
      updatedAt: updatedLoan.updatedAt,
      user: {
        id: typeof updatedLoan.userId === 'object' && updatedLoan.userId ? (updatedLoan.userId as any)._id : updatedLoan.userId,
        name: typeof updatedLoan.userId === 'object' && updatedLoan.userId ? (updatedLoan.userId as any).name : '',
        username: typeof updatedLoan.userId === 'object' && updatedLoan.userId ? (updatedLoan.userId as any).username : '',
      },
      item:
        typeof updatedLoan.itemId === 'object' && updatedLoan.itemId
          ? {
              id: (updatedLoan.itemId as any)._id,
              code: (updatedLoan.itemId as any).code,
              name: (updatedLoan.itemId as any).name,
              category: (updatedLoan.itemId as any).category,
              stock: (updatedLoan.itemId as any).stock,
              condition: (updatedLoan.itemId as any).condition,
              description: (updatedLoan.itemId as any).description,
              createdAt: (updatedLoan.itemId as any).createdAt,
              updatedAt: (updatedLoan.itemId as any).updatedAt,
            }
          : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate peminjaman' }, { status: 500 });
  }
}
