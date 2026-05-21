const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

exports.list = (req, res) => {
  res.json(userModel.findAll());
};

exports.get = (req, res) => {
  const user = userModel.findById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

exports.create = (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name) return res.status(400).json({ error: 'Username, password, and name required' });

  const existing = userModel.findByUsername(username);
  if (existing) return res.status(400).json({ error: 'Username already taken' });

  const password_hash = bcrypt.hashSync(password, 10);
  const user = userModel.create({ username, password_hash, name, role });
  res.status(201).json(user);
};

exports.update = (req, res) => {
  const id = Number(req.params.id);
  const { password, ...fields } = req.body;
  if (password) fields.password_hash = bcrypt.hashSync(password, 10);
  const user = userModel.update(id, fields);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

exports.remove = (req, res) => {
  userModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};
