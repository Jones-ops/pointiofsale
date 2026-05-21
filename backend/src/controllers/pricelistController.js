const pricelistModel = require('../models/pricelistModel');

exports.list = async (req, res) => {
  const { page, limit } = req.query;
  const lists = await pricelistModel.findAll({ page: Number(page) || 1, limit: Number(limit) || 50 });
  res.json({ data: lists });
};

exports.get = async (req, res) => {
  const pl = await pricelistModel.findById(Number(req.params.id));
  if (!pl) return res.status(404).json({ error: 'Pricelist not found' });
  res.json(pl);
};

exports.create = async (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Name is required' });
  const pl = await pricelistModel.create(req.body);
  res.status(201).json(pl);
};

exports.update = async (req, res) => {
  const pl = await pricelistModel.update(Number(req.params.id), req.body);
  if (!pl) return res.status(404).json({ error: 'Pricelist not found' });
  res.json(pl);
};

exports.remove = async (req, res) => {
  await pricelistModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};

exports.addItem = async (req, res) => {
  const { price_type, price_value } = req.body;
  if (!price_type) return res.status(400).json({ error: 'price_type is required' });
  if (price_value === undefined || price_value === null) return res.status(400).json({ error: 'price_value is required' });
  const item = await pricelistModel.addItem({ ...req.body, pricelist_id: Number(req.params.id) });
  res.status(201).json(item);
};

exports.updateItem = async (req, res) => {
  const item = await pricelistModel.updateItem(Number(req.params.id), req.body);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
};

exports.removeItem = async (req, res) => {
  await pricelistModel.removeItem(Number(req.params.id));
  res.json({ message: 'Deleted' });
};

exports.listItems = async (req, res) => {
  const pl = await pricelistModel.findById(Number(req.params.id));
  if (!pl) return res.status(404).json({ error: 'Pricelist not found' });
  res.json(pl.items);
};

exports.calculate = async (req, res) => {
  const { customer_id, quantity } = req.query;
  const result = await pricelistModel.calculatePrice(
    Number(req.params.productId),
    customer_id ? Number(customer_id) : null,
    Number(quantity) || 1
  );
  res.json(result || { effective_price: null, original_price: null });
};
