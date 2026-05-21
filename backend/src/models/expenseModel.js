const db = require('../config/database');

const expenseModel = {
  findAll({ page = 1, limit = 50, from, to, category } = {}) {
    let sql = 'SELECT e.*, u.name as staff_name FROM expenses e LEFT JOIN users u ON e.staff_id = u.id WHERE 1=1';
    const params = [];
    if (from) { sql += ' AND e.expense_date >= ?'; params.push(from); }
    if (to) { sql += ' AND e.expense_date <= ?'; params.push(to); }
    if (category) { sql += ' AND e.category = ?'; params.push(category); }
    sql += ' ORDER BY e.expense_date DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return db.all(sql, params);
  },

  count({ from, to, category } = {}) {
    let sql = 'SELECT COUNT(*) as c FROM expenses WHERE 1=1';
    const params = [];
    if (from) { sql += ' AND expense_date >= ?'; params.push(from); }
    if (to) { sql += ' AND expense_date <= ?'; params.push(to); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    return db.one(sql, params).c;
  },

  findById(id) {
    return db.one('SELECT e.*, u.name as staff_name FROM expenses e LEFT JOIN users u ON e.staff_id = u.id WHERE e.id = ?', [id]);
  },

  create(data) {
    const result = db.run(
      'INSERT INTO expenses (category, description, amount, staff_id, expense_date) VALUES (?, ?, ?, ?, ?)',
      [data.category, data.description || null, data.amount, data.staff_id || null, data.expense_date]
    );
    return expenseModel.findById(result.lastInsertRowid);
  },

  update(id, data) {
    const fields = {};
    for (const k of ['category', 'description', 'amount', 'expense_date']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return expenseModel.findById(id);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(fields), id];
    db.run(`UPDATE expenses SET ${sets} WHERE id = ?`, vals);
    return expenseModel.findById(id);
  },

  remove(id) {
    db.run('DELETE FROM expenses WHERE id = ?', [id]);
  },

  getCategories() {
    return db.all('SELECT DISTINCT category FROM expenses ORDER BY category').map(r => r.category);
  },
};

module.exports = expenseModel;
