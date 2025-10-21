import { cfg } from '../config.js';
import { parseCsv } from '../lib/parsers/csv.js';
import { parseXml } from '../lib/parsers/xml.js';
import { discoverBySkus } from '../lib/sync/discover.js';
import { updateVariant } from '../lib/api/products.js';

async function main() {
  console.log('💰 Starting Price Sync...\n');

  const input = await loadFeed();
  console.log(`📦 Loaded ${input.length} products from feed\n`);

  const skus = input.map((x) => x.sku).filter(Boolean);
  const discovered = await discoverBySkus(skus);
  console.log(`🔍 Found ${discovered.size} existing products\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  console.log('=== Updating Prices ===');
  for (let i = 0; i < input.length; i++) {
    const rec = input[i];
    if (!rec.sku || rec.price == null) {
      skipped++;
      continue;
    }

    try {
      const ids = discovered.get(rec.sku);

      if (!ids || !ids.variantId) {
        console.log(`⊘ Skipped ${rec.sku}: Product not found in Shopify`);
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
      console.log(`✓ Updated price: ${rec.sku} → ${rec.price}€`);
      updated++;
    } catch (e) {
      console.error(`✗ Failed to update ${rec.sku}:`, e.message);
      failed++;
    }
  }

  console.log('\n✅ Price sync complete!');
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
}

async function loadFeed() {
  if (cfg.primarySource === 'xml') return parseXml(cfg.feedXml);
  return parseCsv(cfg.feedCsv);
}

main().catch((e) => {
  console.error('❌ Price sync failed:', e);
  process.exit(1);
});