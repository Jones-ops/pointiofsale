const db = require('../config/database');

const loyaltyModel = {
  async getRules() {
    return (await db.one('SELECT * FROM loyalty_rules WHERE id = 1')) || { points_per_currency: 1, min_order: 0, max_discount_percent: 100, is_active: 1 };
  },

  async updateRules(data) {
    const fields = {};
    for (const k of ['points_per_currency', 'min_order', 'max_discount_percent', 'is_active']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return loyaltyModel.getRules();
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await db.run(`UPDATE loyalty_rules SET ${sets} WHERE id = 1`, Object.values(fields));
    return loyaltyModel.getRules();
  },

  async earnPoints(customerId, saleId, amountSpent) {
    if (!customerId) return 0;
    const rules = await loyaltyModel.getRules();
    if (!rules.is_active) return 0;
    if (amountSpent < rules.min_order) return 0;

    const points = Math.floor(amountSpent * rules.points_per_currency);
    if (points <= 0) return 0;

    await db.run(
      'INSERT INTO loyalty_transactions (customer_id, sale_id, points, type, reference) VALUES (?, ?, ?, ?, ?)',
      [customerId, saleId, points, 'earn', 'Sale completed']
    );
    await db.run('UPDATE customers SET loyalty_points = COALESCE(loyalty_points,0) + ? WHERE id = ?', [points, customerId]);
    return points;
  },

  async redeemPoints(customerId, saleId, points) {
    if (!customerId) return 0;
    if (points <= 0) return 0;

    const balance = await loyaltyModel.getBalance(customerId);
    if (points > balance) throw new Error('Insufficient loyalty points');

    const discountAmount = points;

    await db.run(
      'INSERT INTO loyalty_transactions (customer_id, sale_id, points, type, reference) VALUES (?, ?, ?, ?, ?)',
      [customerId, saleId, -points, 'redeem', 'Points redeemed for discount']
    );
    await db.run('UPDATE customers SET loyalty_points = COALESCE(loyalty_points,0) - ? WHERE id = ?', [points, customerId]);
    return discountAmount;
  },

  async getTransactions(customerId) {
    return db.all(
      'SELECT * FROM loyalty_transactions WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
  },

  async getBalance(customerId) {
    if (!customerId) return 0;
    const row = await db.one('SELECT COALESCE(loyalty_points,0) as pts FROM customers WHERE id = ?', [customerId]);
    return row ? row.pts : 0;
  },
};

module.exports = loyaltyModel;
