// Database Types
export type UserRole = 'ADMIN' | 'GURU';
export type ItemCondition = 'BAIK' | 'RUSAK';
export type LoanStatus = 'MENUNGGU' | 'DISETUJUI' | 'DIPINJAM' | 'DIKEMBALIKAN';
export type DamageReportStatus = 'PENDING' | 'SELESAI';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  profileImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  condition: ItemCondition;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  status: LoanStatus;
  borrowDate: Date;
  returnDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  item?: Item;
}

export interface DamageReport {
  id: string;
  userId: string;
  itemId: string;
  description: string;
  photoUrl: string | null;
  status: DamageReportStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  item?: Item;
}

export interface Teacher {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type NotificationRelatedType = 'LOAN' | 'DAMAGE_REPORT' | 'ITEM' | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedType: NotificationRelatedType;
  relatedId: string | null;
  isRead: boolean;
  createdAt: Date;
}
