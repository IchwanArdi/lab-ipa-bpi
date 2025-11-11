import Card from '@/components/Card';
import { Shield } from 'lucide-react';

export default function K3Page() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Coming Soon</h2>
          <p className="text-gray-600 text-center max-w-md">Halaman K3 / Keamanan sedang dalam pengembangan. Konten akan segera tersedia.</p>
        </div>
      </Card>
    </div>
  );
}
