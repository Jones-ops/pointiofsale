import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/ui/Card';
import SummaryCards from '../components/reports/SummaryCards';
import { BarChartWidget, PieChartWidget } from '../components/reports/ReportChart';
import { PlusIcon, ShoppingCartIcon, CubeIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    Promise.all([
      api.get('/reports/sales-summary', { params: { from: monthStart, to: today } }),
      api.get('/reports/daily-sales', { params: { from: monthStart, to: today } }),
      api.get('/products', { params: { limit: 200, active: true } }),
      api.get('/sales', { params: { limit: 5 } }),
      api.get('/reports/payment-methods', { params: { from: monthStart, to: today } }),
      api.get('/customers', { params: { limit: 1 } }),
      api.get('/pos/sessions/active').catch(() => ({ data: null })),
    ]).then(([s, d, p, sales, pm, cust, session]) => {
      setSummary(s.data);
      setDailySales(d.data);
      setLowStock(p.data.data.filter((prod) => prod.stock <= prod.reorder_level && prod.reorder_level > 0));
      setRecentSales(sales.data.data || []);
      setPaymentMethods(pm.data || []);
      setCustomerCount(cust.data?.total || 0);
      setActiveSession(session.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-400 mt-3">Loading dashboard...</p>
      </div>
    </div>
  );

  const fmt = (v) => new Intl.NumberFormat().format(Number(v || 0).toFixed(2));
  const currency = (v) => new Intl.NumberFormat().format(Number(v));

  const actions = [
    { label: 'New Sale', icon: ShoppingCartIcon, path: '/pos', color: 'bg-primary-600 hover:bg-primary-700' },
    { label: 'Add Product', icon: CubeIcon, path: '/products', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Record Expense', icon: CurrencyDollarIcon, path: '/expenses', color: 'bg-orange-500 hover:bg-orange-600' },
    { label: 'View Reports', icon: ArrowTrendingUpIcon, path: '/reports', color: 'bg-violet-500 hover:bg-violet-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className={`flex items-center gap-2 px-4 py-2.5 ${a.color} text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150`}
            >
              <Icon className="w-4 h-4" />
              {a.label}
            </button>
          );
        })}
        {activeSession && (
          <span className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Session #{activeSession.id} open
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <SummaryCards data={summary} period={`This month (${new Date().toLocaleString('default', { month: 'long' })})`} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card title="Sales Trend" className="lg:col-span-2">
          <BarChartWidget data={dailySales} dataKey="total" title="Daily Sales" color="#4f46e5" />
        </Card>

        {/* Top Products */}
        <Card title="Top Products">
          {summary?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {summary.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.qty} units</div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{fmt(p.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No sales data yet</p>
          )}
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card title="Recent Transactions" className="lg:col-span-2">
          {recentSales.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 text-sm cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors" onClick={() => navigate('/sales')}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{s.receipt_no}</span>
                    <span className="truncate text-gray-700">{s.customer_name || 'Walk-in'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-medium">{fmt(s.total_amount)}</span>
                    <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${s.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{s.payment_status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
          )}
          <button onClick={() => navigate('/sales')} className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium">
            View all sales →
          </button>
        </Card>

        {/* Payment Methods */}
        <Card title="Payment Methods">
          {paymentMethods.length > 0 ? (
            <PieChartWidget data={paymentMethods} dataKey="total" nameKey="method" />
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No payment data</p>
          )}
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <Card title={`Low Stock Alerts (${lowStock.length})`}>
          {lowStock.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {lowStock.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-red-50 border border-red-100 rounded-lg text-sm">
                  <span className="font-medium text-red-800 truncate text-xs">{p.name}</span>
                  <span className="text-red-600 font-bold text-xs ml-2">{p.stock}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">All items well stocked</p>
          )}
          {lowStock.length > 0 && (
            <button onClick={() => navigate('/products')} className="mt-3 text-xs text-red-600 hover:text-red-700 font-medium">
              Manage inventory →
            </button>
          )}
        </Card>

        {/* Quick Stats */}
        <Card title="Business Snapshot">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{customerCount}</div>
              <div className="text-xs text-gray-500 mt-1">Registered Customers</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{summary?.totalTransactions || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Transactions (MTD)</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{summary?.lowStockCount || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Low Stock Items</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">{summary ? ((summary.totalSales - summary.totalExpenses) / (summary.totalSales || 1) * 100).toFixed(1) : 0}%</div>
              <div className="text-xs text-gray-500 mt-1">Profit Margin</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
