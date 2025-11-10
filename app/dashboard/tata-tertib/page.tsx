import Card from '@/components/Card';
import { FileText } from 'lucide-react';

export default function TataTertibPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Tata Tertib</h1>
        <p className="text-sm sm:text-base text-gray-600">Peraturan laboratorium IPA</p>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Coming Soon</h2>
          <p className="text-gray-600 text-center max-w-md">Halaman Tata Tertib sedang dalam pengembangan. Konten akan segera tersedia.</p>
        </div>
      </Card>
    </div>
  );
}
