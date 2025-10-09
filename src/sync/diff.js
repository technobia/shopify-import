import { hashGet, hashUpsert, mapGet } from '../state/db.js';
import { hashRecord } from '../state/hash.js';


export function diffRecords(input, discoveredMap) {
  const create = [], update = [], unchanged = [];


  for (const rec of input) {
    if (!rec.sku) continue;
    const h = hashRecord(rec);
    const prevHashRow = hashGet.get(rec.sku);
    const exists = discoveredMap.get(rec.sku) || mapGet.get(rec.sku);


    if (!exists) {
      create.push({ rec, hash: h });
    } else {
      if (!prevHashRow || prevHashRow.hash !== h) {
        update.push({ rec, ids: exists, hash: h });
      } else {
        unchanged.push({ rec });
      }
    }
  }


  return { create, update, unchanged };
}


export function saveHashes(items) {
  const now = new Date().toISOString();
  for (const it of items) {
    hashUpsert.run({ sku: it.rec.sku, hash: it.hash, updated_at: now });
  }
}
