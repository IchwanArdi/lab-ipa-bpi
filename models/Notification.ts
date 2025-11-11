import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  relatedType: 'LOAN' | 'DAMAGE_REPORT' | 'ITEM' | 'SYSTEM';
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
      required: true,
      default: 'INFO',
    },
    relatedType: {
      type: String,
      enum: ['LOAN', 'DAMAGE_REPORT', 'ITEM', 'SYSTEM'],
      required: true,
    },
    relatedId: { type: String },
    isRead: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: false,
  }
);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
