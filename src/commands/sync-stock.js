import { cfg } from '../config.js';
import { parseCsv } from '../lib/parsers/csv.js';
import { parseXml } from '../lib/parsers/xml.js';
import { discoverBySkus } from '../lib/sync/discover.js';
import { gql } from '../lib/api/client.js';

async function main() {
  console.log('📦 Starting Stock Sync...\n');

  const input = await loadFeed();
  console.log(`📦 Loaded ${input.length} products from feed\n`);

  const skus = input.map((x) => x.sku).filter(Boolean);
  const discovered = await discoverBySkus(skus);
  console.log(`🔍 Found ${discovered.size} existing products\n`);

  const locations = await getInventoryLocations();
  if (locations.length === 0) {
    throw new Error('No inventory locations found. Please configure at least one location in Shopify.');
  }

  const primaryLocation = locations[0];
  console.log(`📍 Using location: ${primaryLocation.name} (${primaryLocation.id})\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  console.log('=== Updating Inventory ===');
  for (let i = 0; i < input.length; i++) {
    const rec = input[i];
    if (!rec.sku) {
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

      const inventoryItemId = await getInventoryItemId(ids.variantId);

      if (!inventoryItemId) {
        console.log(`⊘ Skipped ${rec.sku}: No inventory item found`);
        skipped++;
        continue;
      }

      const quantity = Number(rec.inventory ?? 0);
      await setInventoryQuantity(inventoryItemId, primaryLocation.id, quantity);

      console.log(`✓ Updated stock: ${rec.sku} → ${quantity} units`);
      updated++;
    } catch (e) {
      console.error(`✗ Failed to update ${rec.sku}:`, e.message);
      failed++;
    }
  }

  console.log('\n✅ Stock sync complete!');
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
}

async function getInventoryLocations() {
  const query = `
    query {
      locations(first: 10) {
        edges {
          node {
            id
            name
            isActive
          }
        }
      }
    }
  `;

  const response = await gql(query, {}, { cost: 1 });
  const data = response.data;
  return data.locations.edges
    .map(e => e.node)
    .filter(loc => loc.isActive);
}

async function getInventoryItemId(variantId) {
  const query = `
    query getInventoryItem($id: ID!) {
      productVariant(id: $id) {
        inventoryItem {
          id
        }
      }
    }
  `;

  const response = await gql(query, { id: variantId }, { cost: 1 });
  const data = response.data;
  return data.productVariant?.inventoryItem?.id;
}

async function setInventoryQuantity(inventoryItemId, locationId, quantity) {
  const mutation = `
    mutation setInventory($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryAdjustmentGroup {
          reason
          changes {
            name
            delta
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    reason: 'correction',
    quantities: [
      {
        inventoryItemId,
        locationId,
        quantity
      }
    ]
  };

  const response = await gql(mutation, { input }, { cost: 10 });
  const data = response.data;

  if (data.inventorySetQuantities.userErrors?.length > 0) {
    throw new Error(JSON.stringify(data.inventorySetQuantities.userErrors));
  }

  return data;
}

async function loadFeed() {
  if (cfg.primarySource === 'xml') return parseXml(cfg.feedXml);
  return parseCsv(cfg.feedCsv);
}

main().catch((e) => {
  console.error('❌ Stock sync failed:', e);
  process.exit(1);
});