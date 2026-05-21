const db = require('../config/database');

const categoryModel = {
  async findAll() {
    return db.all('SELECT * FROM categories ORDER BY name ASC');
  },

  async findById(id) {
    return db.one('SELECT * FROM categories WHERE id = ?', [id]);
  },

  async create(data) {
    const result = await db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [data.name, data.description || null]);
    return categoryModel.findById(result.lastInsertRowid);
  },

  async update(id, data) {
    const fields = {};
    for (const k of ['name', 'description']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return categoryModel.findById(id);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await db.run(`UPDATE categories SET ${sets} WHERE id = ?`, [...Object.values(fields), id]);
    return categoryModel.findById(id);
  },

  async remove(id) {
    await db.run('DELETE FROM categories WHERE id = ?', [id]);
  },
};

module.exports = categoryModel;
