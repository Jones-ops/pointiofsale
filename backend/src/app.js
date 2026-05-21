const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

const { initDatabase, exec } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

async function main() {
  const db = await initDatabase();

  // Run migrations
  const tablesExist = db.exec("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='users'");
  if (!tablesExist.length || !tablesExist[0].values[0][0]) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_initial.sql'), 'utf8');
    db.run(sql);

    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.run("INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)", ['admin', hash, 'Administrator', 'admin']);
    db.run("INSERT INTO categories (name, description) VALUES (?, ?)", ['General', 'General items']);
    db.run("INSERT INTO categories (name, description) VALUES (?, ?)", ['Food & Beverage', 'Food and drink items']);
    db.run("INSERT INTO categories (name, description) VALUES (?, ?)", ['Electronics', 'Electronic items']);
    console.log('Database initialized with default admin (admin / admin123)');
  } else {
    // Apply schema upgrades for existing databases
    const settingsCols = db.exec("PRAGMA table_info(settings)");
    if (settingsCols.length) {
      const colNames = settingsCols[0].values.map(r => r[1]);
      if (!colNames.includes('logo_path')) db.run("ALTER TABLE settings ADD COLUMN logo_path TEXT DEFAULT ''");
      if (!colNames.includes('setup_complete')) db.run("ALTER TABLE settings ADD COLUMN setup_complete INTEGER NOT NULL DEFAULT 0");
    }
  }

  // Create new tables (idempotent)
  db.run(`CREATE TABLE IF NOT EXISTS pos_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
    opening_cash REAL NOT NULL DEFAULT 0,
    closing_cash REAL,
    expected_cash REAL,
    difference REAL,
    notes TEXT,
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS cash_moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES pos_sessions(id),
    type TEXT NOT NULL CHECK(type IN ('in','out')),
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ALTER TABLE upgrades for sessions, returns, loyalty, pricelists
  const salesCols = db.exec("PRAGMA table_info(sales)");
  if (salesCols.length) {
    const salesColNames = salesCols[0].values.map(r => r[1]);
    if (!salesColNames.includes('session_id')) db.run("ALTER TABLE sales ADD COLUMN session_id INTEGER REFERENCES pos_sessions(id)");
    if (!salesColNames.includes('parent_sale_id')) db.run("ALTER TABLE sales ADD COLUMN parent_sale_id INTEGER REFERENCES sales(id)");
  }
  const saleItemsCols = db.exec("PRAGMA table_info(sale_items)");
  if (saleItemsCols.length) {
    const siColNames = saleItemsCols[0].values.map(r => r[1]);
    if (!siColNames.includes('return_reason')) db.run("ALTER TABLE sale_items ADD COLUMN return_reason TEXT");
  }
  const customersCols = db.exec("PRAGMA table_info(customers)");
  if (customersCols.length) {
    const custColNames = customersCols[0].values.map(r => r[1]);
    if (!custColNames.includes('pricelist_id')) db.run("ALTER TABLE customers ADD COLUMN pricelist_id INTEGER REFERENCES pricelists(id)");
    if (!custColNames.includes('loyalty_points')) db.run("ALTER TABLE customers ADD COLUMN loyalty_points REAL DEFAULT 0");
  }
  db.run(`CREATE TABLE IF NOT EXISTS pricelists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'sale',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS pricelist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pricelist_id INTEGER NOT NULL REFERENCES pricelists(id),
    product_id INTEGER REFERENCES products(id),
    category_id INTEGER REFERENCES categories(id),
    min_quantity REAL DEFAULT 1,
    price_type TEXT NOT NULL CHECK(price_type IN ('fixed','discount_percent','markup_percent')),
    price_value REAL NOT NULL,
    priority INTEGER NOT NULL DEFAULT 10
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS loyalty_rules (
    id INTEGER PRIMARY KEY CHECK(id=1),
    points_per_currency REAL NOT NULL DEFAULT 1,
    min_order REAL DEFAULT 0,
    max_discount_percent REAL DEFAULT 100,
    is_active INTEGER NOT NULL DEFAULT 1
  )`);
  db.run(`INSERT OR IGNORE INTO loyalty_rules (id, points_per_currency) VALUES (1, 1)`);
  db.run(`CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    sale_id INTEGER REFERENCES sales(id),
    points REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('earn','redeem','adjust')),
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('Schema up to date');

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors());
  app.use(fileUpload({ createParentPath: true }));
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  const routes = {
    auth: require('./routes/auth'),
    users: require('./routes/users'),
    customers: require('./routes/customers'),
    categories: require('./routes/categories'),
    products: require('./routes/products'),
    sales: require('./routes/sales'),
    expenses: require('./routes/expenses'),
    reports: require('./routes/reports'),
    settings: require('./routes/settings'),
    importExport: require('./routes/importExport'),
    posSessions: require('./routes/posSessions'),
    pricelists: require('./routes/pricelists'),
    loyalty: require('./routes/loyalty'),
  };

  app.use('/api/auth', routes.auth);
  app.use('/api/users', routes.users);
  app.use('/api/customers', routes.customers);
  app.use('/api/categories', routes.categories);
  app.use('/api/products', routes.products);
  app.use('/api/sales', routes.sales);
  app.use('/api/expenses', routes.expenses);
  app.use('/api/reports', routes.reports);
  app.use('/api/settings', routes.settings);
  app.use('/api/pos/sessions', routes.posSessions);
  app.use('/api/pricelists', routes.pricelists);
  app.use('/api/loyalty', routes.loyalty);
  app.use('/api', routes.importExport);

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`POS Backend running on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
