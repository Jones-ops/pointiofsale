const db = require('../config/database');

const reportModel = {
  async summary(from, to) {
    const params = [];
    let dateFilter = '';
    if (from) { dateFilter += ' AND s.created_at >= ?'; params.push(from); }
    if (to) { dateFilter += ' AND s.created_at <= ?'; params.push(to); }

    const totalSales = await db.one(
      `SELECT COALESCE(SUM(total_amount),0) as total FROM sales s WHERE s.payment_status != 'voided' ${dateFilter}`, params
    );
    const totalTransactions = await db.one(
      `SELECT COUNT(*) as c FROM sales s WHERE s.payment_status != 'voided' ${dateFilter}`, params
    );
    const totalExpenses = await db.one(
      `SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE 1=1 ${from ? ' AND expense_date >= ?' : ''} ${to ? ' AND expense_date <= ?' : ''}`,
      from && to ? [from, to] : from ? [from] : to ? [to] : []
    );
    const lowStock = await db.all('SELECT COUNT(*) as c FROM products WHERE active = 1 AND stock <= reorder_level');
    const topProducts = await db.all(
      `SELECT p.name, SUM(si.quantity) as qty, SUM(si.subtotal) as total
       FROM sale_items si JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.payment_status != 'voided' ${dateFilter}
       GROUP BY si.product_id ORDER BY total DESC LIMIT 5`, params
    );

    return {
      totalSales: Number(totalSales.total),
      totalTransactions: totalTransactions.c,
      totalExpenses: Number(totalExpenses.total),
      lowStockCount: lowStock.length > 0 ? lowStock[0].c : 0,
      topProducts,
    };
  },

  async dailySales(from, to) {
    let sql = `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as total
      FROM sales WHERE payment_status != 'voided'`;
    const params = [];
    if (from) { sql += ' AND created_at >= ?'; params.push(from); }
    if (to) { sql += ' AND created_at <= ?'; params.push(to); }
    sql += ' GROUP BY DATE(created_at) ORDER BY date ASC';
    return db.all(sql, params);
  },

  async categoryBreakdown(from, to) {
    let sql = `SELECT c.name as category, SUM(si.subtotal) as total
      FROM sale_items si JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE s.payment_status != 'voided'`;
    const params = [];
    if (from) { sql += ' AND s.created_at >= ?'; params.push(from); }
    if (to) { sql += ' AND s.created_at <= ?'; params.push(to); }
    sql += ' GROUP BY c.name ORDER BY total DESC';
    return db.all(sql, params);
  },

  async paymentMethods(from, to) {
    let sql = `SELECT payment_method as method, COUNT(*) as count, SUM(total_amount) as total
      FROM sales WHERE payment_status != 'voided'`;
    const params = [];
    if (from) { sql += ' AND created_at >= ?'; params.push(from); }
    if (to) { sql += ' AND created_at <= ?'; params.push(to); }
    sql += ' GROUP BY payment_method ORDER BY total DESC';
    return db.all(sql, params);
  },

  async inventoryValuation() {
    return db.all(
      `SELECT SUM(stock * cost_price) as total_cost, SUM(stock * selling_price) as total_retail,
        COUNT(*) as product_count, SUM(CASE WHEN stock <= reorder_level THEN 1 ELSE 0 END) as low_stock_count
       FROM products WHERE active = 1`
    );
  },

  async profitMargins(from, to) {
    let sql = `SELECT p.id, p.name, p.sku,
      SUM(si.quantity) as qty,
      SUM(si.subtotal) as revenue,
      SUM(si.cost_price * si.quantity) as cost,
      SUM(si.subtotal - (si.cost_price * si.quantity)) as profit,
      CASE WHEN SUM(si.subtotal) > 0 THEN ROUND((SUM(si.subtotal - (si.cost_price * si.quantity)) / SUM(si.subtotal)) * 100, 2) ELSE 0 END as margin
      FROM sale_items si JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.payment_status != 'voided'`;
    const params = [];
    if (from) { sql += ' AND s.created_at >= ?'; params.push(from); }
    if (to) { sql += ' AND s.created_at <= ?'; params.push(to); }
    sql += ' GROUP BY p.id ORDER BY profit DESC';
    return db.all(sql, params);
  },

  async exportCSV(from, to, type) {
    let rows;
    if (type === 'sales') {
      let sql = `SELECT s.receipt_no, s.created_at as date, c.name as customer, u.name as cashier,
        s.subtotal, s.discount_amount, s.tax_amount, s.total_amount, s.payment_method, s.payment_status
        FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.staff_id = u.id WHERE s.payment_status != 'voided'`;
      const params = [];
      if (from) { sql += ' AND s.created_at >= ?'; params.push(from); }
      if (to) { sql += ' AND s.created_at <= ?'; params.push(to); }
      sql += ' ORDER BY s.created_at DESC';
      rows = await db.all(sql, params);
    } else {
      rows = [];
    }

    if (!rows.length) return 'No data';
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))];
    return csv.join('\n');
  },
};

module.exports = reportModel;
