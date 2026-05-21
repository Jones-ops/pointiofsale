const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'pos.db');

let db = null;

// Helper: convert sql.js result to { lastInsertRowid, changes }
function getLastInsertInfo() {
  const r = db.exec('SELECT last_insert_rowid() as id, changes() as c');
  if (r.length > 0) {
    return { lastInsertRowid: Number(r[0].values[0][0]), changes: Number(r[0].values[0][1]) };
  }
  return { lastInsertRowid: 0, changes: 0 };
}

async function initDatabase() {
  if (db) return db;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');

  // Wrap run to auto-save
  const origRun = db.run.bind(db);
  db.run = function (...args) { const r = origRun(...args); save(); return r; };
  const origExec = db.exec.bind(db);
  db.exec = function (...args) { const r = origExec(...args); save(); return r; };

  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// Synchronous query helpers (call after initDatabase)
function all(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function one(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function run(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  return getLastInsertInfo();
}

function exec(sql) {
  getDb().run(sql);
}

module.exports = { initDatabase, getDb, save, all, one, run, exec };
