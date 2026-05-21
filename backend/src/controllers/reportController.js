const reportsModel = require('../models/reportModel');

exports.summary = async (req, res) => {
  const { from, to } = req.query;
  const data = await reportsModel.summary(from, to);
  res.json(data);
};

exports.dailySales = async (req, res) => {
  const { from, to } = req.query;
  const data = await reportsModel.dailySales(from, to);
  res.json(data);
};

exports.categoryBreakdown = async (req, res) => {
  const { from, to } = req.query;
  const data = await reportsModel.categoryBreakdown(from, to);
  res.json(data);
};

exports.paymentMethods = async (req, res) => {
  const { from, to } = req.query;
  const data = await reportsModel.paymentMethods(from, to);
  res.json(data);
};

exports.inventoryValuation = async (req, res) => {
  const data = await reportsModel.inventoryValuation();
  res.json(data);
};

exports.profitMargins = async (req, res) => {
  const { from, to } = req.query;
  const data = await reportsModel.profitMargins(from, to);
  res.json(data);
};

exports.salesSummary = exports.summary;

exports.monthlySales = async (req, res) => {
  const { from, to } = req.query;
  const raw = await reportsModel.dailySales(from, to);
  const monthly = {};
  for (const r of raw) {
    const month = r.date ? r.date.substring(0, 7) : 'unknown';
    monthly[month] = monthly[month] || { month, count: 0, total: 0 };
    monthly[month].count += Number(r.count);
    monthly[month].total += Number(r.total);
  }
  res.json(Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)));
};

exports.profitLoss = async (req, res) => {
  const { from, to } = req.query;
  const summary = await reportsModel.summary(from, to);
  res.json({ revenue: summary.totalSales, expenses: summary.totalExpenses, profit: summary.totalSales - summary.totalExpenses });
};

exports.taxReport = async (req, res) => {
  const { from, to } = req.query;
  const sales = await reportsModel.dailySales(from, to);
  const totalSales = sales.reduce((s, r) => s + Number(r.total), 0);
  res.json({ total_sales: totalSales, taxable_amount: totalSales, tax_rate: 'Configured in settings', tax_amount: 0 });
};

exports.salesByCategory = exports.categoryBreakdown;

exports.exportCSV = async (req, res) => {
  const { from, to, type } = req.query;
  const data = await reportsModel.exportCSV(from, to, type);
  res.setHeader('Content-Type', 'text/csv');
  res.send(data);
};
