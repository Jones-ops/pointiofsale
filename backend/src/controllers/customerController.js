const customerModel = require('../models/customerModel');

exports.list = (req, res) => {
  const { search, page, limit } = req.query;
  const customers = customerModel.findAll({ search, page: Number(page) || 1, limit: Number(limit) || 50 });
  const total = customerModel.count({ search });
  res.json({ data: customers, total, page: Number(page) || 1 });
};

exports.get = (req, res) => {
  const customer = customerModel.findById(Number(req.params.id));
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
};

exports.create = (req, res) => {
  const { name, email, phone, address, is_walk_in, credit_limit, notes, pricelist_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const customer = customerModel.create({ name, email, phone, address, is_walk_in, credit_limit, notes, pricelist_id });
  res.status(201).json(customer);
};

exports.update = (req, res) => {
  const customer = customerModel.update(Number(req.params.id), req.body);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
};

exports.remove = (req, res) => {
  customerModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};
