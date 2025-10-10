import 'dotenv/config';

export const cfg = {
  shop: process.env.SHOPIFY_SHOP,
  apiVersion: process.env.SHOPIFY_ADMIN_VERSION || '2024-10',
  token: process.env.SHOPIFY_ADMIN_TOKEN,
  primarySource: (process.env.PRIMARY_SOURCE || 'csv').toLowerCase(),
  csvSource: process.env.CSV_SOURCE || './data/products.csv',
  xmlSource: process.env.XML_SOURCE || './data/products.xml',
  feedCsv: process.env.CSV_SOURCE || process.env.FEED_CSV || './data/products.csv',
  feedXml: process.env.XML_SOURCE || process.env.FEED_XML || './data/products.xml',
  xmlFormat: process.env.XML_FORMAT || 'zeg',
};

if (!cfg.shop || !cfg.token) {
  throw new Error('Missing SHOPIFY_SHOP or SHOPIFY_ADMIN_TOKEN in .env');
}
