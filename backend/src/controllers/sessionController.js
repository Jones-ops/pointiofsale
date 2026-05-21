const sessionModel = require('../models/sessionModel');

exports.list = async (req, res) => {
  const { page, limit } = req.query;
  const sessions = await sessionModel.findAll({ page: Number(page) || 1, limit: Number(limit) || 50 });
  res.json({ data: sessions });
};

exports.get = async (req, res) => {
  const session = await sessionModel.findById(Number(req.params.id));
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
};

exports.active = async (req, res) => {
  const session = await sessionModel.findActive();
  if (!session) return res.json(null);
  const enriched = await sessionModel.findById(session.id);
  res.json(enriched);
};

exports.open = async (req, res) => {
  const existing = await sessionModel.findActive();
  if (existing) return res.status(400).json({ error: 'An active session already exists', session: existing });
  const { opening_cash, notes } = req.body;
  const session = await sessionModel.open({ user_id: req.user.id, opening_cash: Number(opening_cash) || 0, notes });
  res.status(201).json(session);
};

exports.close = async (req, res) => {
  const { closing_cash, notes } = req.body;
  const session = await sessionModel.close(Number(req.params.id), { closing_cash: Number(closing_cash) || 0, notes });
  res.json(session);
};

exports.addCashMove = async (req, res) => {
  const { type, amount, reason } = req.body;
  if (!type || !['in', 'out'].includes(type)) return res.status(400).json({ error: 'Type must be "in" or "out"' });
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
  if (!reason) return res.status(400).json({ error: 'Reason is required' });
  const move = await sessionModel.addCashMove({ session_id: Number(req.params.id), type, amount: Number(amount), reason });
  res.status(201).json(move);
};

exports.getCashMoves = async (req, res) => {
  const moves = await sessionModel.getCashMoves(Number(req.params.id));
  res.json(moves);
};
