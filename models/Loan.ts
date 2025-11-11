import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoan extends Document {
  _id: string;
  userId: string;
  itemId: string;
  quantity: number;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DIPINJAM' | 'DIKEMBALIKAN';
  borrowDate: Date;
  returnDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    itemId: { type: String, required: true, ref: 'Item' },
    quantity: { type: Number, required: true },
    status: {
      type: String,
      enum: ['MENUNGGU', 'DISETUJUI', 'DIPINJAM', 'DIKEMBALIKAN'],
      required: true,
      default: 'MENUNGGU',
    },
    borrowDate: { type: Date, required: true },
    returnDate: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Indexes untuk performance
LoanSchema.index({ userId: 1, status: 1 });
LoanSchema.index({ status: 1, createdAt: -1 });
LoanSchema.index({ itemId: 1, status: 1 });
LoanSchema.index({ createdAt: 1, status: 1 });

const Loan: Model<ILoan> = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default Loan;
