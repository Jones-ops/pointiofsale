const categoryModel = require('../models/categoryModel');

exports.list = async (req, res) => {
  const categories = await categoryModel.findAll();
  res.json(categories);
};

exports.create = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const category = await categoryModel.create({ name, description });
  res.status(201).json(category);
};

exports.update = async (req, res) => {
  const category = await categoryModel.update(Number(req.params.id), req.body);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
};

exports.remove = async (req, res) => {
  await categoryModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};
