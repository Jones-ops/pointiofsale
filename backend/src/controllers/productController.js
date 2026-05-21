const productModel = require('../models/productModel');

exports.list = (req, res) => {
  const { search, category_id, active, page, limit, customer_id } = req.query;
  const products = productModel.findAll({
    search, category_id: Number(category_id) || undefined,
    active: active !== undefined ? active === 'true' || active === '1' : undefined,
    page: Number(page) || 1, limit: Number(limit) || 50,
    customer_id: customer_id ? Number(customer_id) : undefined,
  });
  const total = productModel.count({
    search, category_id: Number(category_id) || undefined,
    active: active !== undefined ? active === 'true' || active === '1' : undefined,
  });
  res.json({ data: products, total, page: Number(page) || 1 });
};

exports.get = (req, res) => {
  const { customer_id } = req.query;
  const product = productModel.findById(Number(req.params.id), { customer_id: customer_id ? Number(customer_id) : undefined });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

exports.getByBarcode = (req, res) => {
  const product = productModel.findByBarcode(req.params.barcode);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

exports.create = (req, res) => {
  const { sku, name } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'SKU and name required' });
  const product = productModel.create(req.body);
  res.status(201).json(product);
};

exports.update = (req, res) => {
  const product = productModel.update(Number(req.params.id), req.body);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

exports.remove = (req, res) => {
  productModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};

exports.adjustStock = (req, res) => {
  const { quantity, type, notes } = req.body;
  if (!quantity || !type) return res.status(400).json({ error: 'Quantity and type required' });
  try {
    const product = productModel.adjustStock(Number(req.params.id), quantity, type, 'manual', notes, req.user.id);
    res.json(product);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
