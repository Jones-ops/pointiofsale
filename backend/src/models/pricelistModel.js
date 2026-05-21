const db = require('../config/database');

const pricelistModel = {
  findAll({ page = 1, limit = 50 } = {}) {
    return db.all(
      `SELECT p.*, (SELECT COUNT(*) FROM pricelist_items WHERE pricelist_id = p.id) as item_count
       FROM pricelists p ORDER BY p.name ASC LIMIT ? OFFSET ?`,
      [limit, (page - 1) * limit]
    );
  },

  findById(id) {
    const pl = db.one('SELECT * FROM pricelists WHERE id = ?', [id]);
    if (!pl) return null;
    pl.items = db.all(
      `SELECT pi.*, pr.name as product_name, c.name as category_name
       FROM pricelist_items pi
       LEFT JOIN products pr ON pi.product_id = pr.id
       LEFT JOIN categories c ON pi.category_id = c.id
       WHERE pi.pricelist_id = ? ORDER BY pi.priority ASC, pi.id ASC`, [id]
    );
    return pl;
  },

  create(data) {
    const result = db.run(
      'INSERT INTO pricelists (name, type) VALUES (?, ?)',
      [data.name, data.type || 'sale']
    );
    return pricelistModel.findById(result.lastInsertRowid);
  },

  update(id, data) {
    const fields = {};
    for (const k of ['name', 'type', 'is_active']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return pricelistModel.findById(id);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.run(`UPDATE pricelists SET ${sets} WHERE id = ?`, [...Object.values(fields), id]);
    return pricelistModel.findById(id);
  },

  remove(id) {
    db.run('DELETE FROM pricelist_items WHERE pricelist_id = ?', [id]);
    db.run('DELETE FROM pricelists WHERE id = ?', [id]);
  },

  addItem(data) {
    const result = db.run(
      `INSERT INTO pricelist_items (pricelist_id, product_id, category_id, min_quantity, price_type, price_value, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.pricelist_id, data.product_id || null, data.category_id || null,
       data.min_quantity || 1, data.price_type, data.price_value, data.priority || 10]
    );
    return db.one('SELECT * FROM pricelist_items WHERE id = ?', [result.lastInsertRowid]);
  },

  updateItem(id, data) {
    const fields = {};
    for (const k of ['product_id', 'category_id', 'min_quantity', 'price_type', 'price_value', 'priority']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return db.one('SELECT * FROM pricelist_items WHERE id = ?', [id]);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.run(`UPDATE pricelist_items SET ${sets} WHERE id = ?`, [...Object.values(fields), id]);
    return db.one('SELECT * FROM pricelist_items WHERE id = ?', [id]);
  },

  removeItem(id) {
    db.run('DELETE FROM pricelist_items WHERE id = ?', [id]);
  },

  calculatePrice(productId, customerId, quantity = 1) {
    if (!customerId) return null;
    const customer = db.one('SELECT pricelist_id FROM customers WHERE id = ?', [customerId]);
    if (!customer || !customer.pricelist_id) return null;

    const pricelist = db.one('SELECT * FROM pricelists WHERE id = ? AND is_active = 1', [customer.pricelist_id]);
    if (!pricelist) return null;

    const product = db.one('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) return null;

    // Find matching item: exact product > category > all (with no product_id or category_id)
    const items = db.all(
      `SELECT * FROM pricelist_items WHERE pricelist_id = ? AND (product_id = ? OR (product_id IS NULL AND category_id = ?) OR (product_id IS NULL AND category_id IS NULL))
       AND min_quantity <= ? ORDER BY priority ASC, id ASC LIMIT 1`,
      [customer.pricelist_id, productId, product.category_id, quantity]
    );

    if (items.length === 0) return null;

    const item = items[0];
    const original = product.selling_price;

    switch (item.price_type) {
      case 'fixed': return { effective_price: item.price_value, original_price: original, rule: item };
      case 'discount_percent': return { effective_price: original * (1 - item.price_value / 100), original_price: original, rule: item };
      case 'markup_percent': return { effective_price: original * (1 + item.price_value / 100), original_price: original, rule: item };
      default: return null;
    }
  },

  findByCustomer(customerId) {
    if (!customerId) return null;
    const customer = db.one('SELECT pricelist_id FROM customers WHERE id = ?', [customerId]);
    if (!customer || !customer.pricelist_id) return null;
    return pricelistModel.findById(customer.pricelist_id);
  },
};

module.exports = pricelistModel;
