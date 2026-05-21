const db = require('../config/database');

const sessionModel = {
  open({ user_id, opening_cash, notes }) {
    const result = db.run(
      `INSERT INTO pos_sessions (user_id, opening_cash, notes) VALUES (?, ?, ?)`,
      [user_id, opening_cash || 0, notes || null]
    );
    return sessionModel.findById(result.lastInsertRowid);
  },

  findActive() {
    return db.one("SELECT * FROM pos_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1");
  },

  findById(id) {
    const session = db.one(
      `SELECT s.*, u.name as user_name
       FROM pos_sessions s LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`, [id]
    );
    if (!session) return null;
    session.cash_moves = sessionModel.getCashMoves(id);
    session.sales = db.all(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as total
       FROM sales WHERE session_id = ? AND payment_status != 'voided'`, [id]
    )[0];
    return session;
  },

  findAll({ page = 1, limit = 50 } = {}) {
    return db.all(
      `SELECT s.*, u.name as user_name,
        (SELECT COUNT(*) FROM sales WHERE session_id = s.id) as sale_count,
        (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE session_id = s.id AND payment_status != 'voided') as sale_total
       FROM pos_sessions s LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.opened_at DESC LIMIT ? OFFSET ?`,
      [limit, (page - 1) * limit]
    );
  },

  close(id, { closing_cash, notes }) {
    const session = sessionModel.findById(id);
    if (!session) throw new Error('Session not found');
    if (session.status === 'closed') throw new Error('Session already closed');

    const cashMovesIn = db.one("SELECT COALESCE(SUM(amount),0) as total FROM cash_moves WHERE session_id = ? AND type = 'in'", [id]);
    const cashMovesOut = db.one("SELECT COALESCE(SUM(amount),0) as total FROM cash_moves WHERE session_id = ? AND type = 'out'", [id]);
    const salesTotal = session.sales ? session.sales.total : 0;
    const expectedCash = session.opening_cash + salesTotal + (cashMovesIn ? cashMovesIn.total : 0) - (cashMovesOut ? cashMovesOut.total : 0);
    const difference = (closing_cash || 0) - expectedCash;

    db.run(
      `UPDATE pos_sessions SET status = 'closed', closing_cash = ?, expected_cash = ?, difference = ?, notes = COALESCE(?, notes), closed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [closing_cash || 0, expectedCash, difference, notes || null, id]
    );
    return sessionModel.findById(id);
  },

  addCashMove({ session_id, type, amount, reason }) {
    const session = db.one("SELECT * FROM pos_sessions WHERE id = ?", [session_id]);
    if (!session) throw new Error('Session not found');
    if (session.status === 'closed') throw new Error('Session is closed');
    const result = db.run(
      'INSERT INTO cash_moves (session_id, type, amount, reason) VALUES (?, ?, ?, ?)',
      [session_id, type, amount, reason]
    );
    return db.one('SELECT * FROM cash_moves WHERE id = ?', [result.lastInsertRowid]);
  },

  getCashMoves(session_id) {
    return db.all('SELECT * FROM cash_moves WHERE session_id = ? ORDER BY created_at ASC', [session_id]);
  },
};

module.exports = sessionModel;
