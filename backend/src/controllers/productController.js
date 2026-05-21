const productModel = require('../models/productModel');

exports.list = async (req, res) => {
  const { search, category_id, active, page, limit, customer_id } = req.query;
  const products = await productModel.findAll({
    search, category_id: Number(category_id) || undefined,
    active: active !== undefined ? active === 'true' || active === '1' : undefined,
    page: Number(page) || 1, limit: Number(limit) || 50,
    customer_id: customer_id ? Number(customer_id) : undefined,
  });
  const total = await productModel.count({
    search, category_id: Number(category_id) || undefined,
    active: active !== undefined ? active === 'true' || active === '1' : undefined,
  });
  res.json({ data: products, total, page: Number(page) || 1 });
};

exports.get = async (req, res) => {
  const { customer_id } = req.query;
  const product = await productModel.findById(Number(req.params.id), { customer_id: customer_id ? Number(customer_id) : undefined });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

exports.getByBarcode = async (req, res) => {
  const product = await productModel.findByBarcode(req.params.barcode);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

exports.create = async (req, res) => {
  const { sku, name } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'SKU and name required' });
  const product = await productModel.create(req.body);
  res.status(201).json(product);
};

exports.update = async (req, res) => {
  const product = await productModel.update(Number(req.params.id), req.body);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

exports.remove = async (req, res) => {
  await productModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};

exports.adjustStock = async (req, res) => {
  const { quantity, type, notes } = req.body;
  if (!quantity || !type) return res.status(400).json({ error: 'Quantity and type required' });
  const product = await productModel.adjustStock(Number(req.params.id), quantity, type, 'manual', notes, req.user.id);
  res.json(product);
};
