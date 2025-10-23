import { cfg } from '../config.js';
import { parseCsv } from '../lib/parsers/csv.js';
import { parseXml } from '../lib/parsers/xml.js';
import { discoverBySkus } from '../lib/sync/discover.js';
import { diffRecords } from '../lib/sync/diff.js';
import { toProductCreateInput, toProductUpdateInput } from '../lib/sync/transform.js';
import { createProduct, updateProduct, updateVariant } from '../lib/api/products.js';

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log('🔄 Product Sync\n');

  const input = await loadFeed();
  console.log(`Loaded ${input.length} products`);
  console.log(`Chunk size: ${cfg.chunkItems}\n`);

  const chunks = chunkArray(input, cfg.chunkItems);
  console.log(`Processing in ${chunks.length} chunk(s)...\n`);

  let totalCreated = 0;
  let totalUpdated = 0;

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx];
    console.log(`📦 Chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} products)`);

    const skus = chunk.map((x) => x.sku).filter(Boolean);
    const discovered = await discoverBySkus(skus);
    console.log(`Found ${discovered.size} existing products in this chunk`);

    const { create, update } = diffRecords(chunk, discovered);
    console.log(`Create: ${create.length} | Update: ${update.length}\n`);

    if (create.length > 0) {
      console.log('Creating...');
      for (let i = 0; i < create.length; i++) {
        const { rec } = create[i];
        try {
          const { input, media } = toProductCreateInput(rec);
          const result = await createProduct(input, media);
          console.log(`✓ ${rec.sku} (${result.metafieldsCount} metafields)`);
          totalCreated++;

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
      console.log('Updating...');
      for (let i = 0; i < update.length; i++) {
        const { rec, ids } = update[i];
        try {
          const input = toProductUpdateInput(rec);
          await updateProduct(ids.productId, input);
          console.log(`✓ ${rec.sku}`);
          totalUpdated++;

          if (rec.price != null && ids.variantId) {
            await updateVariant(ids.variantId, { price: rec.price.toString(), sku: rec.sku });
          }
        } catch (e) {
          console.error(`✗ ${rec.sku}: ${e.message}`);
        }
      }
    }

    console.log('');
  }

  console.log(`✅ Done (${totalCreated} created, ${totalUpdated} updated)`);
}

async function loadFeed() {
  if (cfg.primarySource === 'xml') return parseXml(cfg.feedXml);
  return parseCsv(cfg.feedCsv);
}

main().catch((e) => {
  console.error('❌ Sync failed:', e);
  process.exit(1);
});