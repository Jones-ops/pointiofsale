const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'pos.db');

async function seed() {
  if (!fs.existsSync(dbPath)) {
    console.log('No database found. Start the app first to auto-create the database.');
    process.exit(1);
  }
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  const products = [
    { name: 'Wireless Mouse', sku: 'WM-001', barcode: '1000001', category: 3, cost: 350, price: 599, stock: 50 },
    { name: 'USB-C Hub', sku: 'UC-001', barcode: '1000002', category: 3, cost: 600, price: 999, stock: 30 },
    { name: 'Mechanical Keyboard', sku: 'MK-001', barcode: '1000003', category: 3, cost: 1200, price: 1999, stock: 20 },
    { name: 'Espresso Coffee', sku: 'FB-001', barcode: '2000001', category: 2, cost: 15, price: 45, stock: 200 },
    { name: 'Green Tea Latte', sku: 'FB-002', barcode: '2000002', category: 2, cost: 12, price: 35, stock: 150 },
    { name: 'Chicken Sandwich', sku: 'FB-003', barcode: '2000003', category: 2, cost: 30, price: 75, stock: 40 },
    { name: 'French Fries (Large)', sku: 'FB-004', barcode: '2000004', category: 2, cost: 20, price: 55, stock: 100 },
    { name: 'Hamburger', sku: 'FB-005', barcode: '2000005', category: 2, cost: 35, price: 85, stock: 60 },
    { name: 'Bottled Water', sku: 'FB-006', barcode: '2000006', category: 2, cost: 8, price: 20, stock: 300 },
    { name: 'Iced Coffee', sku: 'FB-007', barcode: '2000007', category: 2, cost: 18, price: 50, stock: 120 },
  ];

  const existingCount = db.exec("SELECT COUNT(*) as c FROM products")[0]?.values[0][0] || 0;
  if (existingCount > 0) {
    console.log(`Products already exist (${existingCount} found). Skipping.`);
  } else {
    const stmt = db.prepare(
      'INSERT INTO products (name, sku, barcode, category_id, cost_price, selling_price, stock, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    );
    for (const p of products) {
      stmt.run([p.name, p.sku, p.barcode, p.category, p.cost, p.price, p.stock]);
    }
    stmt.free();
    console.log(`Seeded ${products.length} demo products`);

    // Create a sample walk-in customer
    const custStmt = db.prepare(
      "INSERT INTO customers (name, is_walk_in, notes) VALUES (?, 1, ?)"
    );
    custStmt.run(["Walk-in Demo", "Auto-seeded demo"]);
    custStmt.free();
    console.log("Created demo walk-in customer");
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
  console.log('Demo data seeding complete.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
