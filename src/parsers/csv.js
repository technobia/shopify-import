import fs from 'node:fs';
import { parse } from 'csv-parse';


export async function parseCsv(path) {
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (r) => rows.push(r))
      .on('end', resolve)
      .on('error', reject);
  });
  return rows.map(normalize);
}


function normalize(r) {
  return {
    sku: r.sku,
    title: r.title,
    price: Number(r.price),
    inventory: Number(r.inventory ?? 0),
    status: (r.status || 'active').toLowerCase(),
    descriptionHtml: r.description_html || r.description || '',
    images: (r.images || '')
      .split('|')
      .map((u) => u.trim())
      .filter(Boolean),
    vendor: r.vendor || '',
    productType: r.product_type || '',
    options: parseOptions(r.options),
  };
}


function parseOptions(str) {
  if (!str) return [];
  return str.split('|').map((opt) => {
    const [name, values] = opt.split(':');
    return { name: name.trim(), values: values.split(',').map((v) => v.trim()) };
  });
}
