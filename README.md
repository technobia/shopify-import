# Shopify Product Import

A flexible Node.js tool for syncing products, prices, and inventory from CSV/XML feeds to Shopify.

## Features

✨ **Multiple Sync Modes**
- 🛍️ Full Product Sync - Create/update products with all details
- 💰 Price Sync - Fast price-only updates
- 📦 Stock Sync - Inventory quantity updates

🔧 **Flexible Input Formats**
- CSV (Shopify export format and custom formats)
- XML (with configurable field mapping)
- Support for custom data sources

🎯 **Smart Syncing**
- SKU-based product matching via Shopify API
- Automatic duplicate prevention
- Update existing or create new products
- Direct Shopify queries (no local database)

📊 **Production Ready**
- Detailed logging and error handling
- Configurable via environment variables
- Simple and straightforward architecture

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Shopify credentials
nano .env
```

## Configuration

The scripts automatically use the source and mapping specified in your `.env` file.

### Environment Variables

Create a `.env` file in the project root:

```env
# Required: Shopify Credentials
SHOPIFY_SHOP=your-shop.myshopify.com
SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Feed Configuration
PRIMARY_SOURCE=xml          # 'csv' or 'xml'
CSV_SOURCE=./data/products.csv
XML_SOURCE=./data/products.xml
XML_FORMAT=zeg             # 'zeg', 'catalog', or 'generic'
```

### Getting Shopify Credentials

1. Go to your Shopify Admin
2. Navigate to **Settings** > **Apps and sales channels**
3. Click **Develop apps** > **Create an app**
4. Set up API scopes:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
5. Install the app and copy the **Admin API access token**


## Usage

### Product Sync

Full synchronization including titles, descriptions, images, prices, etc.

```bash
npm run sync:products
```

**Use when:**
- Setting up initial import
- Product details changed (title, description, images)
- Adding new products
- Updating product attributes

### Price Sync

Fast price-only updates (much faster than full product sync).

```bash
npm run sync:price
```

**Use when:**
- Regular price updates
- Promotional pricing
- Price corrections
- Running frequent automated updates

### Stock Sync

Inventory quantity updates only (fastest sync mode).

```bash
npm run sync:stock
```

**Use when:**
- Real-time inventory sync
- Warehouse inventory updates
- Frequent stock adjustments
- Multiple daily updates

### Full Sync (Legacy)

Original sync command - same as `sync:products`.

```bash
npm run sync
```

## Input File Formats

### CSV Format

Supports Shopify export format:

```csv
Handle,Title,Body (HTML),Vendor,Type,Variant SKU,Variant Price,Variant Inventory Qty,Image Src,Status
product-1,Product Name,<p>Description</p>,Vendor Name,Type,SKU-001,19.99,100,https://example.com/image.jpg,active
```

Or custom format:

```csv
sku,title,price,inventory,status,description,images,vendor
SKU-001,Product Name,19.99,100,active,Description text,https://example.com/image.jpg,Vendor
```

### XML Format

Default format is ZEG (German bike shop format):

```xml
<ZEGSHOP>
  <HAUPTKATEGORIE>
    <KATEGORIE>
      <ARTIKEL>
        <ARTNR>022-00444</ARTNR>
        <BEZEICHNUNG>Product Name</BEZEICHNUNG>
        <VK>9,99</VK>
        <MARKE>Brand</MARKE>
        <BILDER_URL>
          <BILD_URL>https://example.com/image.jpg</BILD_URL>
        </BILDER_URL>
      </ARTIKEL>
    </KATEGORIE>
  </HAUPTKATEGORIE>
</ZEGSHOP>
```


## XML Field Mapping

The tool uses **mapping configuration objects** to define how XML fields map to Shopify. This makes it easy to:

- 📝 Create custom mappings for different suppliers
- 🔄 Switch between mappings via environment variable
- 🎯 Keep complex transformation logic organized
- 🚀 Share and reuse mappings

### Quick Mapping Example

```javascript
// src/mapping/mappings/my-mapping.js
export const myMapping = {
  sku: 'product_code',      // Simple mapping
  title: 'product_name',
  
  price: {                   // With transformation
    path: 'price_cents',
    transform: (value) => Number(value) / 100
  },
  
  images: (item) => {        // Complex logic
    return item.image_urls?.split(',') || [];
  }
};
```


## How It Works

### 1. Load Phase
- Loads products from your feed (CSV/XML)
- Extracts SKUs from your products

### 2. Discovery Phase
- Queries Shopify by SKU to find existing products
- Returns product IDs for existing products

### 3. Sync Phase
- **Create**: Products not found in Shopify
- **Update**: Products found in Shopify
- Logs all operations with detailed output

## Project Structure

```
shopify-import/
├── src/
│   ├── config.js              # Configuration management
│   ├── index.js               # Original sync script
│   ├── sync-products.js       # Product sync script
│   ├── sync-price.js          # Price sync script
│   ├── sync-stock.js          # Stock sync script
│   ├── shopify.js             # Shopify API wrapper
│   ├── parsers/
│   │   ├── csv.js            # CSV parser
│   │   └── xml.js            # XML parser with format detection
│   ├── mapping/
│   │   ├── xml-mapper.js     # XML field mapping service
│   │   └── mappings/
│   │       ├── index.js              # Mapping registry
│   │       ├── zeg-mapping.js        # ZEG format (default)
│   │       └── generic-mapping.js    # Generic format
│   └── sync/
│       ├── discover.js       # Product discovery in Shopify
│       ├── diff.js           # Create/update categorization
│       ├── build-jsonl.js    # Bulk operation helpers
│       ├── bulk.js           # Bulk API operations
│       └── perItem.js        # Individual product operations
├── data/
│   ├── products.csv          # CSV data files
│   └── products.xml          # XML data files
├── package.json
└── README.md                 # This file
```

## Examples

### Daily Price Update

```bash
# Update prices every day at 6 AM (using cron)
0 6 * * * cd /path/to/shopify-import && npm run sync:price
```

### Hourly Stock Sync

```bash
# Update inventory every hour
0 * * * * cd /path/to/shopify-import && npm run sync:stock
```

### Full Product Sync (Weekly)

```bash
# Full product sync every Sunday at 2 AM
0 2 * * 0 cd /path/to/shopify-import && npm run sync:products
```

### Custom Sync Script

```javascript
import { parseXml } from './src/parsers/xml.js';
import { createMapper } from './src/mapping/xml-mapper.js';

// Custom mapper for your XML format
const customMapper = createMapper({
  sku: 'product_code',
  title: 'product_name',
  price: {
    path: 'price_amount',
    transform: (value) => Number(value) / 100
  }
});

// Parse with custom mapper
const products = await parseXml('./data/feed.xml', { 
  mapper: customMapper 
});

console.log(`Loaded ${products.length} products`);
```

## Troubleshooting

### Products Not Updating

1. Check SKU matches exactly (case-sensitive)
2. Verify product exists in Shopify
3. Check hash changes - may be marked as unchanged
4. Look for error messages in output

### API Rate Limits

If you hit rate limits:
1. Use specific sync modes (price/stock) instead of full sync
2. Add delays between sync runs
3. Consider Shopify Plus for higher limits

### Missing Fields

For XML:
1. Check field mapping in `src/mapping/mappings/`
2. Verify field names in your XML match the mapping
3. Set correct `XML_FORMAT` in .env

For CSV:
1. Ensure column names match expected format
2. Check `src/parsers/csv.js` for supported columns

## Development

### Running Tests

```bash
# Add test command when tests are added
npm test
```

### Debug Mode

```bash
# Set NODE_ENV for more verbose logging
NODE_ENV=development npm run sync:products
```

### Adding New Features

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Performance Tips

1. **Use specific sync modes**: `sync:price` and `sync:stock` are much faster than `sync:products`
2. **Optimize feed size**: Only include products that need updating
3. **Schedule wisely**: Run heavy syncs during off-peak hours
4. **Monitor state database**: Keep it clean, reset if needed
5. **Space out sync runs**: Avoid running syncs too frequently

## Security Notes

- Never commit `.env` file
- Keep Shopify access token secure
- Use read-only tokens for testing
- Limit API scope to minimum required
- Regularly rotate access tokens

## Contributing

Contributions are welcome! Please:
1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Test with real Shopify store (dev store recommended)

## License

ISC

## Support

For issues and questions:
- Review error messages in console output
- Check configuration in `.env` file
- Check mapping configuration in `src/mapping/mappings/`
- Check Shopify API documentation
- Open an issue on GitHub

## Changelog

### v1.1.0
- ✨ Added XML mapping service
- ✨ Separate sync scripts (products, price, stock)
- ✨ Support for ZEG XML format
- 📚 Comprehensive documentation
- ⚡ Performance improvements

### v1.0.0
- 🎉 Initial release
- CSV and XML support
- Basic product sync
- SKU-based matching

