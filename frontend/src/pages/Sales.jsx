import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Pagination from '../components/common/Pagination';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SaleDetail from '../components/sales/SaleDetail';
import ReturnModal from '../components/sales/ReturnModal';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showReturn, setShowReturn] = useState(false);
  const [returnSale, setReturnSale] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/sales', { params: { page, limit: 20 } })
      .then((r) => { setSales(r.data.data); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const viewDetail = async (sale) => {
    const { data } = await api.get(`/sales/${sale.id}`);
    setSelected(data);
  };

  const printReceipt = (id) => {
    window.open(`/api/sales/${id}/receipt`, '_blank');
  };

  const handleReturn = async () => {
    if (!selected) return;
    // Reload to get full details with items
    const { data } = await api.get(`/sales/${selected.id}`);
    setReturnSale(data);
    setShowReturn(true);
  };

  const onReturnComplete = () => {
    setShowReturn(false);
    setReturnSale(null);
    setSelected(null);
    // Reload sales list
    api.get('/sales', { params: { page, limit: 20 } })
      .then((r) => { setSales(r.data.data); setTotal(r.data.total); })
      .catch(() => {});
  };

  const currency = (v) => new Intl.NumberFormat().format(Number(v));

  const columns = [
    { key: 'receipt_no', label: 'Receipt' },
    { key: 'customer_name', label: 'Customer', render: (v) => v || 'Walk-in' },
    { key: 'staff_name', label: 'Cashier' },
    { key: 'total_amount', label: 'Total', render: (v) => currency(v) },
    { key: 'payment_method', label: 'Payment', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'payment_status', label: 'Status', render: (v) => <span className={`capitalize font-medium ${v === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{v}</span> },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => viewDetail(row)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => printReceipt(row.id)}>Print</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card title={`Sales (${total})`}>
        <Table columns={columns} data={sales} loading={loading} onRowClick={viewDetail} />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </Card>

      <Modal open={!!selected && !showReturn} onClose={() => setSelected(null)} title="Sale Details" size="xl">
        {selected && <SaleDetail sale={selected} />}
        <div className="mt-4 flex justify-end gap-2">
          {selected?.payment_status === 'paid' && !selected.parent_sale_id && (
            <Button variant="secondary" onClick={handleReturn}>Process Return</Button>
          )}
          <Button onClick={() => printReceipt(selected?.id)}>Print Receipt</Button>
        </div>
      </Modal>

      <ReturnModal
        open={showReturn}
        sale={returnSale}
        onClose={() => { setShowReturn(false); setReturnSale(null); }}
        onComplete={onReturnComplete}
      />
    </div>
  );
}
