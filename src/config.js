import 'dotenv/config';

export const cfg = {
  shop: process.env.SHOPIFY_SHOP,
  apiVersion: process.env.SHOPIFY_ADMIN_VERSION || '2024-10',
  token: process.env.SHOPIFY_ADMIN_TOKEN,
  primarySource: (process.env.PRIMARY_SOURCE || 'csv').toLowerCase(),
  csvSource: process.env.SOURCE_CSV || './data/products.csv',
  xmlSource: process.env.SOURCE_XML || './data/products.xml',
  chunkItems: parseInt(process.env.CHUNK_ITEMS, 10) || 100,
};

if (!cfg.shop || !cfg.token) {
  throw new Error('Missing SHOPIFY_SHOP or SHOPIFY_ADMIN_TOKEN in .env');
}
