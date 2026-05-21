const pricelistModel = require('../models/pricelistModel');

exports.list = (req, res) => {
  const { page, limit } = req.query;
  const lists = pricelistModel.findAll({ page: Number(page) || 1, limit: Number(limit) || 50 });
  res.json({ data: lists });
};

exports.get = (req, res) => {
  const pl = pricelistModel.findById(Number(req.params.id));
  if (!pl) return res.status(404).json({ error: 'Pricelist not found' });
  res.json(pl);
};

exports.create = (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Name is required' });
  const pl = pricelistModel.create(req.body);
  res.status(201).json(pl);
};

exports.update = (req, res) => {
  const pl = pricelistModel.update(Number(req.params.id), req.body);
  if (!pl) return res.status(404).json({ error: 'Pricelist not found' });
  res.json(pl);
};

exports.remove = (req, res) => {
  pricelistModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};

exports.addItem = (req, res) => {
  try {
    const { price_type, price_value } = req.body;
    if (!price_type) return res.status(400).json({ error: 'price_type is required' });
    if (price_value === undefined || price_value === null) return res.status(400).json({ error: 'price_value is required' });
    const item = pricelistModel.addItem({ ...req.body, pricelist_id: Number(req.params.id) });
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateItem = (req, res) => {
  const item = pricelistModel.updateItem(Number(req.params.id), req.body);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
};

exports.removeItem = (req, res) => {
  pricelistModel.removeItem(Number(req.params.id));
  res.json({ message: 'Deleted' });
};

exports.listItems = (req, res) => {
  const pl = pricelistModel.findById(Number(req.params.id));
  if (!pl) return res.status(404).json({ error: 'Pricelist not found' });
  res.json(pl.items);
};

exports.calculate = (req, res) => {
  const { customer_id, quantity } = req.query;
  const result = pricelistModel.calculatePrice(
    Number(req.params.productId),
    customer_id ? Number(customer_id) : null,
    Number(quantity) || 1
  );
  res.json(result || { effective_price: null, original_price: null });
};
