import { query } from './db';
import { generateId } from './utils';
import { NotificationType, NotificationRelatedType } from '@/types/database';

export async function createNotification(userId: string, title: string, message: string, type: NotificationType = 'INFO', relatedType: NotificationRelatedType, relatedId: string | null = null) {
  try {
    const id = generateId();
    await query('INSERT INTO Notification (id, userId, title, message, type, relatedType, relatedId) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, userId, title, message, type, relatedType, relatedId]);
    return id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function notifyLoanCreated(loanId: string, userId: string, itemName: string, adminIds: string[]) {
  // Notify admin about new loan request
  for (const adminId of adminIds) {
    await createNotification(adminId, 'Peminjaman Baru', `Guru meminta pinjam alat: ${itemName}`, 'INFO', 'LOAN', loanId);
  }
}

export async function notifyLoanStatusChanged(loanId: string, userId: string, status: string, itemName: string) {
  const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
    DISETUJUI: {
      title: 'Peminjaman Disetujui',
      message: `Peminjaman alat "${itemName}" telah disetujui`,
      type: 'SUCCESS',
    },
    DIPINJAM: {
      title: 'Alat Dipinjam',
      message: `Alat "${itemName}" telah dipinjam`,
      type: 'INFO',
    },
    DIKEMBALIKAN: {
      title: 'Alat Dikembalikan',
      message: `Alat "${itemName}" telah dikembalikan`,
      type: 'SUCCESS',
    },
  };

  const statusInfo = statusMessages[status];
  if (statusInfo) {
    await createNotification(userId, statusInfo.title, statusInfo.message, statusInfo.type, 'LOAN', loanId);
  }
}

export async function notifyDamageReportCreated(reportId: string, userId: string, itemName: string, adminIds: string[]) {
  // Notify admin about new damage report
  for (const adminId of adminIds) {
    await createNotification(adminId, 'Laporan Kerusakan Baru', `Ada laporan kerusakan untuk alat: ${itemName}`, 'WARNING', 'DAMAGE_REPORT', reportId);
  }
}
