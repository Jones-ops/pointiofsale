const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const authModel = {
  async authenticate(username, password) {
    const user = await db.one('SELECT * FROM users WHERE username = ? AND active = 1', [username]);
    if (!user) return null;
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return null;
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user: { id: user.id, username: user.username, name: user.name, role: user.role } };
  },
};

module.exports = authModel;
