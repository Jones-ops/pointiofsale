const db = require('../config/database');

const settingsModel = {
  async get() {
    return db.one('SELECT * FROM settings WHERE id = 1');
  },

  async update(data) {
    const fields = {};
    for (const k of ['company_name', 'address', 'phone', 'email', 'tax_id', 'currency', 'tax_rate', 'logo_path', 'receipt_footer', 'setup_complete']) {
      if (data[k] !== undefined) fields[k] = data[k];
    }
    if (Object.keys(fields).length === 0) return settingsModel.get();
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await db.run(`UPDATE settings SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`, Object.values(fields));
    return settingsModel.get();
  },
};

module.exports = settingsModel;
