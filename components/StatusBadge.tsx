import { LoanStatus, DamageReportStatus } from '@/types/database';

type Status = LoanStatus | DamageReportStatus;

interface StatusBadgeProps {
  status: Status;
}

const statusStyles: Record<Status, string> = {
  MENUNGGU: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DISETUJUI: 'bg-blue-100 text-blue-800 border-blue-200',
  DIPINJAM: 'bg-green-100 text-green-800 border-green-200',
  DIKEMBALIKAN: 'bg-gray-100 text-gray-800 border-gray-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels: Record<Status, string> = {
  MENUNGGU: 'Menunggu',
  DISETUJUI: 'Disetujui',
  DIPINJAM: 'Dipinjam',
  DIKEMBALIKAN: 'Dikembalikan',
  PENDING: 'Pending',
  SELESAI: 'Selesai',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}
