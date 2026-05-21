const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'pos.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const hash = bcrypt.hashSync('admin123', 10);

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!existing) {
  db.prepare(
    'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run('admin', hash, 'Administrator', 'admin');
  console.log('Admin user created (username: admin, password: admin123)');
} else {
  console.log('Admin user already exists');
}

const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (catCount === 0) {
  db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run('General', 'General items');
  db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run('Food & Beverage', 'Food and drink items');
  db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run('Electronics', 'Electronic items');
  console.log('Default categories created');
}

console.log('Seed completed.');
db.close();
