import fs from 'node:fs';


export function buildCreateJsonl(path, createItems) {
  const lines = createItems.map(({ rec }) => ({ input: toProductCreateInput(rec) }));
  fs.writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n'));
}


export function buildUpdateJsonl(path, updateItems) {
  const lines = updateItems.map(({ rec, ids }) => ({ id: ids.productId, input: toProductUpdateInput(rec) }));
  fs.writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n'));
}


export function toProductCreateInput(rec) {
  return {
    title: rec.title,
    status: rec.status.toUpperCase(),
    descriptionHtml: rec.descriptionHtml,
    vendor: rec.vendor,
    productType: rec.productType,
  };
}


export function toProductUpdateInput(rec) {
  return {
    title: rec.title,
    status: rec.status.toUpperCase(),
    descriptionHtml: rec.descriptionHtml,
    vendor: rec.vendor,
    productType: rec.productType,
  };
}
