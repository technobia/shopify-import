import { cfg } from '../config.js';
import { parseCsv } from '../lib/parsers/csv.js';
import { parseXml } from '../lib/parsers/xml.js';
import { discoverBySkus } from '../lib/sync/discover.js';
import { gql } from '../lib/api/client.js';

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log('📦 Stock Sync\n');

  const input = await loadFeed();
  console.log(`Loaded ${input.length} products`);

  const locations = await getInventoryLocations();
  if (locations.length === 0) {
    throw new Error('No inventory locations found. Please configure at least one location in Shopify.');
  }

  const primaryLocation = locations[0];
  console.log(`Using location: ${primaryLocation.name}`);
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
      if (!rec.sku) {
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

        const inventoryItemId = await getInventoryItemId(ids.variantId);

        if (!inventoryItemId) {
          console.log(`⊘ ${rec.sku}`);
          skipped++;
          continue;
        }

        const quantity = Number(rec.inventory ?? 0);
        await setInventoryQuantity(inventoryItemId, primaryLocation.id, quantity);

        console.log(`✓ ${rec.sku} → ${quantity}`);
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
  console.error('❌ Sync failed:', e);
  process.exit(1);
});