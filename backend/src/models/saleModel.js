const db = require('../config/database');
const productModel = require('./productModel');
const loyaltyModel = require('./loyaltyModel');

const saleModel = {
  findAll({ page = 1, limit = 50, from, to, customer_id, staff_id } = {}) {
    let sql = `SELECT s.*, c.name as customer_name, u.name as staff_name
      FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.staff_id = u.id WHERE 1=1`;
    const params = [];
    if (from) { sql += ' AND s.created_at >= ?'; params.push(from); }
    if (to) { sql += ' AND s.created_at <= ?'; params.push(to || '9999-12-31'); }
    if (customer_id) { sql += ' AND s.customer_id = ?'; params.push(customer_id); }
    if (staff_id) { sql += ' AND s.staff_id = ?'; params.push(staff_id); }
    sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return db.all(sql, params);
  },

  count({ from, to, customer_id, staff_id } = {}) {
    let sql = 'SELECT COUNT(*) as c FROM sales WHERE 1=1';
    const params = [];
    if (from) { sql += ' AND created_at >= ?'; params.push(from); }
    if (to) { sql += ' AND created_at <= ?'; params.push(to); }
    if (customer_id) { sql += ' AND customer_id = ?'; params.push(customer_id); }
    if (staff_id) { sql += ' AND staff_id = ?'; params.push(staff_id); }
    return db.one(sql, params).c;
  },

  findById(id) {
    const sale = db.one(
      `SELECT s.*, c.name as customer_name, u.name as staff_name
       FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.staff_id = u.id WHERE s.id = ?`, [id]
    );
    if (!sale) return null;
    sale.items = db.all(
      'SELECT si.*, p.name as product_name, p.sku FROM sale_items si LEFT JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?', [id]
    );
    sale.payments = db.all('SELECT * FROM payments WHERE sale_id = ?', [id]);
    return sale;
  },

  findByReceiptNo(receiptNo) {
    const sale = db.one('SELECT id FROM sales WHERE receipt_no = ?', [receiptNo]);
    return sale ? saleModel.findById(sale.id) : null;
  },

  create({ customer_id, staff_id, items, payments: pments, notes, session_id, redeem_points }) {
    const session_id_val = session_id || null;
    const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let subtotal = 0;
    let totalDiscount = 0;
    const saleItems = items.map(item => {
      const product = productModel.findById(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      const lineTotal = product.selling_price * item.quantity;
      const lineDiscount = item.discount || 0;
      subtotal += lineTotal;
      totalDiscount += lineDiscount;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.selling_price,
        cost_price: product.cost_price,
        discount: lineDiscount,
        subtotal: lineTotal - lineDiscount,
      };
    });

    const settings = db.one('SELECT * FROM settings WHERE id = 1');
    const taxRate = settings ? settings.tax_rate : 0;
    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const totalAmount = taxableAmount + taxAmount;

    const ptsRedeemed = Math.min(Number(redeem_points) || 0, totalAmount);

    const result = db.run(
      `INSERT INTO sales (receipt_no, customer_id, staff_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, notes, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [receiptNo, customer_id || null, staff_id, subtotal, taxAmount, totalDiscount, totalAmount,
       pments && pments.length > 0 ? pments[0].method : 'cash', 'paid', notes || null, session_id_val]
    );

    const saleId = result.lastInsertRowid;

    for (const si of saleItems) {
      db.run(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, discount, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [saleId, si.product_id, si.quantity, si.unit_price, si.cost_price, si.discount, si.subtotal]
      );
      productModel.adjustStock(si.product_id, si.quantity, 'sale', receiptNo, null, staff_id);
    }

    if (pments && pments.length > 0) {
      for (const p of pments) {
        db.run('INSERT INTO payments (sale_id, amount, method, reference) VALUES (?, ?, ?, ?)',
          [saleId, p.amount, p.method, p.reference || null]);
      }
    } else {
      db.run('INSERT INTO payments (sale_id, amount, method, reference) VALUES (?, ?, ?, ?)',
        [saleId, totalAmount, 'cash', null]);
    }

    // Process loyalty points redemption
    let finalTotal = totalAmount;
    if (ptsRedeemed > 0 && customer_id) {
      try {
        const ptsDiscount = loyaltyModel.redeemPoints(customer_id, saleId, ptsRedeemed);
        finalTotal = totalAmount - ptsDiscount;
        totalDiscount += ptsDiscount;
        db.run('UPDATE sales SET discount_amount = ?, total_amount = ? WHERE id = ?', [totalDiscount, finalTotal, saleId]);
      } catch (e) { /* skip points redemption on error */ }
    }

    // Award loyalty points (on the final total)
    if (customer_id) {
      loyaltyModel.earnPoints(customer_id, saleId, finalTotal);
    }

    return saleModel.findById(saleId);
  },

  returnItems(saleId, items) {
    const originalSale = saleModel.findById(saleId);
    if (!originalSale) throw new Error('Original sale not found');
    if (originalSale.payment_status === 'voided') throw new Error('Cannot return a voided sale');

    const receiptNo = `RET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const staffId = items[0]?.staff_id || null;

    let subtotal = 0;
    const returnItems = [];

    for (const ri of items) {
      const origItem = originalSale.items.find(i => i.id === ri.sale_item_id);
      if (!origItem) throw new Error(`Sale item ${ri.sale_item_id} not found`);
      if (ri.quantity > origItem.quantity) throw new Error(`Cannot return more than ${origItem.quantity} of ${origItem.product_name}`);

      const returnSubtotal = origItem.unit_price * ri.quantity;
      subtotal += returnSubtotal;
      returnItems.push({
        product_id: origItem.product_id,
        quantity: -ri.quantity,
        unit_price: origItem.unit_price,
        cost_price: origItem.cost_price,
        discount: 0,
        subtotal: -returnSubtotal,
        return_reason: ri.reason || null,
        original_sale_item_id: ri.sale_item_id,
      });
    }

    const totalAmount = subtotal;
    const paymentMethod = originalSale.payment_method;

    const result = db.run(
      `INSERT INTO sales (receipt_no, customer_id, staff_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, notes, parent_sale_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [receiptNo, originalSale.customer_id, staffId, subtotal, 0, 0, totalAmount,
       paymentMethod, 'paid', null, saleId]
    );

    const returnSaleId = result.lastInsertRowid;

    for (const ri of returnItems) {
      db.run(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, discount, subtotal, return_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [returnSaleId, ri.product_id, ri.quantity, ri.unit_price, ri.cost_price, ri.discount, ri.subtotal, ri.return_reason]
      );
      productModel.adjustStock(ri.product_id, Math.abs(ri.quantity), 'return', receiptNo, ri.return_reason || 'Return', staffId);
    }

    db.run('INSERT INTO payments (sale_id, amount, method) VALUES (?, ?, ?)',
      [returnSaleId, totalAmount, paymentMethod]);

    if (originalSale.customer_id) {
      loyaltyModel.earnPoints(originalSale.customer_id, returnSaleId, -totalAmount);
    }

    return saleModel.findById(returnSaleId);
  },

  voidSale(id) {
    const sale = saleModel.findById(id);
    if (!sale) throw new Error('Sale not found');
    db.run("UPDATE sales SET payment_status = 'voided' WHERE id = ?", [id]);
    for (const item of sale.items) {
      productModel.adjustStock(item.product_id, item.quantity, 'return', `VOID-${sale.receipt_no}`, 'Sale voided', null);
    }
    return saleModel.findById(id);
  },
};

module.exports = saleModel;
