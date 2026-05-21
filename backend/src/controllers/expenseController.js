const expenseModel = require('../models/expenseModel');

exports.list = async (req, res) => {
  const { from, to, category, page, limit } = req.query;
  const expenses = await expenseModel.findAll({
    from, to, category,
    page: Number(page) || 1, limit: Number(limit) || 50,
  });
  res.json({ data: expenses });
};

exports.get = async (req, res) => {
  const expense = await expenseModel.findById(Number(req.params.id));
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
};

exports.create = async (req, res) => {
  const { category, description, amount, expense_date } = req.body;
  if (!category || !amount || !expense_date) return res.status(400).json({ error: 'Category, amount, and date required' });
  const expense = await expenseModel.create({ category, description, amount: Number(amount), staff_id: req.user.id, expense_date });
  res.status(201).json(expense);
};

exports.update = async (req, res) => {
  const expense = await expenseModel.update(Number(req.params.id), req.body);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
};

exports.remove = async (req, res) => {
  await expenseModel.remove(Number(req.params.id));
  res.json({ message: 'Deleted' });
};

exports.categories = async (req, res) => {
  const cats = await expenseModel.getCategories();
  res.json(cats.map(c => c.category));
};
