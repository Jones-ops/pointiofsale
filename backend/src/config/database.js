const initSqlJs = require('sql.js');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const USE_PG = !!process.env.DATABASE_URL;

let sqliteDb = null;
let pgPool = null;

// ---- SQLite helpers ----
const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'pos.db');

function sqliteGetLastInsertInfo() {
  const r = sqliteDb.exec('SELECT last_insert_rowid() as id, changes() as c');
  if (r.length > 0) {
    return { lastInsertRowid: Number(r[0].values[0][0]), changes: Number(r[0].values[0][1]) };
  }
  return { lastInsertRowid: 0, changes: 0 };
}

function sqliteSave() {
  if (!sqliteDb) return;
  const data = sqliteDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function initSQLite() {
  if (sqliteDb) return sqliteDb;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const SQL = await initSqlJs();
  sqliteDb = fs.existsSync(dbPath)
    ? new SQL.Database(fs.readFileSync(dbPath))
    : new SQL.Database();
  sqliteDb.run('PRAGMA foreign_keys = ON');
  const origRun = sqliteDb.run.bind(sqliteDb);
  sqliteDb.run = function (...args) { const r = origRun(...args); sqliteSave(); return r; };
  const origExec = sqliteDb.exec.bind(sqliteDb);
  sqliteDb.exec = function (...args) { const r = origExec(...args); sqliteSave(); return r; };
  return sqliteDb;
}

// ---- PostgreSQL helpers ----
async function initPG() {
  if (pgPool) return pgPool;
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pgPool.query('SELECT 1'); // verify connection
  return pgPool;
}

// ---- Unified async DB interface ----
const db = {
  async init() {
    if (USE_PG) {
      await initPG();
    } else {
      await initSQLite();
    }
  },

  async all(sql, params = []) {
    if (USE_PG) {
      const result = await pgPool.query(sql, params);
      return result.rows;
    }
    const stmt = sqliteDb.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  },

  async one(sql, params = []) {
    if (USE_PG) {
      const result = await pgPool.query(sql, params);
      return result.rows[0] || null;
    }
    const stmt = sqliteDb.prepare(sql);
    stmt.bind(params);
    let row = null;
    if (stmt.step()) row = stmt.getAsObject();
    stmt.free();
    return row;
  },

  async run(sql, params = []) {
    if (USE_PG) {
      const isInsert = /^\s*INSERT/i.test(sql);
      const finalSql = isInsert && !/RETURNING/i.test(sql) ? sql + ' RETURNING id' : sql;
      const result = await pgPool.query(finalSql, params);
      return {
        lastInsertRowid: result.rows[0]?.id || null,
        rowCount: result.rowCount,
      };
    }
    const stmt = sqliteDb.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    return sqliteGetLastInsertInfo();
  },

  async exec(sql) {
    if (USE_PG) {
      await pgPool.query(sql);
      return;
    }
    sqliteDb.run(sql);
  },
};

module.exports = db;
