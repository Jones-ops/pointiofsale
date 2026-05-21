const saleModel = require('../models/saleModel');
const sessionModel = require('../models/sessionModel');
const PDFDocument = require('pdfkit');
const settingsModel = require('../models/settingsModel');
const path = require('path');
const fs = require('fs');

exports.list = async (req, res) => {
  const { page, limit, from, to, customer_id, staff_id } = req.query;
  const sales = await saleModel.findAll({
    page: Number(page) || 1, limit: Number(limit) || 50,
    from, to, customer_id: Number(customer_id) || undefined,
    staff_id: Number(staff_id) || undefined,
  });
  const total = await saleModel.count({ from, to, customer_id: Number(customer_id) || undefined, staff_id: Number(staff_id) || undefined });
  res.json({ data: sales, total, page: Number(page) || 1 });
};

exports.get = async (req, res) => {
  const sale = await saleModel.findById(Number(req.params.id));
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  res.json(sale);
};

exports.eligibleReturnItems = async (req, res) => {
  const sale = await saleModel.findById(Number(req.params.id));
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  if (sale.payment_status === 'voided') return res.status(400).json({ error: 'Sale is voided' });
  res.json({ items: sale.items });
};

exports.returnItems = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'Items are required' });
    items.forEach(i => { i.staff_id = req.user.id; });
    const returnSale = await saleModel.returnItems(Number(req.params.id), items);
    res.status(201).json(returnSale);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  const session_id = req.body.session_id || (await sessionModel.findActive() || {}).id || null;
  const sale = await saleModel.create({
    customer_id: req.body.customer_id,
    staff_id: req.user.id,
    items: req.body.items,
    payments: req.body.payments,
    notes: req.body.notes,
    session_id,
    redeem_points: req.body.redeem_points,
  });
  res.status(201).json(sale);
};

exports.voidSale = async (req, res) => {
  const sale = await saleModel.voidSale(Number(req.params.id));
  res.json(sale);
};

exports.receipt = async (req, res) => {
  const sale = await saleModel.findById(Number(req.params.id));
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  const settings = await settingsModel.get();

  const PAGE_W = 226.8;
  const MARGIN = 10;
  const USABLE = PAGE_W - MARGIN * 2;
  const doc = new PDFDocument({ size: [PAGE_W, 1000], margin: MARGIN });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-${sale.receipt_no}.pdf`);
  doc.pipe(res);

  const center = (text, opts = {}) => {
    const w = doc.widthOfString(text);
    doc.text(text, (PAGE_W - w) / 2, doc.y, { align: 'center', ...opts });
  };

  const divider = () => {
    doc.moveDown(0.3);
    const y = doc.y;
    const dash = '-'.repeat(Math.floor(USABLE / doc.widthOfString('-')));
    doc.fontSize(7).font('Helvetica');
    const dw = doc.widthOfString(dash);
    doc.text(dash, (PAGE_W - dw) / 2, y);
    doc.moveDown(0.3);
  };

  let yPos = 10;
  if (settings.logo_path) {
    const logoFile = path.join(__dirname, '..', '..', settings.logo_path);
    if (fs.existsSync(logoFile)) {
      try {
        doc.image(logoFile, (PAGE_W - 80) / 2, yPos, { width: 80, height: 35 });
        yPos = 52;
      } catch (e) { /* skip */ }
    }
  }

  doc.y = yPos;
  doc.fontSize(13).font('Helvetica-Bold');
  center(settings.company_name);
  doc.moveDown(0.2);

  doc.fontSize(7).font('Helvetica');
  if (settings.address) { center(settings.address); doc.moveDown(0.1); }
  if (settings.phone) { center(`Tel: ${settings.phone}`); doc.moveDown(0.1); }
  if (settings.email) { center(`Email: ${settings.email}`); doc.moveDown(0.1); }
  center(`Tax ID: ${settings.tax_id || 'N/A'}`);

  divider();

  doc.fontSize(10).font('Helvetica-Bold');
  center(sale.parent_sale_id ? 'RETURN / CREDIT NOTE' : 'SALES RECEIPT');
  doc.moveDown(0.5);

  doc.fontSize(7.5).font('Helvetica');
  const infoLeft = MARGIN;
  doc.text(`Receipt #: ${sale.receipt_no}`, infoLeft, doc.y);
  doc.text(`Date: ${new Date(sale.created_at).toLocaleString()}`, infoLeft, doc.y + 1, { lineBreak: false });
  doc.moveDown(0.8);
  doc.text(`Cashier: ${sale.staff_name || 'N/A'}`, infoLeft, doc.y);
  doc.text(`Customer: ${sale.customer_name || 'Walk-in'}`, infoLeft, doc.y + 1);

  divider();

  const colItem = MARGIN;
  const colQty = USABLE - 110;
  const colPrice = USABLE - 65;
  const colTotal = USABLE - 20;

  doc.fontSize(7.5).font('Helvetica-Bold');
  doc.y = doc.y + 2;
  doc.text('Item', colItem, doc.y);
  doc.text('Qty', colQty, doc.y, { width: 25, align: 'center' });
  doc.text('Price', colPrice, doc.y, { width: 45, align: 'right' });
  doc.text('Total', colTotal, doc.y, { width: 50, align: 'right' });
  doc.moveDown(0.5);

  doc.fontSize(7).font('Helvetica');
  for (const item of sale.items) {
    doc.y = doc.y + 0.5;
    doc.text(item.product_name || `#${item.product_id}`, colItem, doc.y, { width: colQty - colItem - 2 });
    doc.text(String(item.quantity), colQty, doc.y, { width: 25, align: 'center' });
    doc.text(`${settings.currency}${Number(item.unit_price).toFixed(2)}`, colPrice, doc.y, { width: 45, align: 'right' });
    doc.text(`${settings.currency}${Number(item.subtotal).toFixed(2)}`, colTotal, doc.y, { width: 50, align: 'right' });
    doc.moveDown(0.8);
  }

  divider();

  const labelX = colItem;
  const valX = colTotal;
  doc.fontSize(8);
  doc.y = doc.y + 2;

  const summaryRow = (label, value, bold = false) => {
    if (bold) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');
    doc.text(label, labelX, doc.y, { width: valX - labelX - 5, align: 'right' });
    doc.text(value, valX, doc.y, { width: 50, align: 'right' });
    doc.moveDown(0.6);
  };

  summaryRow('Subtotal:', `${settings.currency}${Number(sale.subtotal).toFixed(2)}`);
  if (sale.discount_amount > 0) {
    summaryRow('Discount:', `-${settings.currency}${Number(sale.discount_amount).toFixed(2)}`);
  }
  if (sale.tax_amount > 0) {
    summaryRow(`Tax (${settings.tax_rate}%):`, `${settings.currency}${Number(sale.tax_amount).toFixed(2)}`);
  }
  doc.moveDown(0.2);
  divider();
  summaryRow('TOTAL:', `${settings.currency}${Number(sale.total_amount).toFixed(2)}`, true);

  doc.moveDown(0.3);
  doc.fontSize(7).font('Helvetica');
  doc.text(`Payment: ${sale.payment_method}`, labelX, doc.y);
  doc.text(`Status: ${sale.payment_status}`, labelX, doc.y + 1);

  if (sale.notes) {
    doc.moveDown(0.3);
    doc.fontSize(7).font('Helvetica');
    doc.text(`Notes: ${sale.notes}`, labelX, doc.y);
  }

  doc.moveDown(1);
  divider();
  doc.fontSize(7.5).font('Helvetica');
  if (settings.receipt_footer) {
    center(settings.receipt_footer);
    doc.moveDown(0.3);
  }
  doc.fontSize(8).font('Helvetica-Bold');
  center('Thank you!');
  doc.moveDown(0.5);
  doc.fontSize(5).font('Helvetica');
  center(`Generated on ${new Date().toLocaleString()}`);

  doc.end();
};
