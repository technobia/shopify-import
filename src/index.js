import { cfg } from './config.js';
import { parseCsv } from './parsers/csv.js';
import { parseXml } from './parsers/xml.js';
import { discoverBySkus } from './sync/discover.js';
import { diffRecords } from './sync/diff.js';
import { toProductCreateInput, toProductUpdateInput } from './sync/build-jsonl.js';
import { createProduct, updateProduct, updateVariant } from './sync/perItem.js';


async function main() {
  const input = await loadFeed();
  const skus = input.map((x) => x.sku).filter(Boolean);

  const discovered = await discoverBySkus(skus);
  const { create, update } = diffRecords(input, discovered);
  console.log(`create=${create.length} update=${update.length}`);

  console.log('\n=== Creating Products ===');
  for (const { rec } of create) {
    try {
      const input = toProductCreateInput(rec);
      const result = await createProduct(input);
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

  console.log('\n=== Updating Products ===');
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

  console.log('Done.');
}


async function loadFeed() {
  if (cfg.primarySource === 'xml') return parseXml(cfg.feedXml);
  return parseCsv(cfg.feedCsv);
}


main().catch((e) => {
  console.error(e);
  process.exit(1);
});
