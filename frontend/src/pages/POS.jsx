import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import ProductGrid from '../components/pos/ProductGrid';
import Cart from '../components/pos/Cart';
import PaymentModal from '../components/pos/PaymentModal';
import CustomerPicker from '../components/pos/CustomerPicker';
import SessionBar from '../components/pos/SessionBar';
import SessionOpen from '../components/pos/SessionOpen';
import SessionClose from '../components/pos/SessionClose';
import CashMoveModal from '../components/pos/CashMoveModal';
import ReturnModal from '../components/sales/ReturnModal';
import Select from '../components/ui/Select';

export default function POS() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [walkInName, setWalkInName] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [orderDiscount, setOrderDiscount] = useState({ type: 'percent', value: 0 });

  // Session state
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showSessionClose, setShowSessionClose] = useState(false);
  const [showCashMove, setShowCashMove] = useState(false);
  const [cashMoveType, setCashMoveType] = useState('in');
  const [closingSession, setClosingSession] = useState(false);

  // Return mode
  const [returnMode, setReturnMode] = useState(false);
  const [returnReceiptNo, setReturnReceiptNo] = useState('');
  const [returnSale, setReturnSale] = useState(null);
  const [showReturn, setShowReturn] = useState(false);

  // Barcode scanner
  const [barcode, setBarcode] = useState('');
  const barcodeRef = useRef(null);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
    checkSession();
  }, []);

  const checkSession = async () => {
    setSessionLoading(true);
    try {
      const { data } = await api.get('/pos/sessions/active');
      setSession(data);
    } catch (e) { setSession(null); }
    setSessionLoading(false);
  };

  const openSession = async (openingCash) => {
    try {
      const { data } = await api.post('/pos/sessions', { opening_cash: openingCash });
      setSession(data);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to open session');
    }
  };

  const closeSession = async (closingCash, notes) => {
    setClosingSession(true);
    try {
      await api.post(`/pos/sessions/${session.id}/close`, { closing_cash: closingCash, notes });
      setSession(null);
      setShowSessionClose(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to close session');
    }
    setClosingSession(false);
  };

  const handleCashMove = async ({ type, amount, reason }) => {
    try {
      await api.post(`/pos/sessions/${session.id}/cash-move`, { type, amount, reason });
      const { data } = await api.get('/pos/sessions/active');
      setSession(data);
      setShowCashMove(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to record cash move');
    }
  };

  const loadReturnSale = async () => {
    if (!returnReceiptNo.trim()) return;
    try {
      const { data: salesData } = await api.get('/sales', { params: { limit: 1 } });
      const { data } = await api.get(`/sales/${returnReceiptNo}`);
      if (data.parent_sale_id) {
        alert('This is already a return receipt. Select the original sale.');
        return;
      }
      setReturnSale(data);
      setShowReturn(true);
    } catch (e) {
      try {
        const { data } = await api.get(`/sales/${returnReceiptNo}`);
        if (data.parent_sale_id) {
          alert('This is already a return receipt.');
          return;
        }
        setReturnSale(data);
        setShowReturn(true);
      } catch (e2) {
        alert('Sale not found. Check the receipt number.');
      }
    }
  };

  const addToCart = useCallback((product) => {
    if (!session) return;
    setCart((prev) => {
      const existing = prev.findIndex((i) => i.id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + 1 };
        return updated;
      }
      return [...prev, { ...product, quantity: 1, price: product.effective_price || product.selling_price }];
    });
  }, [session]);

  const handleBarcode = async () => {
    const code = barcode.trim();
    if (!code) return;
    try {
      const { data } = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
      addToCart(data);
      setBarcode('');
      barcodeRef.current?.focus();
    } catch (e) {
      alert('Product not found for barcode: ' + code);
      setBarcode('');
    }
  };

  const updateQty = (idx, qty) => {
    if (qty <= 0) return setCart((prev) => prev.filter((_, i) => i !== idx));
    setCart((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: qty };
      return updated;
    });
  };

  const updatePrice = (idx, price) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], price: price };
      return updated;
    });
  };

  const updateDiscount = (idx, discount) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], discount: discount };
      return updated;
    });
  };

  const removeItem = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalLineDiscount = cart.reduce((s, i) => s + (i.discount || 0), 0);

  let orderDiscountAmount = 0;
  if (orderDiscount && Number(orderDiscount.value) > 0) {
    const afterLineDisc = subtotal - totalLineDiscount;
    orderDiscountAmount = orderDiscount.type === 'percent'
      ? afterLineDisc * (Number(orderDiscount.value) / 100)
      : Math.min(Number(orderDiscount.value), afterLineDisc);
  }
  const total = subtotal - totalLineDiscount - orderDiscountAmount;

  const getCustomerId = async () => {
    if (customer?.id) return customer.id;
    const name = walkInName.trim();
    if (!name) return null;
    const { data } = await api.post('/customers', {
      name, is_walk_in: true, notes: 'Auto-created walk-in',
    });
    return data.id;
  };

  const handlePaymentComplete = async (payment) => {
    setSaving(true);
    try {
      const customer_id = await getCustomerId();
      const { data } = await api.post('/sales', {
        items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity, discount: i.discount || 0 })),
        payments: payment.payments,
        customer_id,
        notes: note || null,
        session_id: session?.id || null,
        redeem_points: payment.redeemPoints || 0,
        order_discount: Number(orderDiscount.value) > 0 ? orderDiscount : undefined,
      });
      const pdfRes = await api.get(`/sales/${data.id}/receipt`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(pdfRes.data);
      window.open(blobUrl, '_blank');
      setCart([]);
      setCustomer(null);
      setWalkInName('');
      setNote('');
      setOrderDiscount({ type: 'percent', value: 0 });
      setShowPayment(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete sale');
    } finally {
      setSaving(false);
    }
  };

  const catOptions = [{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))];

  if (sessionLoading) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading session...</div>;
  }

  if (!session) {
    return <SessionOpen onOpen={openSession} loading={false} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <SessionBar
        session={session}
        onClose={() => setShowSessionClose(true)}
        onCashMove={(type) => { setCashMoveType(type); setShowCashMove(true); }}
      />

      {returnMode ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Return Mode</h2>
            <p className="text-sm text-gray-500 mb-4">Enter the receipt number to process a return</p>
            <input
              type="text"
              placeholder="Receipt number..."
              value={returnReceiptNo}
              onChange={(e) => setReturnReceiptNo(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-lg text-center mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && loadReturnSale()}
            />
            <div className="flex gap-3">
              <button
                onClick={loadReturnSale}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Find Receipt
              </button>
              <button
                onClick={() => { setReturnMode(false); setReturnReceiptNo(''); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <Select value={categoryFilter} onChange={setCategoryFilter} options={catOptions} className="w-48" />
              <input
                ref={barcodeRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleBarcode(); }}
                placeholder="Scan barcode..."
                className="w-44 px-3 py-1.5 border rounded-lg text-sm"
              />
              <span className="text-sm text-gray-500">{cart.length} item(s) in cart | Total: {new Intl.NumberFormat().format(total)}</span>
              <div className="flex-1" />
              <button
                onClick={() => setReturnMode(true)}
                className="text-xs px-3 py-1.5 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50"
              >
                Returns
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProductGrid onAddToCart={addToCart} categoryFilter={categoryFilter} customerId={customer?.id} />
            </div>
          </div>

          <Cart
            items={cart}
            onUpdateQty={updateQty}
            onUpdatePrice={updatePrice}
            onUpdateDiscount={updateDiscount}
            onRemove={removeItem}
            onClear={() => { setCart([]); setOrderDiscount({ type: 'percent', value: 0 }); }}
            orderDiscount={orderDiscount}
            onOrderDiscountChange={setOrderDiscount}
          />
        </div>
      )}

      <div className="bg-white border-t p-3 flex items-center gap-4 no-print">
        <div className="flex-1 max-w-xs">
          <CustomerPicker value={customer} onChange={(c) => { setCustomer(c); if (c?.id) setWalkInName(''); }} />
          {!customer?.id && (
            <input
              type="text"
              placeholder="Walk-in name (optional)..."
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              className="mt-1 w-full px-3 py-1.5 border rounded-lg text-sm"
            />
          )}
        </div>
        <input
          type="text"
          placeholder="Notes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 max-w-xs px-3 py-2 border rounded-lg text-sm"
        />
        <button
          onClick={() => setShowPayment(true)}
          disabled={cart.length === 0 || saving || returnMode}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? 'Processing...' : `Charge ${new Intl.NumberFormat().format(total)}`}
        </button>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={total}
        customerId={customer?.id}
        onComplete={handlePaymentComplete}
      />

      <SessionClose
        open={showSessionClose}
        session={session}
        onClose={() => setShowSessionClose(false)}
        onConfirm={closeSession}
        loading={closingSession}
      />

      <CashMoveModal
        open={showCashMove}
        defaultType={cashMoveType}
        onClose={() => setShowCashMove(false)}
        onConfirm={handleCashMove}
      />

      <ReturnModal
        open={showReturn}
        sale={returnSale}
        onClose={() => { setShowReturn(false); setReturnSale(null); setReturnMode(false); }}
        onComplete={() => { setShowReturn(false); setReturnSale(null); setReturnMode(false); }}
      />
    </div>
  );
}
