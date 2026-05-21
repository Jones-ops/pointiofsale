const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'pos.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const sql = require('fs').readFileSync(
  path.join(__dirname, '001_initial.sql'),
  'utf8'
);

db.exec(sql);
console.log('Migration completed successfully.');
db.close();
