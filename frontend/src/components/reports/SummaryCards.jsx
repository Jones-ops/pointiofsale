export default function SummaryCards({ data }) {
  if (!data) return null;
  const cards = [
    { label: 'Total Sales', value: data.total_sales, color: 'blue' },
    { label: 'Revenue', value: new Intl.NumberFormat().format(data.total_revenue), color: 'green' },
    { label: 'Profit', value: new Intl.NumberFormat().format(data.total_profit), color: data.total_profit >= 0 ? 'green' : 'red' },
    { label: 'Expenses', value: new Intl.NumberFormat().format(data.total_expenses), color: 'orange' },
  ];
  const colors = { blue: 'bg-blue-50 text-blue-700 border-blue-200', green: 'bg-green-50 text-green-700 border-green-200', red: 'bg-red-50 text-red-700 border-red-200', orange: 'bg-orange-50 text-orange-700 border-orange-200' };
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-4 ${colors[card.color]}`}>
          <div className="text-xs font-medium opacity-75">{card.label}</div>
          <div className="text-2xl font-bold mt-1">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
