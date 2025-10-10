export const genericMapping = {
  sku: 'sku',
  title: 'title',

  price: {
    path: 'price',
    transform: (value) => Number(value) || 0
  },

  compareAtPrice: {
    path: 'compareAtPrice',
    transform: (value) => value ? Number(value) : null
  },

  inventory: {
    path: 'inventory',
    transform: (value) => Number(value ?? 0)
  },

  status: {
    path: 'status',
    transform: (value) => (value || 'active').toLowerCase()
  },

  descriptionHtml: {
    path: 'descriptionHtml',
    transform: (value, item) => value || item.description || ''
  },

  images: (item) => {
    if (item.images) {
      if (Array.isArray(item.images)) return item.images;
      if (typeof item.images === 'string') return item.images.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (item.image) return [item.image];
    return [];
  },

  vendor: {
    path: 'vendor',
    transform: (value) => value || ''
  },

  productType: {
    path: 'productType',
    transform: (value, item) => value || item.type || ''
  },

  barcode: {
    path: 'barcode',
    transform: (value, item) => value || item.ean || item.gtin || ''
  },

  options: (item) => {
    if (item.options && Array.isArray(item.options)) {
      return item.options;
    }
    return [];
  },

  tags: (item) => {
    if (item.tags) {
      if (Array.isArray(item.tags)) return item.tags;
      if (typeof item.tags === 'string') return item.tags.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }
};

