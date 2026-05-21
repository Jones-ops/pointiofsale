const categoryModel = require('../models/categoryModel');

exports.list = (req, res) => {
  res.json(categoryModel.findAll());
};

exports.create = (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  res.status(201).json(categoryModel.create({ name, description }));
};

exports.update = (req, res) => {
  const category = categoryModel.update(Number(req.params.id), req.body);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
};

exports.remove = (req, res) => {
  categoryModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};
