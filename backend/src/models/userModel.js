const db = require('../config/database');

const userModel = {
  findAll() {
    return db.all('SELECT id, username, name, role, active, created_at FROM users ORDER BY created_at DESC');
  },

  findById(id) {
    return db.one('SELECT id, username, name, role, active, created_at FROM users WHERE id = ?', [id]);
  },

  findByUsername(username) {
    return db.one('SELECT * FROM users WHERE username = ?', [username]);
  },

  create({ username, password_hash, name, role }) {
    const result = db.run(
      'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [username, password_hash, name, role || 'staff']
    );
    return userModel.findById(result.lastInsertRowid);
  },

  update(id, fields) {
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined && k !== 'id') {
        sets.push(`${k} = ?`);
        vals.push(v);
      }
    }
    if (sets.length === 0) return userModel.findById(id);
    sets.push('updated_at = CURRENT_TIMESTAMP');
    vals.push(id);
    db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
    return userModel.findById(id);
  },

  remove(id) {
    db.run('DELETE FROM users WHERE id = ?', [id]);
  },
};

module.exports = userModel;
