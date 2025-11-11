import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDamageReport extends Document {
  _id: string;
  userId: string;
  itemId: string;
  description: string;
  photoUrl?: string;
  status: 'PENDING' | 'SELESAI';
  createdAt: Date;
  updatedAt: Date;
}

const DamageReportSchema = new Schema<IDamageReport>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    itemId: { type: String, required: true, ref: 'Item' },
    description: { type: String, required: true },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'SELESAI'],
      required: true,
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Indexes
DamageReportSchema.index({ userId: 1, status: 1 });
DamageReportSchema.index({ status: 1, createdAt: -1 });

const DamageReport: Model<IDamageReport> = mongoose.models.DamageReport || mongoose.model<IDamageReport>('DamageReport', DamageReportSchema);

export default DamageReport;
