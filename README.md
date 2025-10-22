# Shopify Product Import

Node.js tool for syncing products, prices, and inventory from CSV/XML feeds to Shopify.

## Features

- 🛍️ **Full Product Sync** - Create/update products with all details
- 💰 **Price Sync** - Fast price-only updates
- 📦 **Stock Sync** - Inventory quantity updates
- 🏷️ **Metafields Support** - Store custom XML fields as metafields
- 📄 **CSV & XML Support** - Flexible input formats
- 🎯 **SKU-based Matching** - Automatic duplicate prevention

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your Shopify credentials
npm run sync:products
```

## Configuration

Create `.env` file:

```env
SHOPIFY_SHOP=your-shop.myshopify.com
SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

PRIMARY_SOURCE=csv          # 'csv' or 'xml'
SOURCE_CSV=./data/products.csv
SOURCE_XML=./data/products.xml
```

### Get Shopify Token

1. **Settings** > **Apps and sales channels** > **Develop apps**
2. Create app with scopes: `read_products`, `write_products`, `read_inventory`, `write_inventory`, `read_metaobjects`, `write_metaobjects`
3. Copy **Admin API access token**

## Usage

```bash
# Setup metafield definitions (run once)
npm run setup:metafields

# Full product sync (titles, descriptions, images, prices, metafields)
npm run sync:products

# Price-only updates (faster)
npm run sync:price

# Inventory-only updates (fastest)
npm run sync:stock
```

## CSV Format

Supports Shopify export format:
```csv
Handle,Title,Variant SKU,Variant Price,Variant Inventory Qty,Image Src,Status
product-1,Product Name,SKU-001,19.99,100,https://example.com/image.jpg,active
```

## XML Format

Edit `src/lib/mapping/mapping.js` to match your XML structure:

```javascript
export const xmlMapping = {
  sku: { path: 'ARTNR' },
  title: { path: 'BEZEICHNUNG' },
  price: {
    path: 'VK',
    transform: (value) => Number(value.replace(',', '.'))
  },
  images: (item) => item.BILDER_URL?.BILD_URL || []
};
```


