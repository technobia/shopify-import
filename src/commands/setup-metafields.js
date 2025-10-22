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

const SHOPIFY_TYPE_MAP = {
  'single_line_text_field': 'single_line_text_field',
  'multi_line_text_field': 'multi_line_text_field',
  'number_integer': 'number_integer',
  'number_decimal': 'number_decimal',
  'boolean': 'boolean',
  'date': 'date'
};

const FIELD_NAMES = {
  manufacturer_number: 'Manufacturer Number',
  internal_article_number: 'Internal Article Number',
  model_year: 'Model Year',
  product_group: 'Product Group',
  variant_article_number: 'Variant Article Number',
  reference_article_number: 'Reference Article Number',
  reference_article_number_2: 'Reference Article Number 2',
  supplier_short_name: 'Supplier Short Name',
  supplier_code: 'Supplier Code',
  model: 'Model',
  color: 'Color',
  new_date: 'New Date',
  is_discontinued: 'Is Discontinued',
  is_blocked: 'Is Blocked',
  package_shipping: 'Package Shipping',
  shipping_type: 'Shipping Type',
  net_price: 'Net Price',
  recommended_price: 'Recommended Price',
  original_price: 'Original Price',
  tax_indicator: 'Tax Indicator'
};

async function createMetafieldDefinition(key, config) {
  const definition = {
    name: FIELD_NAMES[key] || key,
    namespace: config.namespace || 'custom',
    key: key,
    type: SHOPIFY_TYPE_MAP[config.type] || 'single_line_text_field',
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

