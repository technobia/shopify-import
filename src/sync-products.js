import { cfg } from './config.js';
import { parseCsv } from './parsers/csv.js';
import { parseXml } from './parsers/xml.js';
import { discoverBySkus } from './sync/discover.js';
import { diffRecords, saveHashes } from './sync/diff.js';
import { toProductCreateInput, toProductUpdateInput } from './sync/build-jsonl.js';
import { createProduct, updateProduct, updateVariant } from './sync/perItem.js';
import { mapUpsert } from './state/db.js';


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

  const { create, update, unchanged } = diffRecords(input, discovered);
  console.log(`📊 Analysis: create=${create.length} update=${update.length} unchanged=${unchanged.length}\n`);

  // Create new products
  console.log('=== Creating New Products ===');
  const createdMapping = new Map();
  for (const { rec } of create) {
    try {
      const input = toProductCreateInput(rec);
      const result = await createProduct(input);
      createdMapping.set(rec.sku, result);
      discovered.set(rec.sku, result);
      console.log(`✓ Created: ${rec.sku} - ${rec.title}`);

      // Update variant with SKU and price if available
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

  // Update existing products
  console.log('\n=== Updating Existing Products ===');
  for (const { rec, ids } of update) {
    try {
      const input = toProductUpdateInput(rec);
      await updateProduct(ids.productId, input);
      console.log(`✓ Updated: ${rec.sku} - ${rec.title}`);

      // Update variant price and SKU
      if (rec.price != null && ids.variantId) {
        await updateVariant(ids.variantId, { price: rec.price.toString(), sku: rec.sku });
      }
    } catch (e) {
      console.error(`✗ Failed to update ${rec.sku}:`, e.message);
    }
  }

  // Save hashes and mappings
  saveHashes([...create, ...update]);

  const now = new Date().toISOString();
  for (const [sku, ids] of discovered) {
    mapUpsert.run({ sku, product_id: ids.productId, variant_id: ids.variantId, updated_at: now });
  }

  console.log('\n✅ Product sync complete!');
  console.log(`   Created: ${create.length}`);
  console.log(`   Updated: ${update.length}`);
  console.log(`   Unchanged: ${unchanged.length}`);
}


async function loadFeed() {
  if (cfg.primarySource === 'xml') return parseXml(cfg.feedXml);
  return parseCsv(cfg.feedCsv);
}


main().catch((e) => {
  console.error('❌ Product sync failed:', e);
  process.exit(1);
});

