'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from './Card';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsCharts() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?months=${period}`);
      if (res.ok) {
        const analyticsData = await res.json();
        // Normalize data to ensure no NaN values
        const normalizedData = {
          loanTrends: (analyticsData.loanTrends || []).map((item: any) => ({
            month: item.month || '',
            count: Number(item.count) || 0,
            returned: Number(item.returned) || 0,
          })),
          topItems: (analyticsData.topItems || []).map((item: any) => ({
            ...item,
            borrowCount: Number(item.borrowCount) || 0,
            totalQuantity: Number(item.totalQuantity) || 0,
          })),
          categoryStats: (analyticsData.categoryStats || []).map((item: any) => ({
            category: item.category || '',
            loanCount: Number(item.loanCount) || 0,
            itemCount: Number(item.itemCount) || 0,
            returnedCount: Number(item.returnedCount) || 0,
          })),
          statusDistribution: (analyticsData.statusDistribution || []).map((item: any) => ({
            status: item.status || '',
            count: Number(item.count) || 0,
          })),
          monthlyLoans: (analyticsData.monthlyLoans || []).map((item: any) => ({
            month: item.month || '',
            total: Number(item.total) || 0,
            pending: Number(item.pending) || 0,
            approved: Number(item.approved) || 0,
            borrowed: Number(item.borrowed) || 0,
            returned: Number(item.returned) || 0,
          })),
          damageByCategory: analyticsData.damageByCategory || [],
        };
        setData(normalizedData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="h-64 bg-gray-100 animate-pulse rounded" />
        </Card>
        <Card>
          <div className="h-64 bg-gray-100 animate-pulse rounded" />
        </Card>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-gray-500">Tidak ada data analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Periode:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
          <option value="3">3 Bulan</option>
          <option value="6">6 Bulan</option>
          <option value="12">12 Bulan</option>
        </select>
      </div>

      {/* Loan Trends */}
      <Card title="Tren Peminjaman" hover>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.monthlyLoans || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
            <Line type="monotone" dataKey="returned" stroke="#10b981" name="Dikembalikan" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <Card title="Alat Paling Sering Dipinjam" hover>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(data.topItems || []).slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="borrowCount" fill="#3b82f6" name="Jumlah Peminjaman" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card title="Distribusi Status Peminjaman" hover>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.statusDistribution || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="count">
                {(data.statusDistribution || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Category Stats */}
      <Card title="Statistik per Kategori" hover>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.categoryStats || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="loanCount" fill="#3b82f6" name="Jumlah Peminjaman" />
            <Bar dataKey="itemCount" fill="#10b981" name="Jumlah Alat" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
