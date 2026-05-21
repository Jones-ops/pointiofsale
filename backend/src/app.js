require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

const db = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const USE_PG = !!process.env.DATABASE_URL;

async function tableExists(name) {
  if (USE_PG) {
    const r = await db.one('SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2) as e', ['public', name]);
    return r && r.e;
  }
  const r = await db.one("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name=?", [name]);
  return r && r.c > 0;
}

async function columnExists(table, column) {
  if (USE_PG) {
    const r = await db.one('SELECT EXISTS(SELECT FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name=$3) as e', ['public', table, column]);
    return r && r.e;
  }
  const cols = await db.all('PRAGMA table_info(' + table + ')');
  return cols.some(c => c.name === column);
}

function pgSql(sql) {
  return sql
    .replace(/\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi, 'SERIAL PRIMARY KEY')
    .replace(/\bINTEGER\s+PRIMARY\s+KEY\b/gi, 'SERIAL PRIMARY KEY')
    .replace(/\bDATETIME\b/gi, 'TIMESTAMP');
}

async function main() {
  await db.init();

  if (!(await tableExists('users'))) {
    const rawSql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_initial.sql'), 'utf8');
    const createStmts = rawSql.split(';').filter(s => /^\s*CREATE\s+TABLE/i.test(s.trim()));
    for (const stmt of createStmts) {
      const sql = USE_PG ? pgSql(stmt.trim()) : stmt.trim();
      await db.exec(sql + ';');
    }

    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    await db.run("INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)", ['admin', hash, 'Administrator', 'admin']);
    await db.run("INSERT INTO categories (name, description) VALUES (?, ?)", ['General', 'General items']);
    await db.run("INSERT INTO categories (name, description) VALUES (?, ?)", ['Food & Beverage', 'Food and drink items']);
    await db.run("INSERT INTO categories (name, description) VALUES (?, ?)", ['Electronics', 'Electronic items']);
    if (USE_PG) {
      await db.run("INSERT INTO settings (id, company_name) VALUES (1, 'My Company') ON CONFLICT (id) DO NOTHING");
    } else {
      await db.run("INSERT OR IGNORE INTO settings (id, company_name) VALUES (1, 'My Company')");
    }
    console.log('Database initialized with default admin (admin / admin123)');
  } else {
    if (!USE_PG) {
      const settingsCols = await db.all('PRAGMA table_info(settings)');
      const colNames = settingsCols.map(r => r.name);
      if (!colNames.includes('logo_path')) await db.run("ALTER TABLE settings ADD COLUMN logo_path TEXT DEFAULT ''");
      if (!colNames.includes('setup_complete')) await db.run("ALTER TABLE settings ADD COLUMN setup_complete INTEGER NOT NULL DEFAULT 0");
    } else {
      if (!(await columnExists('settings', 'logo_path'))) await db.run("ALTER TABLE settings ADD COLUMN logo_path TEXT DEFAULT ''");
      if (!(await columnExists('settings', 'setup_complete'))) await db.run("ALTER TABLE settings ADD COLUMN setup_complete INTEGER NOT NULL DEFAULT 0");
    }
  }

  await db.exec(USE_PG
    ? `CREATE TABLE IF NOT EXISTS pos_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      opening_cash REAL NOT NULL DEFAULT 0,
      closing_cash REAL,
      expected_cash REAL,
      difference REAL,
      notes TEXT,
      opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      closed_at TIMESTAMP
    )`
    : `CREATE TABLE IF NOT EXISTS pos_sessions (
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
    )`
  );
  await db.exec(USE_PG
    ? `CREATE TABLE IF NOT EXISTS cash_moves (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES pos_sessions(id),
      type TEXT NOT NULL CHECK(type IN ('in','out')),
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    : `CREATE TABLE IF NOT EXISTS cash_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES pos_sessions(id),
      type TEXT NOT NULL CHECK(type IN ('in','out')),
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  if (!(await columnExists('sales', 'session_id'))) await db.run("ALTER TABLE sales ADD COLUMN session_id INTEGER REFERENCES pos_sessions(id)");
  if (!(await columnExists('sales', 'parent_sale_id'))) await db.run("ALTER TABLE sales ADD COLUMN parent_sale_id INTEGER REFERENCES sales(id)");
  if (!(await columnExists('sale_items', 'return_reason'))) await db.run("ALTER TABLE sale_items ADD COLUMN return_reason TEXT");
  if (!(await columnExists('customers', 'pricelist_id'))) await db.run("ALTER TABLE customers ADD COLUMN pricelist_id INTEGER REFERENCES pricelists(id)");
  if (!(await columnExists('customers', 'loyalty_points'))) await db.run("ALTER TABLE customers ADD COLUMN loyalty_points REAL DEFAULT 0");

  await db.exec(USE_PG
    ? `CREATE TABLE IF NOT EXISTS pricelists (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'sale',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    : `CREATE TABLE IF NOT EXISTS pricelists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'sale',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await db.exec(USE_PG
    ? `CREATE TABLE IF NOT EXISTS pricelist_items (
      id SERIAL PRIMARY KEY,
      pricelist_id INTEGER NOT NULL REFERENCES pricelists(id),
      product_id INTEGER REFERENCES products(id),
      category_id INTEGER REFERENCES categories(id),
      min_quantity REAL DEFAULT 1,
      price_type TEXT NOT NULL CHECK(price_type IN ('fixed','discount_percent','markup_percent')),
      price_value REAL NOT NULL,
      priority INTEGER NOT NULL DEFAULT 10
    )`
    : `CREATE TABLE IF NOT EXISTS pricelist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pricelist_id INTEGER NOT NULL REFERENCES pricelists(id),
      product_id INTEGER REFERENCES products(id),
      category_id INTEGER REFERENCES categories(id),
      min_quantity REAL DEFAULT 1,
      price_type TEXT NOT NULL CHECK(price_type IN ('fixed','discount_percent','markup_percent')),
      price_value REAL NOT NULL,
      priority INTEGER NOT NULL DEFAULT 10
    )`
  );
  await db.exec(USE_PG
    ? `CREATE TABLE IF NOT EXISTS loyalty_rules (
      id SERIAL PRIMARY KEY,
      points_per_currency REAL NOT NULL DEFAULT 1,
      min_order REAL DEFAULT 0,
      max_discount_percent REAL DEFAULT 100,
      is_active INTEGER NOT NULL DEFAULT 1
    )`
    : `CREATE TABLE IF NOT EXISTS loyalty_rules (
      id INTEGER PRIMARY KEY CHECK(id=1),
      points_per_currency REAL NOT NULL DEFAULT 1,
      min_order REAL DEFAULT 0,
      max_discount_percent REAL DEFAULT 100,
      is_active INTEGER NOT NULL DEFAULT 1
    )`
  );
  const existingRule = await db.one('SELECT id FROM loyalty_rules WHERE id=1');
  if (!existingRule) {
    await db.run('INSERT INTO loyalty_rules (id, points_per_currency) VALUES (?, ?)', [1, 1]);
  }
  await db.exec(USE_PG
    ? `CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      sale_id INTEGER REFERENCES sales(id),
      points REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('earn','redeem','adjust')),
      reference TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    : `CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      sale_id INTEGER REFERENCES sales(id),
      points REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('earn','redeem','adjust')),
      reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

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
