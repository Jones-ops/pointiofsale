const authModel = require('../models/authModel');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const data = await authModel.authenticate(username, password);
  if (!data) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(data);
};

exports.me = async (req, res) => {
  const userModel = require('../models/userModel');
  const user = await userModel.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};
