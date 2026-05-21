const db = require('../config/database');

const userModel = {
  async findAll() {
    return db.all('SELECT id, username, name, role, active, created_at FROM users ORDER BY name ASC');
  },

  async findById(id) {
    return db.one('SELECT id, username, name, role, active, created_at FROM users WHERE id = ?', [id]);
  },

  async findByUsername(username) {
    return db.one('SELECT * FROM users WHERE username = ?', [username]);
  },

  async create(data) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync(data.password, 10);
    const result = await db.run(
      'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [data.username, hash, data.name, data.role || 'staff']
    );
    return userModel.findById(result.lastInsertRowid);
  },

  async update(id, data) {
    const fields = {};
    for (const k of ['name', 'role', 'active']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (data.password) {
      const bcrypt = require('bcryptjs');
      fields.password_hash = bcrypt.hashSync(data.password, 10);
    }
    if (Object.keys(fields).length === 0) return userModel.findById(id);
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(fields), id];
    await db.run(`UPDATE users SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, vals);
    return userModel.findById(id);
  },

  async remove(id) {
    await db.run('DELETE FROM users WHERE id = ?', [id]);
  },
};

module.exports = userModel;
