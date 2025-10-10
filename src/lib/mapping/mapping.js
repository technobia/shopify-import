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

