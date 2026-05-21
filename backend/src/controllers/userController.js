const userModel = require('../models/userModel');

exports.list = async (req, res) => {
  const users = await userModel.findAll();
  res.json({ data: users });
};

exports.get = async (req, res) => {
  const user = await userModel.findById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

exports.create = async (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name) return res.status(400).json({ error: 'Username, password, and name required' });
  const user = await userModel.create({ username, password, name, role });
  res.status(201).json(user);
};

exports.update = async (req, res) => {
  const user = await userModel.update(Number(req.params.id), req.body);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

exports.remove = async (req, res) => {
  await userModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};
