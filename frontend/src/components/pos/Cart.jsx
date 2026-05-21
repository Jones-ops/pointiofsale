import { useState } from 'react';
import { TrashIcon, MinusIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function Cart({ items, onUpdateQty, onUpdatePrice, onUpdateDiscount, onRemove, onClear }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal] = useState('');

  const startEdit = (idx, field, currentVal) => {
    setEditIdx(idx);
    setEditField(field);
    setEditVal(String(currentVal));
  };

  const saveEdit = () => {
    if (editIdx === null) return;
    if (editField === 'price') onUpdatePrice(editIdx, Number(editVal) || 0);
    if (editField === 'discount') onUpdateDiscount(editIdx, Number(editVal) || 0);
    setEditIdx(null);
    setEditField(null);
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.discount || 0), 0);
  const total = subtotal - totalDiscount;

  return (
    <div className="w-96 bg-white border-l flex flex-col">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold">Cart ({items.length})</h3>
        {items.length > 0 && (
          <button onClick={onClear} className="text-xs text-red-500 hover:text-red-700">Clear</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">Cart is empty</div>
        ) : items.map((item, idx) => {
          const lineTotal = item.price * item.quantity - (item.discount || 0);
          const hasPricelist = item.effective_price && item.effective_price < item.selling_price;

          return (
            <div key={idx} className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="flex items-center gap-1">
                    {hasPricelist ? (
                      <>
                        <span className="text-xs line-through text-gray-400">{new Intl.NumberFormat().format(item.selling_price)}</span>
                        <span className="text-xs text-green-600 font-medium">{new Intl.NumberFormat().format(item.price)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">{new Intl.NumberFormat().format(item.price)} each</span>
                    )}
                    {editIdx === idx && editField === 'price' ? (
                      <input type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)}
                        className="w-16 text-xs px-1 border rounded" autoFocus
                        onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                    ) : (
                      <button onClick={() => startEdit(idx, 'price', item.price)} className="text-gray-300 hover:text-gray-500">
                        <PencilIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {item.discount > 0 && (
                    <div className="text-xs text-red-500">Discount: -{new Intl.NumberFormat().format(item.discount)}</div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdateQty(idx, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs">
                    <MinusIcon className="w-3 h-3" />
                  </button>
                  {editIdx === idx && editField === 'qty' ? (
                    <input type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)}
                      className="w-10 text-center text-sm border rounded" autoFocus
                      onBlur={() => { onUpdateQty(idx, Number(editVal) || 1); setEditIdx(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateQty(idx, Number(editVal) || 1); setEditIdx(null); } }} />
                  ) : (
                    <span className="w-8 text-center text-sm font-medium cursor-pointer" onClick={() => startEdit(idx, 'qty', item.quantity)}>
                      {item.quantity}
                    </span>
                  )}
                  <button onClick={() => onUpdateQty(idx, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs">
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-sm font-semibold w-20 text-right">
                  {new Intl.NumberFormat().format(lineTotal)}
                </div>
                <button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {editIdx === idx && editField === 'discount' ? (
                  <input type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)}
                    className="w-24 text-xs px-1 border rounded" autoFocus
                    placeholder="Discount amount"
                    onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                ) : (
                  <button onClick={() => startEdit(idx, 'discount', item.discount || 0)} className="text-xs text-blue-500 hover:text-blue-700">
                    {item.discount > 0 ? `Disc: ${new Intl.NumberFormat().format(item.discount)}` : '+ Discount'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{new Intl.NumberFormat().format(subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-red-500">
            <span>Discount</span>
            <span>-{new Intl.NumberFormat().format(totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold mt-1">
          <span>Total</span>
          <span>{new Intl.NumberFormat().format(total)}</span>
        </div>
      </div>
    </div>
  );
}
