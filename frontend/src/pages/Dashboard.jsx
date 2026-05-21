import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import SummaryCards from '../components/reports/SummaryCards';
import { BarChartWidget } from '../components/reports/ReportChart';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    Promise.all([
      api.get('/reports/sales-summary', { params: { from: monthStart, to: today } }),
      api.get('/reports/daily-sales', { params: { from: monthStart, to: today } }),
      api.get('/products', { params: { limit: 100, active: true } }),
    ]).then(([s, d, p]) => {
      setSummary(s.data);
      setDailySales(d.data);
      setLowStock(p.data.data.filter((prod) => prod.stock <= prod.reorder_level && prod.reorder_level > 0));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <SummaryCards data={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Sales Trend" className="lg:col-span-2">
          <BarChartWidget data={dailySales} title="Daily Sales (This Month)" />
        </Card>
        <Card title="Low Stock Alerts">
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">All items well stocked</p>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 10).map((p) => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm">
                  <span className="font-medium truncate">{p.name}</span>
                  <span className="text-red-600 font-bold">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
