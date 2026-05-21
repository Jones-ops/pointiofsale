const db = require('../config/database');

const customerModel = {
  findAll({ search, page = 1, limit = 50 } = {}) {
    let sql = 'SELECT c.*, pl.name as pricelist_name FROM customers c LEFT JOIN pricelists pl ON c.pricelist_id = pl.id WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return db.all(sql, params);
  },

  count({ search } = {}) {
    let sql = 'SELECT COUNT(*) as c FROM customers WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    return db.one(sql, params).c;
  },

  findById(id) {
    return db.one('SELECT c.*, pl.name as pricelist_name FROM customers c LEFT JOIN pricelists pl ON c.pricelist_id = pl.id WHERE c.id = ?', [id]);
  },

  create(data) {
    const result = db.run(
      `INSERT INTO customers (name, email, phone, address, is_walk_in, credit_limit, notes, pricelist_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.email || null, data.phone || null,
       data.address || null, data.is_walk_in ? 1 : 0,
       data.credit_limit || 0, data.notes || null, data.pricelist_id || null]
    );
    return customerModel.findById(result.lastInsertRowid);
  },

  update(id, data) {
    const fields = {};
    for (const k of ['name', 'email', 'phone', 'address', 'is_walk_in', 'credit_limit', 'notes', 'pricelist_id', 'loyalty_points']) {
      if (data[k] !== undefined) fields[k] = k === 'is_walk_in' ? (data[k] ? 1 : 0) : data[k];
    }
    if (Object.keys(fields).length === 0) return customerModel.findById(id);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(fields), id];
    db.run(`UPDATE customers SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, vals);
    return customerModel.findById(id);
  },

  remove(id) {
    db.run('DELETE FROM customers WHERE id = ?', [id]);
  },
};

module.exports = customerModel;
