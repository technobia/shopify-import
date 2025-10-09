import fs from 'node:fs';
import { XMLParser } from 'fast-xml-parser';


export async function parseXml(path) {
  const xml = await fs.promises.readFile(path, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xml);
  const items = Array.isArray(data.catalog?.item) ? data.catalog.item : [data.catalog?.item].filter(Boolean);
  return (items || []).map(normalize);
}


function normalize(x) {
  return {
    sku: x.sku,
    title: x.title,
    price: Number(x.price),
    inventory: Number(x.inventory ?? 0),
    status: (x.status || 'active').toLowerCase(),
    descriptionHtml: x.descriptionHtml || x.description || '',
    images: toArray(x.images?.image),
    vendor: x.vendor || '',
    productType: x.productType || '',
    options: toOptions(x.options),
  };
}


function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}


function toOptions(o) {
  return [];
}
