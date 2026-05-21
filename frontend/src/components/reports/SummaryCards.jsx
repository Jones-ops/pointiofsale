import { CurrencyDollarIcon, ShoppingCartIcon, CreditCardIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function SummaryCards({ data, period }) {
  if (!data) return null;
  const profit = data.totalSales - data.totalExpenses;
  const cards = [
    { label: 'Revenue', value: data.totalSales, icon: CurrencyDollarIcon, color: 'primary' },
    { label: 'Transactions', value: data.totalTransactions, icon: ShoppingCartIcon, suffix: '', color: 'emerald' },
    { label: 'Expenses', value: data.totalExpenses, icon: CreditCardIcon, color: 'orange' },
    { label: 'Net Profit', value: profit, icon: ChartBarIcon, color: profit >= 0 ? 'green' : 'red' },
  ];
  const colorMap = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200 [&_svg]:text-primary-500',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 [&_svg]:text-emerald-500',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 [&_svg]:text-orange-500',
    green: 'bg-green-50 text-green-700 border-green-200 [&_svg]:text-green-500',
    red: 'bg-red-50 text-red-700 border-red-200 [&_svg]:text-red-500',
  };
  const fmt = (v) => new Intl.NumberFormat().format(Number(v || 0).toFixed(2));
  return (
    <div>
      {period && <p className="text-xs text-gray-400 mb-3">{period}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-xl border p-4 ${colorMap[card.color]} relative overflow-hidden`}>
              <Icon className="w-5 h-5 opacity-40 absolute right-3 top-3" />
              <div className="text-xs font-medium opacity-75">{card.label}</div>
              <div className="text-2xl font-bold mt-1 tracking-tight">
                {card.suffix === '' ? card.value : fmt(card.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
