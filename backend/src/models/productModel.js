const db = require('../config/database');
const pricelistModel = require('./pricelistModel');

const productModel = {
  async findAll({ search, category_id, active, page = 1, limit = 50, customer_id } = {}) {
    let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category_id) { sql += ' AND p.category_id = ?'; params.push(category_id); }
    if (active !== undefined) { sql += ' AND p.active = ?'; params.push(active ? 1 : 0); }
    sql += ' ORDER BY p.name ASC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    const products = await db.all(sql, params);
    if (customer_id) {
      for (const p of products) {
        const calc = await pricelistModel.calculatePrice(p.id, customer_id);
        if (calc) p.effective_price = Math.round(calc.effective_price * 100) / 100;
      }
    }
    return products;
  },

  async count({ search, category_id, active } = {}) {
    let sql = 'SELECT COUNT(*) as c FROM products p WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category_id) { sql += ' AND p.category_id = ?'; params.push(category_id); }
    if (active !== undefined) { sql += ' AND p.active = ?'; params.push(active ? 1 : 0); }
    return (await db.one(sql, params)).c;
  },

  async findById(id, { customer_id } = {}) {
    const product = await db.one(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [id]
    );
    if (product && customer_id) {
      const calc = await pricelistModel.calculatePrice(product.id, customer_id);
      if (calc) product.effective_price = Math.round(calc.effective_price * 100) / 100;
    }
    return product;
  },

  async findByBarcode(barcode) {
    return db.one(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?',
      [barcode]
    );
  },

  async create(data) {
    const result = await db.run(
      `INSERT INTO products (sku, name, description, category_id, cost_price, selling_price, unit, stock, reorder_level, barcode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.sku, data.name, data.description || null, data.category_id || null,
       data.cost_price || 0, data.selling_price || 0, data.unit || 'pcs',
       data.stock || 0, data.reorder_level || 0, data.barcode || null]
    );
    return productModel.findById(result.lastInsertRowid);
  },

  async update(id, data) {
    const fields = {};
    for (const k of ['sku', 'name', 'description', 'category_id', 'cost_price', 'selling_price', 'unit', 'stock', 'reorder_level', 'barcode', 'active']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return productModel.findById(id);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(fields), id];
    await db.run(`UPDATE products SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, vals);
    return productModel.findById(id);
  },

  async remove(id) {
    await db.run('DELETE FROM products WHERE id = ?', [id]);
  },

  async adjustStock(id, quantity, type, reference, notes, staff_id) {
    const product = await productModel.findById(id);
    if (!product) throw new Error('Product not found');
    let newStock = product.stock;
    if (type === 'sale') newStock -= quantity;
    else if (type === 'return') newStock += quantity;
    else newStock += quantity;
    if (newStock < 0) throw new Error('Insufficient stock');
    await db.run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, id]);
    await db.run(
      'INSERT INTO inventory_log (product_id, type, quantity, reference, notes, staff_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, type, quantity, reference || null, notes || null, staff_id || null]
    );
    return productModel.findById(id);
  },
};

module.exports = productModel;
