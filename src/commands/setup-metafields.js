import { gql } from '../lib/api/client.js';
import { metafieldsMapping } from '../lib/mapping/mapping.js';

const CREATE_METAFIELD_DEFINITION = `
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        name
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function createMetafieldDefinition(key, config) {
  const definition = {
    name: config.name || key,
    namespace: config.namespace || 'custom',
    key: key,
    type: config.type || 'single_line_text_field',
    ownerType: 'PRODUCT'
  };

  try {
    const response = await gql(CREATE_METAFIELD_DEFINITION, { definition }, { cost: 10 });
    const result = response.data.metafieldDefinitionCreate;

    if (result.userErrors?.length > 0) {
      const errors = result.userErrors;
      if (errors.some(e => e.message.includes('already exists') || e.message.includes('taken'))) {
        console.log(`⚠️  ${key}`);
      } else {
        console.error(`✗ ${key}: ${errors[0].message}`);
      }
    } else {
      console.log(`✓ ${key}`);
    }
  } catch (error) {
    console.error(`✗ ${key}: ${error.message}`);
  }
}

async function main() {
  console.log('🔧 Setting up metafield definitions...\n');

  const entries = Object.entries(metafieldsMapping);

  for (const [key, config] of entries) {
    await createMetafieldDefinition(key, config);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ Setup complete');
}

main().catch((e) => {
  console.error('❌ Setup failed:', e);
  process.exit(1);
});

