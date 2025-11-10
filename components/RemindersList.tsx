'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Card from './Card';
import { AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Reminder {
  id: string;
  loanId: string;
  itemName: string;
  itemCode: string;
  userName: string;
  returnDate: string;
  isOverdue: boolean;
  daysUntilDue: number;
  daysOverdue: number;
  quantity: number;
  status: string;
}

export default function RemindersList() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
    // Refresh every minute
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
    try {
      // API akan otomatis filter berdasarkan role di backend
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title="Pengingat Pengembalian" hover>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (reminders.length === 0) {
    return (
      <Card title="Pengingat Pengembalian" hover>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Tidak ada pengingat</p>
        </div>
      </Card>
    );
  }

  const overdueReminders = reminders.filter((r) => r.isOverdue);
  const dueTodayReminders = reminders.filter((r) => !r.isOverdue && r.daysUntilDue === 0);

  return (
    <Card title={isAdmin ? 'Pengingat Pengembalian' : 'Pengingat Saya'} hover>
      <div className="space-y-3">
        {overdueReminders.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Terlambat ({overdueReminders.length})
            </h4>
            <div className="space-y-2">
              {overdueReminders.map((reminder) => (
                <div key={reminder.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{reminder.itemName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {isAdmin ? `${reminder.userName} • ` : ''}Jumlah: {reminder.quantity}
                      </p>
                      <p className="text-xs text-red-600 font-medium mt-1">Terlambat {isNaN(reminder.daysOverdue) ? 0 : reminder.daysOverdue} hari</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{format(new Date(reminder.returnDate), 'dd MMM yyyy', { locale: id })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dueTodayReminders.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-yellow-600 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Jatuh Tempo Hari Ini ({dueTodayReminders.length})
            </h4>
            <div className="space-y-2">
              {dueTodayReminders.map((reminder) => (
                <div key={reminder.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{reminder.itemName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {isAdmin ? `${reminder.userName} • ` : ''}Jumlah: {reminder.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-yellow-600 font-medium">Hari ini</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reminders.filter((r) => !r.isOverdue && r.daysUntilDue > 0).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-blue-600 mb-2">Akan Jatuh Tempo</h4>
            <div className="space-y-2">
              {reminders
                .filter((r) => !r.isOverdue && r.daysUntilDue > 0)
                .slice(0, 5)
                .map((reminder) => (
                  <div key={reminder.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{reminder.itemName}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {reminder.userName} • Jumlah: {reminder.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600 font-medium">{isNaN(reminder.daysUntilDue) ? 0 : reminder.daysUntilDue} hari lagi</p>
                        <p className="text-xs text-gray-500 mt-1">{reminder.returnDate ? format(new Date(reminder.returnDate), 'dd MMM', { locale: id }) : '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
