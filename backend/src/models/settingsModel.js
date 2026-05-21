const db = require('../config/database');

const settingsModel = {
  get() {
    let s = db.one('SELECT * FROM settings WHERE id = 1');
    if (!s) {
      db.run('INSERT INTO settings (id, company_name) VALUES (1, ?)', ['My Company']);
      s = db.one('SELECT * FROM settings WHERE id = 1');
    }
    return s;
  },

  update(data) {
    const fields = {};
    for (const k of ['company_name', 'address', 'phone', 'email', 'tax_id', 'currency', 'tax_rate', 'logo_path', 'receipt_footer', 'setup_complete']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return settingsModel.get();
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(fields)];
    db.run(`UPDATE settings SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`, vals);
    return settingsModel.get();
  },
};

module.exports = settingsModel;
