import { cfg } from '../config.js';
import { parseCsv } from '../lib/parsers/csv.js';
import { parseXml } from '../lib/parsers/xml.js';
import { discoverBySkus } from '../lib/sync/discover.js';
import { updateVariant } from '../lib/api/products.js';

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log('💰 Price Sync\n');

  const input = await loadFeed();
  console.log(`Loaded ${input.length} products`);
  console.log(`Chunk size: ${cfg.chunkItems}\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const chunks = chunkArray(input, cfg.chunkItems);
  console.log(`Processing in ${chunks.length} chunk(s)...\n`);

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx];
    console.log(`📦 Chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} products)`);

    const skus = chunk.map((x) => x.sku).filter(Boolean);
    const discovered = await discoverBySkus(skus);
    console.log(`Found ${discovered.size} existing products in this chunk\n`);

    console.log('Updating...');
    for (let i = 0; i < chunk.length; i++) {
      const rec = chunk[i];
      if (!rec.sku || rec.price == null) {
        skipped++;
        continue;
      }

      try {
        const ids = discovered.get(rec.sku);

        if (!ids || !ids.variantId) {
          console.log(`⊘ ${rec.sku}`);
          skipped++;
          continue;
        }

        const variantInput = {
          price: rec.price.toString()
        };

        if (rec.compareAtPrice && rec.compareAtPrice > rec.price) {
          variantInput.compare_at_price = rec.compareAtPrice.toString();
        }

        await updateVariant(ids.variantId, variantInput);
        console.log(`✓ ${rec.sku} → ${rec.price}€`);
        updated++;
      } catch (e) {
        console.error(`✗ ${rec.sku}: ${e.message}`);
        failed++;
      }
    }

    console.log('');
  }

  console.log(`✅ Done (${updated} updated, ${skipped} skipped, ${failed} failed)`);
}

async function loadFeed() {
  if (cfg.primarySource === 'xml') return parseXml(cfg.xmlSource);
  return parseCsv(cfg.csvSource);
}

main().catch((e) => {
  console.error('❌ Sync failed:', e);
  process.exit(1);
});