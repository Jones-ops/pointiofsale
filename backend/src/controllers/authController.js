const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = userModel.findByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!user.active) return res.status(403).json({ error: 'Account disabled' });

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
};

exports.me = (req, res) => {
  const user = userModel.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};
