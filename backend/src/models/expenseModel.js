const db = require('../config/database');

const expenseModel = {
  async findAll({ from, to, category, page = 1, limit = 50 } = {}) {
    let sql = 'SELECT e.*, u.name as staff_name FROM expenses e LEFT JOIN users u ON e.staff_id = u.id WHERE 1=1';
    const params = [];
    if (from) { sql += ' AND e.expense_date >= ?'; params.push(from); }
    if (to) { sql += ' AND e.expense_date <= ?'; params.push(to); }
    if (category) { sql += ' AND e.category = ?'; params.push(category); }
    sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return db.all(sql, params);
  },

  async findById(id) {
    return db.one('SELECT e.*, u.name as staff_name FROM expenses e LEFT JOIN users u ON e.staff_id = u.id WHERE e.id = ?', [id]);
  },

  async create(data) {
    const result = await db.run(
      'INSERT INTO expenses (category, description, amount, staff_id, expense_date) VALUES (?, ?, ?, ?, ?)',
      [data.category, data.description || null, data.amount, data.staff_id, data.expense_date]
    );
    return expenseModel.findById(result.lastInsertRowid);
  },

  async update(id, data) {
    const fields = {};
    for (const k of ['category', 'description', 'amount', 'expense_date']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return expenseModel.findById(id);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await db.run(`UPDATE expenses SET ${sets} WHERE id = ?`, [...Object.values(fields), id]);
    return expenseModel.findById(id);
  },

  async remove(id) {
    await db.run('DELETE FROM expenses WHERE id = ?', [id]);
  },

  async getCategories() {
    return db.all('SELECT DISTINCT category FROM expenses ORDER BY category');
  },
};

module.exports = expenseModel;
