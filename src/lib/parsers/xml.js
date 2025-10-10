import fs from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import { createMapper } from '../mapping/xml-mapper.js';

export async function parseXml(path) {
  const xml = await fs.promises.readFile(path, 'utf8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  const data = parser.parse(xml);

  const format = detectFormat(data);
  const items = extractItems(data, format);
  const mapper = createMapper();

  return items.map(item => mapper.mapProduct(item));
}

function detectFormat(data) {
  if (data.ZEGSHOP) return 'zeg';
  if (data.catalog) return 'catalog';
  return 'generic';
}

function extractItems(data, format) {
  switch (format) {
    case 'zeg': {
      const hauptkategorien = toArray(data.ZEGSHOP?.HAUPTKATEGORIE);
      const items = [];

      hauptkategorien.forEach(haupt => {
        const kategorien = toArray(haupt?.KATEGORIE);
        kategorien.forEach(kat => {
          const artikel = toArray(kat?.ARTIKEL);
          items.push(...artikel);
        });
      });

      return items;
    }

    case 'catalog':
      return toArray(data.catalog?.item);

    case 'generic':
    default: {
      if (data.items) return toArray(data.items);
      if (data.products) return toArray(data.products);
      if (data.item) return toArray(data.item);
      return [];
    }
  }
}

function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
