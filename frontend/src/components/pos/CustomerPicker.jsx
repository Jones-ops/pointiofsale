import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import api from '../../services/api';

export default function CustomerPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    api.get('/customers', { params: { search: query, limit: 20 } })
      .then((r) => setCustomers(r.data.data))
      .catch(() => {});
  }, [query]);

  const filtered = query ? customers : customers.filter(c => !c.is_walk_in);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
      <Combobox value={value} onChange={onChange}>
        <div className="relative">
          <Combobox.Input
            className="w-full border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            displayValue={(c) => c ? `${c.name}${c.phone ? ` (${c.phone})` : ''}${c.loyalty_points ? ` - ${c.loyalty_points}pts` : ''}` : 'Walk-in Customer'}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers..."
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
          </Combobox.Button>
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg text-sm">
            <Combobox.Option value={{ id: null, name: 'Walk-in Customer', is_walk_in: true }} className="cursor-pointer px-3 py-2 hover:bg-blue-50">Walk-in Customer</Combobox.Option>
            {filtered.map((c) => (
              <Combobox.Option key={c.id} value={c} className="cursor-pointer px-3 py-2 hover:bg-blue-50">
                <div className="flex justify-between">
                  <span>{c.name} {c.phone ? `(${c.phone})` : ''}</span>
                  {c.loyalty_points > 0 && <span className="text-xs text-green-600">{c.loyalty_points} pts</span>}
                </div>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
}
