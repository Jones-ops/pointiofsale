const loyaltyModel = require('../models/loyaltyModel');

exports.getRules = async (req, res) => {
  res.json(await loyaltyModel.getRules());
};

exports.updateRules = async (req, res) => {
  const rules = await loyaltyModel.updateRules(req.body);
  res.json(rules);
};

exports.getTransactions = async (req, res) => {
  const { customer_id } = req.query;
  if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
  const txs = await loyaltyModel.getTransactions(Number(customer_id));
  const balance = await loyaltyModel.getBalance(Number(customer_id));
  res.json({ transactions: txs, balance });
};

exports.redeem = async (req, res) => {
  const { customer_id, points, sale_id } = req.body;
  if (!customer_id || !points) return res.status(400).json({ error: 'customer_id and points are required' });
  const discount = await loyaltyModel.redeemPoints(Number(customer_id), sale_id ? Number(sale_id) : null, Number(points));
  res.json({ discount, points_redeemed: Number(points) });
};
