export function diffRecords(input, discoveredMap) {
  const create = [];
  const update = [];

  for (const rec of input) {
    if (!rec.sku) continue;

    const exists = discoveredMap.get(rec.sku);

    if (!exists) {
      create.push({ rec });
    } else {
      update.push({ rec, ids: exists });
    }
  }

  return { create, update };
}
