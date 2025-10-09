import crypto from 'node:crypto';


export function hashRecord(rec) {
  const payload = {
    title: rec.title,
    price: rec.price,
    inventory: rec.inventory,
    status: rec.status,
    descriptionHtml: rec.descriptionHtml,
    images: rec.images,
    vendor: rec.vendor,
    productType: rec.productType,
    options: rec.options,
  };
  const s = JSON.stringify(payload);
  return crypto.createHash('sha256').update(s).digest('hex');
}
