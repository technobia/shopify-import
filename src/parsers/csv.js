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

  // Check if this is a Shopify export format (has 'Handle' column)
  if (rows.length > 0 && rows[0].Handle !== undefined) {
    return parseShopifyFormat(rows);
  }

  return rows.map(normalize).filter(Boolean);
}


function normalize(r) {
  // Support both custom format and Shopify export format
  const sku = r.sku || r['Variant SKU'] || r.Handle;
  const title = r.title || r.Title;
  const price = r.price || r['Variant Price'];
  const inventory = r.inventory || r['Variant Inventory Qty'];
  const status = r.status || r.Status;
  const descriptionHtml = r.description_html || r.description || r['Body (HTML)'];
  const images = r.images || r['Image Src'];
  const vendor = r.vendor || r.Vendor;
  const productType = r.product_type || r.Type;

  // Skip rows without SKU or title (like additional image rows in Shopify exports)
  if (!sku && !title) return null;

  return {
    sku: sku,
    title: title,
    price: Number(price) || 0,
    inventory: Number(inventory ?? 0),
    status: (status || 'active').toLowerCase(),
    descriptionHtml: descriptionHtml || '',
    images: (images || '')
      .split('|')
      .map((u) => u.trim())
      .filter(Boolean),
    vendor: vendor || '',
    productType: productType || '',
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


function parseShopifyFormat(rows) {
  const productMap = new Map();

  for (const row of rows) {
    const handle = row.Handle;
    if (!handle) continue;

    // If this is the main product row (has Title)
    if (row.Title) {
      productMap.set(handle, {
        sku: row['Variant SKU'] || handle,
        title: row.Title,
        price: Number(row['Variant Price']) || 0,
        inventory: Number(row['Variant Inventory Qty'] || 0),
        status: (row.Status || 'active').toLowerCase(),
        descriptionHtml: row['Body (HTML)'] || '',
        images: [],
        vendor: row.Vendor || '',
        productType: row.Type || '',
        options: [],
      });
    }

    // Add image if present
    if (row['Image Src'] && productMap.has(handle)) {
      const product = productMap.get(handle);
      if (!product.images.includes(row['Image Src'])) {
        product.images.push(row['Image Src']);
      }
    }
  }

  return Array.from(productMap.values());
}
