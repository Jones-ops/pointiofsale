const loyaltyModel = require('../models/loyaltyModel');

exports.getRules = (req, res) => {
  res.json(loyaltyModel.getRules());
};

exports.updateRules = (req, res) => {
  const rules = loyaltyModel.updateRules(req.body);
  res.json(rules);
};

exports.getTransactions = (req, res) => {
  const { customer_id } = req.query;
  if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
  const txs = loyaltyModel.getTransactions(Number(customer_id));
  const balance = loyaltyModel.getBalance(Number(customer_id));
  res.json({ transactions: txs, balance });
};

exports.redeem = (req, res) => {
  try {
    const { customer_id, points, sale_id } = req.body;
    if (!customer_id || !points) return res.status(400).json({ error: 'customer_id and points are required' });
    const discount = loyaltyModel.redeemPoints(Number(customer_id), sale_id ? Number(sale_id) : null, Number(points));
    res.json({ discount, points_redeemed: Number(points) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
