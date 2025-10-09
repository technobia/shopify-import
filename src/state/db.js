import Database from 'better-sqlite3';

const db = new Database('./state.sqlite');


db.exec(`
    CREATE TABLE IF NOT EXISTS sku_map (
                                           sku TEXT PRIMARY KEY,
                                           product_id TEXT,
                                           variant_id TEXT,
                                           updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sku_hash (
                                            sku TEXT PRIMARY KEY,
                                            hash TEXT,
                                            updated_at TEXT
    );
`);


export const mapGet = db.prepare('SELECT * FROM sku_map WHERE sku = ?');
export const mapUpsert = db.prepare(`
  INSERT INTO sku_map (sku, product_id, variant_id, updated_at) 
  VALUES (@sku, @product_id, @variant_id, @updated_at)
  ON CONFLICT(sku) DO UPDATE SET 
    product_id = excluded.product_id, 
    variant_id = excluded.variant_id, 
    updated_at = excluded.updated_at
`);

export const hashGet = db.prepare('SELECT hash FROM sku_hash WHERE sku = ?');
export const hashUpsert = db.prepare(`
  INSERT INTO sku_hash (sku, hash, updated_at) 
  VALUES (@sku, @hash, @updated_at)
  ON CONFLICT(sku) DO UPDATE SET 
    hash = excluded.hash, 
    updated_at = excluded.updated_at
`);
