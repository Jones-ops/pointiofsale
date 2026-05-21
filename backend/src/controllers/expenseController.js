const expenseModel = require('../models/expenseModel');

exports.list = (req, res) => {
  const { page, limit, from, to, category } = req.query;
  const expenses = expenseModel.findAll({
    page: Number(page) || 1, limit: Number(limit) || 50,
    from, to, category,
  });
  const total = expenseModel.count({ from, to, category });
  res.json({ data: expenses, total, page: Number(page) || 1 });
};

exports.get = (req, res) => {
  const expense = expenseModel.findById(Number(req.params.id));
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
};

exports.create = (req, res) => {
  const { category, amount, expense_date, description } = req.body;
  if (!category || !amount || !expense_date) return res.status(400).json({ error: 'Category, amount, and date required' });
  const expense = expenseModel.create({ category, description, amount, staff_id: req.user.id, expense_date });
  res.status(201).json(expense);
};

exports.update = (req, res) => {
  const expense = expenseModel.update(Number(req.params.id), req.body);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
};

exports.remove = (req, res) => {
  expenseModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};

exports.categories = (req, res) => {
  res.json(expenseModel.getCategories());
};
