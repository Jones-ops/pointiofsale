const db = require('../config/database');

exports.exportProducts = (req, res) => {
  const products = db.all('SELECT * FROM products ORDER BY id');
  res.setHeader('Content-Disposition', 'attachment; filename=products-export.json');
  res.json(products);
};

exports.exportCustomers = (req, res) => {
  const customers = db.all('SELECT * FROM customers ORDER BY id');
  res.setHeader('Content-Disposition', 'attachment; filename=customers-export.json');
  res.json(customers);
};

exports.importProducts = (req, res) => {
  const { items, overwrite } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

  let imported = 0, updated = 0, errors = [];

  db.run('BEGIN');
  try {
    for (const item of items) {
      try {
        if (!item.sku || !item.name) {
          errors.push({ sku: item.sku || '(no sku)', error: 'SKU and name required' });
          continue;
        }
        const existing = db.one('SELECT id FROM products WHERE sku = ?', [item.sku]);
        if (existing) {
          if (overwrite) {
            db.run(`UPDATE products SET name=?, description=?, category_id=?, cost_price=?, selling_price=?, unit=?, stock=?, reorder_level=?, barcode=?, active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
              [item.name, item.description || null, item.category_id || null, item.cost_price || 0,
               item.selling_price || 0, item.unit || 'pcs', item.stock || 0, item.reorder_level || 0,
               item.barcode || null, item.active !== undefined ? item.active : 1, existing.id]);
            updated++;
          } else {
            errors.push({ sku: item.sku, error: 'Already exists (use overwrite option to update)' });
          }
        } else {
          db.run(`INSERT INTO products (sku, name, description, category_id, cost_price, selling_price, unit, stock, reorder_level, barcode, active) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [item.sku, item.name, item.description || null, item.category_id || null, item.cost_price || 0,
             item.selling_price || 0, item.unit || 'pcs', item.stock || 0, item.reorder_level || 0,
             item.barcode || null, item.active !== undefined ? item.active : 1]);
          imported++;
        }
      } catch (e) {
        errors.push({ sku: item.sku || '(no sku)', error: e.message });
      }
    }
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    return res.status(500).json({ error: 'Import failed: ' + e.message });
  }

  res.json({ imported, updated, errors: errors.length > 0 ? errors : undefined });
};

exports.importCustomers = (req, res) => {
  const { items, overwrite } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

  let imported = 0, updated = 0, errors = [];

  db.run('BEGIN');
  try {
    for (const item of items) {
      try {
        if (!item.name) {
          errors.push({ name: item.name || '(no name)', error: 'Name required' });
          continue;
        }
        const existing = db.one('SELECT id FROM customers WHERE email = ? AND email IS NOT NULL AND email != ?', [item.email || '', '']);
        if (existing) {
          if (overwrite) {
            db.run(`UPDATE customers SET name=?, phone=?, address=?, is_walk_in=?, credit_limit=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
              [item.name, item.phone || null, item.address || null, item.is_walk_in ? 1 : 0,
               item.credit_limit || 0, item.notes || null, existing.id]);
            updated++;
          } else {
            errors.push({ name: item.name, error: 'Already exists (use overwrite option to update)' });
          }
        } else {
          db.run(`INSERT INTO customers (name, email, phone, address, is_walk_in, credit_limit, notes) VALUES (?,?,?,?,?,?,?)`,
            [item.name, item.email || null, item.phone || null, item.address || null,
             item.is_walk_in ? 1 : 0, item.credit_limit || 0, item.notes || null]);
          imported++;
        }
      } catch (e) {
        errors.push({ name: item.name || '(no name)', error: e.message });
      }
    }
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    return res.status(500).json({ error: 'Import failed: ' + e.message });
  }

  res.json({ imported, updated, errors: errors.length > 0 ? errors : undefined });
};
