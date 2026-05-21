import Card from '../ui/Card';

export default function SaleDetail({ sale }) {
  const currency = (v) => new Intl.NumberFormat().format(Number(v));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-xs text-gray-500">Receipt No</span>
          <div className="text-sm font-medium">{sale.receipt_no}</div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Date</span>
          <div className="text-sm font-medium">{new Date(sale.created_at).toLocaleString()}</div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Cashier</span>
          <div className="text-sm font-medium">{sale.staff_name}</div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Customer</span>
          <div className="text-sm font-medium">{sale.customer_name || 'Walk-in'}</div>
        </div>
      </div>

      <Card title="Items">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Item</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2">{item.product_name || `#${item.product_id}`}</td>
                <td className="py-2">{currency(item.unit_price)}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2 text-right">{currency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{currency(sale.subtotal)}</span></div>
          {sale.discount_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-500">-{currency(sale.discount_amount)}</span></div>}
          {sale.tax_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{currency(sale.tax_amount)}</span></div>}
          <div className="flex justify-between font-bold text-lg border-t pt-1"><span>Total</span><span>{currency(sale.total_amount)}</span></div>
          <div className="flex justify-between text-xs text-gray-500"><span>Payment</span><span className="capitalize">{sale.payment_method}</span></div>
          <div className="flex justify-between text-xs text-gray-500"><span>Status</span><span className={`capitalize ${sale.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{sale.payment_status}</span></div>
        </div>
      </div>
    </div>
  );
}
