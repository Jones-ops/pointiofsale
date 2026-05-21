const sessionModel = require('../models/sessionModel');

exports.list = (req, res) => {
  const { page, limit } = req.query;
  const sessions = sessionModel.findAll({ page: Number(page) || 1, limit: Number(limit) || 50 });
  res.json({ data: sessions });
};

exports.get = (req, res) => {
  const session = sessionModel.findById(Number(req.params.id));
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
};

exports.active = (req, res) => {
  const session = sessionModel.findActive();
  res.json(session || null);
};

exports.open = (req, res) => {
  const existing = sessionModel.findActive();
  if (existing) return res.status(400).json({ error: 'An active session already exists', session: existing });
  const { opening_cash, notes } = req.body;
  const session = sessionModel.open({ user_id: req.user.id, opening_cash: Number(opening_cash) || 0, notes });
  res.status(201).json(session);
};

exports.close = (req, res) => {
  try {
    const { closing_cash, notes } = req.body;
    const session = sessionModel.close(Number(req.params.id), { closing_cash: Number(closing_cash) || 0, notes });
    res.json(session);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.addCashMove = (req, res) => {
  try {
    const { type, amount, reason } = req.body;
    if (!type || !['in', 'out'].includes(type)) return res.status(400).json({ error: 'Type must be "in" or "out"' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
    if (!reason) return res.status(400).json({ error: 'Reason is required' });
    const move = sessionModel.addCashMove({ session_id: Number(req.params.id), type, amount: Number(amount), reason });
    res.status(201).json(move);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getCashMoves = (req, res) => {
  const moves = sessionModel.getCashMoves(Number(req.params.id));
  res.json(moves);
};
