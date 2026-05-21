const productModel = require('../models/productModel');
const customerModel = require('../models/customerModel');
const db = require('../config/database');

exports.exportProducts = async (req, res) => {
  const products = await productModel.findAll({ active: undefined, limit: 10000 });
  res.json(products);
};

exports.exportCustomers = async (req, res) => {
  const customers = await customerModel.findAll({ limit: 10000 });
  res.json(customers);
};

exports.importProducts = async (req, res) => {
  const { items, overwrite } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });

  let imported = 0, updated = 0, errors = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.sku || !item.name) { errors.push({ row: i, error: 'Missing sku or name' }); continue; }
    try {
      const existing = await db.one('SELECT id FROM products WHERE sku = ?', [item.sku]);
      if (existing) {
        if (overwrite) await productModel.update(existing.id, item);
        updated++;
      } else {
        await productModel.create(item);
        imported++;
      }
    } catch (e) {
      errors.push({ row: i, error: e.message });
    }
  }
  res.json({ imported, updated, errors: errors.length ? errors : undefined });
};

exports.importCustomers = async (req, res) => {
  const { items, overwrite } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });

  let imported = 0, updated = 0, errors = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.name) { errors.push({ row: i, error: 'Missing name' }); continue; }
    try {
      const existing = item.email ? await db.one('SELECT id FROM customers WHERE email = ?', [item.email]) : null;
      if (existing) {
        if (overwrite) await customerModel.update(existing.id, item);
        updated++;
      } else {
        await customerModel.create(item);
        imported++;
      }
    } catch (e) {
      errors.push({ row: i, error: e.message });
    }
  }
  res.json({ imported, updated, errors: errors.length ? errors : undefined });
};
