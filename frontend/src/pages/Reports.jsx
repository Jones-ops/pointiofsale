import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import SummaryCards from '../components/reports/SummaryCards';
import { BarChartWidget, PieChartWidget } from '../components/reports/ReportChart';

export default function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [summary, setSummary] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [profitMargins, setProfitMargins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/sales-summary', { params: { from: monthStart, to: today } }),
      api.get('/reports/daily-sales', { params: { from: monthStart, to: today } }),
      api.get('/reports/sales-by-category', { params: { from: monthStart, to: today } }),
      api.get('/reports/payment-methods', { params: { from: monthStart, to: today } }),
      api.get('/reports/profit-loss', { params: { from: monthStart, to: today } }),
      api.get('/reports/inventory-valuation'),
      api.get('/reports/profit-margins'),
    ]).then(([s, d, c, p, pl, iv, pm]) => {
      setSummary(s.data);
      setDailySales(d.data);
      setCategorySales(c.data);
      setPaymentMethods(p.data);
      setProfitLoss(pl.data);
      setInventoryValue(Array.isArray(iv.data) ? iv.data[0] : iv.data);
      setProfitMargins(pm.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const currency = (v) => new Intl.NumberFormat().format(Number(v));

  if (loading) return <div className="text-center py-12 text-gray-500">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <SummaryCards data={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Profit & Loss">
          {profitLoss && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Revenue</span><span className="font-medium">{currency(profitLoss.revenue)}</span></div>
              <div className="flex justify-between"><span>Cost of Goods Sold</span><span className="font-medium">-{currency(profitLoss.cogs)}</span></div>
              <div className="flex justify-between border-t pt-1"><span>Gross Profit</span><span className="font-medium">{currency(profitLoss.gross_profit)}</span></div>
              <div className="flex justify-between"><span>Expenses</span><span className="font-medium">-{currency(profitLoss.expenses)}</span></div>
              <div className="flex justify-between border-t pt-1 text-base font-bold"><span>Net Profit</span><span className={profitLoss.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>{currency(profitLoss.net_profit)}</span></div>
            </div>
          )}
        </Card>

        <Card title="Inventory Valuation">
          {inventoryValue && (
            <div>
              <div className="text-2xl font-bold mb-2">{currency(inventoryValue.total_retail || inventoryValue.total_value)}</div>
              <div className="text-xs text-gray-500">{inventoryValue.product_count || inventoryValue.items?.length || 0} active products</div>
              {inventoryValue.low_stock_count > 0 && (
                <div className="text-xs text-orange-600 mt-1">{inventoryValue.low_stock_count} low stock items</div>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Sales Trend">
          <BarChartWidget data={dailySales} title="Daily Sales" />
        </Card>
        <Card title="Sales by Category">
          <PieChartWidget data={categorySales} dataKey="revenue" nameKey="name" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Payment Methods">
          <PieChartWidget data={paymentMethods} dataKey="total" nameKey="method" />
        </Card>
        <Card title="Profit Margins">
          <div className="max-h-60 overflow-y-auto space-y-1">
            {profitMargins.slice(0, 20).map((p) => (
              <div key={p.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                <span className="truncate">{p.name}</span>
                <span className={p.margin_pct >= 0 ? 'text-green-600' : 'text-red-600'}>{p.margin_pct}% ({currency(p.margin)})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
