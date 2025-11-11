import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Loan from '@/models/Loan';
import Item from '@/models/Item';
import User from '@/models/User';
import { generateId } from '@/lib/utils';
import { notifyLoanCreated } from '@/lib/notifications';
import { z } from 'zod';

const loanSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
  borrowDate: z.string(),
  returnDate: z.string().optional(),
  notes: z.string().optional(),
});

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

    const loans = await Loan.find(query).populate('userId', 'name username').populate('itemId').sort({ createdAt: -1 });

    const formattedLoans = loans.map((loan) => ({
      id: loan._id,
      userId: loan.userId,
      itemId: loan.itemId,
      quantity: loan.quantity,
      status: loan.status,
      borrowDate: loan.borrowDate,
      returnDate: loan.returnDate,
      notes: loan.notes,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
      user: {
        id: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any)._id : loan.userId,
        name: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any).name : '',
        username: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any).username : '',
      },
      item:
        typeof loan.itemId === 'object' && loan.itemId
          ? {
              id: (loan.itemId as any)._id,
              code: (loan.itemId as any).code,
              name: (loan.itemId as any).name,
              category: (loan.itemId as any).category,
              stock: (loan.itemId as any).stock,
              condition: (loan.itemId as any).condition,
              description: (loan.itemId as any).description,
              createdAt: (loan.itemId as any).createdAt,
              updatedAt: (loan.itemId as any).updatedAt,
            }
          : null,
    }));

    return NextResponse.json(formattedLoans);
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

    // Hanya GURU yang bisa membuat peminjaman, ADMIN tidak bisa meminjam
    if (session.user.role !== 'GURU') {
      return NextResponse.json({ error: 'Hanya guru yang dapat meminjam alat' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const validatedData = loanSchema.parse(body);

    // Check item stock
    const item = await Item.findById(validatedData.itemId);

    if (!item) {
      return NextResponse.json({ error: 'Alat tidak ditemukan' }, { status: 404 });
    }

    if (item.stock < validatedData.quantity) {
      return NextResponse.json({ error: 'Stok tidak mencukupi' }, { status: 400 });
    }

    const id = generateId();
    const loan = await Loan.create({
      _id: id,
      userId: session.user.id,
      itemId: validatedData.itemId,
      quantity: validatedData.quantity,
      borrowDate: new Date(validatedData.borrowDate),
      returnDate: validatedData.returnDate ? new Date(validatedData.returnDate) : undefined,
      notes: validatedData.notes || undefined,
    });

    // Populate relations
    await loan.populate('userId', 'name username');
    await loan.populate('itemId');

    // Notify admins about new loan request
    try {
      const admins = await User.find({ role: 'ADMIN' }).select('_id');
      const adminIds = admins.map((admin) => admin._id.toString());
      await notifyLoanCreated(id, session.user.id, (loan.itemId as any).name, adminIds);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      {
        id: loan._id,
        userId: loan.userId,
        itemId: loan.itemId,
        quantity: loan.quantity,
        status: loan.status,
        borrowDate: loan.borrowDate,
        returnDate: loan.returnDate,
        notes: loan.notes,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
        user: {
          id: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any)._id : loan.userId,
          name: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any).name : '',
          username: typeof loan.userId === 'object' && loan.userId ? (loan.userId as any).username : '',
        },
        item:
          typeof loan.itemId === 'object' && loan.itemId
            ? {
                id: (loan.itemId as any)._id,
                code: (loan.itemId as any).code,
                name: (loan.itemId as any).name,
                category: (loan.itemId as any).category,
                stock: (loan.itemId as any).stock,
                condition: (loan.itemId as any).condition,
                description: (loan.itemId as any).description,
                createdAt: (loan.itemId as any).createdAt,
                updatedAt: (loan.itemId as any).updatedAt,
              }
            : null,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat peminjaman' }, { status: 500 });
  }
}
