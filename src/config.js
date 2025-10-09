import 'dotenv/config';


export const cfg = {
  shop: process.env.SHOPIFY_SHOP,
  apiVersion: process.env.SHOPIFY_ADMIN_VERSION || '2024-10',
  token: process.env.SHOPIFY_ADMIN_TOKEN,
  primarySource: (process.env.PRIMARY_SOURCE || 'csv').toLowerCase(),
  feedCsv: process.env.FEED_CSV || './data/catalog.csv',
  feedXml: process.env.FEED_XML || './data/catalog.xml',
  maxParallel: Number(process.env.MAX_PARALLEL || 5),
};


if (!cfg.shop || !cfg.token) {
  throw new Error('Missing SHOPIFY_SHOP or SHOPIFY_ADMIN_TOKEN in .env');
}
