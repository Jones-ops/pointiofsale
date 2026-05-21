import { useState, useEffect } from 'react';
import api from '../../services/api';
import Input from '../ui/Input';

export default function ProductGrid({ onAddToCart, categoryFilter, customerId }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { search, category_id: categoryFilter || undefined, active: true };
    if (customerId) params.customer_id = customerId;
    api.get('/products', { params })
      .then((r) => setProducts(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, categoryFilter, customerId]);

  const priceToShow = (p) => {
    const price = p.effective_price || p.selling_price;
    return new Intl.NumberFormat().format(price);
  };

  return (
    <div className="flex-1">
      <div className="mb-3">
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? (
        <div className="text-center text-sm text-gray-500 py-8">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-8">No products found</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => onAddToCart(p)}
              disabled={p.stock <= 0}
              className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:shadow-md hover:border-primary-200 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{p.sku}</div>
              <div className="text-sm font-bold text-primary-600 mt-1">
                {p.effective_price && p.effective_price < p.selling_price ? (
                  <span>
                    <span className="line-through text-gray-400 text-xs mr-1">{new Intl.NumberFormat().format(p.selling_price)}</span>
                    {priceToShow(p)}
                  </span>
                ) : priceToShow(p)}
              </div>
              <div className={`text-xs mt-0.5 ${p.stock <= (p.reorder_level || 0) ? 'text-red-500' : 'text-green-600'}`}>
                Stock: {p.stock}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
