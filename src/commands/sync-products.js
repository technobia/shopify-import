import { cfg } from '../config.js';
import { parseCsv } from '../lib/parsers/csv.js';
import { parseXml } from '../lib/parsers/xml.js';
import { discoverBySkus } from '../lib/sync/discover.js';
import { diffRecords } from '../lib/sync/diff.js';
import { toProductCreateInput, toProductUpdateInput } from '../lib/sync/transform.js';
import { createProduct, updateProduct, updateVariant } from '../lib/api/products.js';


/**
 * Sync Products - Full product sync including title, description, images, etc.
 */
async function main() {
  console.log('🔄 Starting Product Sync...\n');

  const input = await loadFeed();
  console.log(`📦 Loaded ${input.length} products from feed\n`);

  const skus = input.map((x) => x.sku).filter(Boolean);
  const discovered = await discoverBySkus(skus);
  console.log(`🔍 Discovered ${discovered.size} existing products in Shopify\n`);

  const { create, update } = diffRecords(input, discovered);
  console.log(`📊 Analysis: create=${create.length} update=${update.length}\n`);

  console.log('=== Creating New Products ===');
  for (const { rec } of create) {
    try {
      const { input, media } = toProductCreateInput(rec);
      const result = await createProduct(input, media);
      console.log(`✓ Created: ${rec.sku} - ${rec.title}`);

      if (result.variantId) {
        const variantInput = {};
        if (rec.sku) variantInput.sku = rec.sku;
        if (rec.price != null) variantInput.price = rec.price.toString();

        if (Object.keys(variantInput).length > 0) {
          await updateVariant(result.variantId, variantInput);
        }
      }
    } catch (e) {
      console.error(`✗ Failed to create ${rec.sku}:`, e.message);
    }
  }

  console.log('\n=== Updating Existing Products ===');
  for (const { rec, ids } of update) {
    try {
      const input = toProductUpdateInput(rec);
      await updateProduct(ids.productId, input);
      console.log(`✓ Updated: ${rec.sku} - ${rec.title}`);

      if (rec.price != null && ids.variantId) {
        await updateVariant(ids.variantId, { price: rec.price.toString(), sku: rec.sku });
      }
    } catch (e) {
      console.error(`✗ Failed to update ${rec.sku}:`, e.message);
    }
  }

  console.log('\n✅ Product sync complete!');
  console.log(`   Created: ${create.length}`);
  console.log(`   Updated: ${update.length}`);
}


async function loadFeed() {
  if (cfg.primarySource === 'xml') return parseXml(cfg.feedXml);
  return parseCsv(cfg.feedCsv);
}


main().catch((e) => {
  console.error('❌ Product sync failed:', e);
  process.exit(1);
});

