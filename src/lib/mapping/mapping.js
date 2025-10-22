export const xmlMapping = {
  sku: {
    path: 'ARTNR',
    transform: (value) => value ? String(value).trim() : null
  },

  title: {
    path: 'BEZEICHNUNG',
    transform: (value, item) => value || item.KURZBEZEICHNUNG || ''
  },

  price: {
    path: 'VK',
    transform: (value) => {
      if (!value) return 0;
      const normalized = String(value).replace(',', '.');
      return Number(normalized) || 0;
    }
  },

  compareAtPrice: {
    path: 'VKSTREICH',
    transform: (value) => {
      if (!value || value === '0' || value === '0,00') return null;
      const normalized = String(value).replace(',', '.');
      const price = Number(normalized);
      return price > 0 ? price : null;
    }
  },

  inventory: {
    path: null,
    transform: () => 0
  },

  status: {
    path: 'GESPERRT',
    transform: (value, item) => {
      if (value === 'J') return 'draft';
      if (item.AUSLAUF === '1') return 'archived';
      return 'active';
    }
  },

  descriptionHtml: {
    path: 'LANGTEXT',
    transform: (value, item) => {
      const text = value || item.KURZTEXT || '';
      if (!text) return '';
      return `<p>${text}</p>`;
    }
  },

  images: (item) => {
    if (item.BILDER_URL?.BILD_URL) {
      const urls = Array.isArray(item.BILDER_URL.BILD_URL)
        ? item.BILDER_URL.BILD_URL
        : [item.BILDER_URL.BILD_URL];
      return urls.filter(Boolean);
    }
    return [];
  },

  vendor: {
    path: 'MARKE',
    transform: (value) => value || ''
  },

  productType: {
    path: 'ARTSN',
    transform: (value) => value || ''
  },

  barcode: {
    path: 'EANNR',
    transform: (value) => value || ''
  },

  manufacturerSku: {
    path: 'HERSTNR',
    transform: (value) => value || ''
  },

  options: (item) => {
    const options = [];

    if (item.MERKMAL) {
      const merkmale = Array.isArray(item.MERKMAL) ? item.MERKMAL : [item.MERKMAL];

      merkmale.forEach(merkmal => {
        if (merkmal.MERKMAL && merkmal.AUSPRAEGUNG) {
          const optionName = String(merkmal.MERKMAL).trim();
          const optionValue = String(merkmal.AUSPRAEGUNG).trim();

          let option = options.find(opt => opt.name === optionName);
          if (!option) {
            option = { name: optionName, values: [] };
            options.push(option);
          }

          if (!option.values.includes(optionValue)) {
            option.values.push(optionValue);
          }
        }
      });
    }

    return options;
  },

  tags: (item) => {
    const tags = [];

    if (item.MARKE) tags.push(item.MARKE);
    if (item.FARBE) tags.push(item.FARBE);
    if (item.MODELL && item.MODELL !== '0') tags.push(item.MODELL);
    if (item.MODELLJAHR && item.MODELLJAHR !== '0') tags.push(`Jahr ${item.MODELLJAHR}`);

    return tags.filter(Boolean);
  }
};

const METAFIELD_TYPES = {
  text: 'single_line_text_field',
  textarea: 'multi_line_text_field',
  number_integer: 'number_integer',
  number_decimal: 'number_decimal',
  boolean: 'boolean',
  date: 'date'
};

export const metafieldsMapping = {
  manufacturer_number: {
    name: 'Manufacturer Number',
    path: 'HERSTNR',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  internal_article_number: {
    name: 'Internal Article Number',
    path: 'INTARTNR',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  model_year: {
    name: 'Model Year',
    path: 'MODELLJAHR',
    type: METAFIELD_TYPES.number_integer,
    namespace: 'custom',
    transform: (value) => {
      if (!value || value === '0') return null;
      return String(value);
    }
  },

  product_group: {
    name: 'Product Group',
    path: 'WARENGRUPPE',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  variant_article_number: {
    name: 'Variant Article Number',
    path: 'VARARTNR',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  reference_article_number: {
    name: 'Reference Article Number',
    path: 'REFARTNR',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  reference_article_number_2: {
    name: 'Reference Article Number 2',
    path: 'REFARTNR2',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  supplier_short_name: {
    name: 'Supplier Short Name',
    path: 'LFKURZBEZ',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  supplier_code: {
    name: 'Supplier Code',
    path: 'LFSN',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  model: {
    name: 'Model',
    path: 'MODELL',
    type: METAFIELD_TYPES.text,
    namespace: 'custom',
    transform: (value) => {
      if (!value || value === '0') return null;
      return value;
    }
  },

  color: {
    name: 'Color',
    path: 'FARBE',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  new_date: {
    name: 'New Date',
    path: 'NEUDATUM',
    type: METAFIELD_TYPES.date,
    namespace: 'custom',
    transform: (value) => {
      if (!value) return null;
      return value;
    }
  },

  is_discontinued: {
    name: 'Is Discontinued',
    path: 'AUSLAUF',
    type: METAFIELD_TYPES.boolean,
    namespace: 'custom',
    transform: (value) => {
      return value === '1' ? 'true' : 'false';
    }
  },

  is_blocked: {
    name: 'Is Blocked',
    path: 'GESPERRT',
    type: METAFIELD_TYPES.boolean,
    namespace: 'custom',
    transform: (value) => {
      return value === 'J' ? 'true' : 'false';
    }
  },

  package_shipping: {
    name: 'Package Shipping',
    path: 'PAKETVERSAND',
    type: METAFIELD_TYPES.boolean,
    namespace: 'custom',
    transform: (value) => {
      return value === '1' ? 'true' : 'false';
    }
  },

  shipping_type: {
    name: 'Shipping Type',
    path: 'VERSANDART',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  },

  net_price: {
    name: 'Net Price',
    path: 'VKNETTO',
    type: METAFIELD_TYPES.number_decimal,
    namespace: 'custom',
    transform: (value) => {
      if (!value) return null;
      const normalized = String(value).replace(',', '.');
      return normalized;
    }
  },

  recommended_price: {
    name: 'Recommended Price',
    path: 'VKEMPF',
    type: METAFIELD_TYPES.number_decimal,
    namespace: 'custom',
    transform: (value) => {
      if (!value) return null;
      const normalized = String(value).replace(',', '.');
      return normalized;
    }
  },

  original_price: {
    name: 'Original Price',
    path: 'VKORG',
    type: METAFIELD_TYPES.number_decimal,
    namespace: 'custom',
    transform: (value) => {
      if (!value) return null;
      const normalized = String(value).replace(',', '.');
      return normalized;
    }
  },

  tax_indicator: {
    name: 'Tax Indicator',
    path: 'MWSTKZ',
    type: METAFIELD_TYPES.text,
    namespace: 'custom'
  }
};

