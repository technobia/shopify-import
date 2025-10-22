import { cfg } from '../config.js';
import { parseCsv } from '../lib/parsers/csv.js';
import { parseXml } from '../lib/parsers/xml.js';
import { discoverBySkus } from '../lib/sync/discover.js';
import { diffRecords } from '../lib/sync/diff.js';
import { toProductCreateInput, toProductUpdateInput } from '../lib/sync/transform.js';
import { createProduct, updateProduct, updateVariant } from '../lib/api/products.js';

async function main() {
  console.log('🔄 Product Sync\n');

  const input = await loadFeed();
  console.log(`Loaded ${input.length} products`);

  const skus = input.map((x) => x.sku).filter(Boolean);
  const discovered = await discoverBySkus(skus);
  console.log(`Found ${discovered.size} existing products`);

  const { create, update } = diffRecords(input, discovered);
  console.log(`Create: ${create.length} | Update: ${update.length}\n`);

  if (create.length > 0) {
    console.log('Creating...');
    for (let i = 0; i < create.length; i++) {
      const { rec } = create[i];
      try {
        const { input, media } = toProductCreateInput(rec);
        const result = await createProduct(input, media);
        console.log(`✓ ${rec.sku} (${result.metafieldsCount} metafields)`);

        if (result.variantId) {
          const variantInput = {};
          if (rec.sku) variantInput.sku = rec.sku;
          if (rec.price != null) variantInput.price = rec.price.toString();

          if (Object.keys(variantInput).length > 0) {
            await updateVariant(result.variantId, variantInput);
          }
        }
      } catch (e) {
        console.error(`✗ ${rec.sku}: ${e.message}`);
      }
    }
  }

  if (update.length > 0) {
    console.log('\nUpdating...');
    for (let i = 0; i < update.length; i++) {
      const { rec, ids } = update[i];
      try {
        const input = toProductUpdateInput(rec);
        await updateProduct(ids.productId, input);
        console.log(`✓ ${rec.sku}`);

        if (rec.price != null && ids.variantId) {
          await updateVariant(ids.variantId, { price: rec.price.toString(), sku: rec.sku });
        }
      } catch (e) {
        console.error(`✗ ${rec.sku}: ${e.message}`);
      }
    }
  }

  console.log(`\n✅ Done (${create.length} created, ${update.length} updated)`);
}

async function loadFeed() {
  if (cfg.primarySource === 'xml') return parseXml(cfg.feedXml);
  return parseCsv(cfg.feedCsv);
}

main().catch((e) => {
  console.error('❌ Sync failed:', e);
  process.exit(1);
});