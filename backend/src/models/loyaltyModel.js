const db = require('../config/database');

const loyaltyModel = {
  getRules() {
    return db.one('SELECT * FROM loyalty_rules WHERE id = 1') || { points_per_currency: 1, min_order: 0, max_discount_percent: 100, is_active: 1 };
  },

  updateRules(data) {
    const fields = {};
    for (const k of ['points_per_currency', 'min_order', 'max_discount_percent', 'is_active']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return loyaltyModel.getRules();
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.run(`UPDATE loyalty_rules SET ${sets} WHERE id = 1`, Object.values(fields));
    return loyaltyModel.getRules();
  },

  earnPoints(customerId, saleId, amountSpent) {
    if (!customerId) return 0;
    const rules = loyaltyModel.getRules();
    if (!rules.is_active) return 0;
    if (amountSpent < rules.min_order) return 0;

    const points = Math.floor(amountSpent * rules.points_per_currency);
    if (points <= 0) return 0;

    db.run(
      'INSERT INTO loyalty_transactions (customer_id, sale_id, points, type, reference) VALUES (?, ?, ?, ?, ?)',
      [customerId, saleId, points, 'earn', 'Sale completed']
    );
    db.run('UPDATE customers SET loyalty_points = COALESCE(loyalty_points,0) + ? WHERE id = ?', [points, customerId]);
    return points;
  },

  redeemPoints(customerId, saleId, points) {
    if (!customerId) return 0;
    if (points <= 0) return 0;

    const balance = loyaltyModel.getBalance(customerId);
    if (points > balance) throw new Error('Insufficient loyalty points');

    const rules = loyaltyModel.getRules();
    const maxDiscount = points * 1; // 1 point = 1 currency unit, or could use rules
    const discountAmount = maxDiscount;

    db.run(
      'INSERT INTO loyalty_transactions (customer_id, sale_id, points, type, reference) VALUES (?, ?, ?, ?, ?)',
      [customerId, saleId, -points, 'redeem', 'Points redeemed for discount']
    );
    db.run('UPDATE customers SET loyalty_points = COALESCE(loyalty_points,0) - ? WHERE id = ?', [points, customerId]);
    return discountAmount;
  },

  getTransactions(customerId) {
    return db.all(
      'SELECT * FROM loyalty_transactions WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
  },

  getBalance(customerId) {
    if (!customerId) return 0;
    const row = db.one('SELECT COALESCE(loyalty_points,0) as pts FROM customers WHERE id = ?', [customerId]);
    return row ? row.pts : 0;
  },
};

module.exports = loyaltyModel;
