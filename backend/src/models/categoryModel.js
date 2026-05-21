const db = require('../config/database');

const categoryModel = {
  findAll() {
    return db.all('SELECT * FROM categories ORDER BY name');
  },

  findById(id) {
    return db.one('SELECT * FROM categories WHERE id = ?', [id]);
  },

  create({ name, description }) {
    const result = db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description || null]);
    return categoryModel.findById(result.lastInsertRowid);
  },

  update(id, { name, description }) {
    if (name !== undefined) db.run('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    if (description !== undefined) db.run('UPDATE categories SET description = ? WHERE id = ?', [description, id]);
    return categoryModel.findById(id);
  },

  remove(id) {
    db.run('DELETE FROM categories WHERE id = ?', [id]);
  },
};

module.exports = categoryModel;
