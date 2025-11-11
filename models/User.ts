import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'GURU';
  name: string;
  gmail?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'GURU'], required: true },
    name: { type: String, required: true },
    gmail: { type: String },
    profileImage: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ role: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
