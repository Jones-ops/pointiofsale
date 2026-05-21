const db = require('../config/database');

exports.salesSummary = (req, res) => {
  const { from, to } = req.query;
  let params = [];
  let dateFilter = '';
  if (from && to) { dateFilter = 'WHERE created_at BETWEEN ? AND ?'; params = [from, to]; }
  else if (from) { dateFilter = 'WHERE created_at >= ?'; params = [from]; }
  else if (to) { dateFilter = 'WHERE created_at <= ?'; params = [to]; }

  const sales = db.one(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue,
    COALESCE(SUM(subtotal - discount_amount), 0) as gross
    FROM sales s ${dateFilter} AND (s.payment_status IS NULL OR s.payment_status != 'voided')`, params);
  const expenses = db.one(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses e ${dateFilter ? dateFilter.replace('created_at', 'e.expense_date') : ''}`, params);

  const cogs = db.one(`SELECT COALESCE(SUM(si.cost_price * si.quantity), 0) as total
    FROM sale_items si JOIN sales s ON si.sale_id = s.id
    WHERE (s.payment_status IS NULL OR s.payment_status != 'voided')${dateFilter ? ' AND ' + dateFilter.replace('WHERE ', '') : ''}`, params);

  res.json({
    total_sales: sales.count,
    total_revenue: sales.revenue,
    total_cogs: cogs.total,
    total_profit: sales.revenue - cogs.total - expenses.total,
    total_expenses: expenses.total,
  });
};

exports.dailySales = (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as revenue
    FROM sales WHERE (payment_status IS NULL OR payment_status != 'voided')`;
  const params = [];
  if (from && to) { sql += ' AND created_at BETWEEN ? AND ?'; params.push(from, to); }
  else if (from) { sql += ' AND created_at >= ?'; params.push(from); }
  else if (to) { sql += ' AND created_at <= ?'; params.push(to); }
  sql += ' GROUP BY DATE(created_at) ORDER BY date';
  res.json(db.all(sql, params));
};

exports.monthlySales = (req, res) => {
  const { year } = req.query;
  const y = year || new Date().getFullYear();
  const data = db.all(
    `SELECT strftime('%m', created_at) as month, COUNT(*) as count, SUM(total_amount) as revenue
     FROM sales WHERE (payment_status IS NULL OR payment_status != 'voided') AND strftime('%Y', created_at) = ?
     GROUP BY strftime('%m', created_at) ORDER BY month`, [String(y)]
  );
  res.json(data);
};

exports.profitLoss = (req, res) => {
  const { from, to } = req.query;
  const params = [from, to];

  const revenue = db.one(`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE (payment_status IS NULL OR payment_status != 'voided') AND created_at BETWEEN ? AND ?`, params);
  const cogs = db.one(`SELECT COALESCE(SUM(si.cost_price * si.quantity), 0) as total FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE (s.payment_status IS NULL OR s.payment_status != 'voided') AND s.created_at BETWEEN ? AND ?`, params);
  const expenses = db.one(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date BETWEEN ? AND ?`, params);

  res.json({
    revenue: revenue.total,
    cogs: cogs.total,
    gross_profit: revenue.total - cogs.total,
    expenses: expenses.total,
    net_profit: revenue.total - cogs.total - expenses.total,
  });
};

exports.inventoryValuation = (req, res) => {
  const data = db.all(
    `SELECT p.id, p.name, p.sku, p.stock, p.cost_price, (p.stock * p.cost_price) as value
     FROM products p WHERE p.active = 1 ORDER BY value DESC`
  );
  const total = data.reduce((s, r) => s + r.value, 0);
  res.json({ items: data, total_value: total });
};

exports.taxReport = (req, res) => {
  const { from, to } = req.query;
  const data = db.all(
    `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(subtotal) as taxable_sales, SUM(tax_amount) as tax_collected
     FROM sales WHERE (payment_status IS NULL OR payment_status != 'voided') AND created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at) ORDER BY date`, [from, to]
  );
  const totals = db.one(
    `SELECT COUNT(*) as count, COALESCE(SUM(subtotal), 0) as taxable_sales, COALESCE(SUM(tax_amount), 0) as tax_collected
     FROM sales WHERE (payment_status IS NULL OR payment_status != 'voided') AND created_at BETWEEN ? AND ?`, [from, to]
  );
  res.json({ data, totals });
};

exports.salesByCategory = (req, res) => {
  const { from, to } = req.query;
  const data = db.all(
    `SELECT c.id, c.name, COUNT(*) as count, SUM(si.subtotal) as revenue
     FROM sale_items si JOIN products p ON si.product_id = p.id
     JOIN categories c ON p.category_id = c.id
     JOIN sales s ON si.sale_id = s.id
     WHERE (s.payment_status IS NULL OR s.payment_status != 'voided') AND s.created_at BETWEEN ? AND ?
     GROUP BY c.id ORDER BY revenue DESC`, [from, to]
  );
  res.json(data);
};

exports.paymentMethods = (req, res) => {
  const { from, to } = req.query;
  const data = db.all(
    `SELECT p.method, COUNT(*) as count, SUM(p.amount) as total
     FROM payments p JOIN sales s ON p.sale_id = s.id
     WHERE (s.payment_status IS NULL OR s.payment_status != 'voided') AND s.created_at BETWEEN ? AND ?
     GROUP BY p.method ORDER BY total DESC`, [from, to]
  );
  res.json(data);
};

exports.profitMargins = (req, res) => {
  const data = db.all(
    `SELECT p.id, p.name, p.sku, p.cost_price, p.selling_price,
      (p.selling_price - p.cost_price) as margin,
      CASE WHEN p.cost_price > 0 THEN ROUND(((p.selling_price - p.cost_price) / p.cost_price) * 100, 2) ELSE 0 END as margin_pct
     FROM products p WHERE p.active = 1 ORDER BY margin_pct DESC`
  );
  res.json(data);
};
