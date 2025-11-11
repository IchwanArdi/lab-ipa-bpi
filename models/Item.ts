import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IItem extends Document {
  _id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  condition: 'BAIK' | 'RUSAK';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    condition: { type: String, enum: ['BAIK', 'RUSAK'], required: true, default: 'BAIK' },
    description: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

ItemSchema.index({ code: 1 }, { unique: true });
ItemSchema.index({ condition: 1, stock: 1 });
ItemSchema.index({ category: 1, createdAt: -1 });

const Item: Model<IItem> = mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);

export default Item;
