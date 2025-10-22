import { xmlMapping, metafieldsMapping } from './mapping.js';

export class XmlMapper {
  constructor(config = xmlMapping, metafieldsConfig = metafieldsMapping) {
    this.config = config;
    this.metafieldsConfig = metafieldsConfig;
  }

  mapProduct(xmlItem) {
    const mapped = {};

    for (const [shopifyField, mapping] of Object.entries(this.config)) {
      if (typeof mapping === 'function') {
        mapped[shopifyField] = mapping(xmlItem);
      } else if (typeof mapping === 'string') {
        mapped[shopifyField] = this.getValue(xmlItem, mapping);
      } else if (mapping.path) {
        const value = this.getValue(xmlItem, mapping.path);
        mapped[shopifyField] = mapping.transform ? mapping.transform(value, xmlItem) : value;
      }
    }

    if (this.metafieldsConfig) {
      mapped.metafields = this.mapMetafields(xmlItem);
    }

    return mapped;
  }

  mapMetafields(xmlItem) {
    const metafields = [];

    for (const [key, config] of Object.entries(this.metafieldsConfig)) {
      const value = this.getValue(xmlItem, config.path);

      if (value === null || value === undefined || value === '') {
        continue;
      }

      const transformedValue = config.transform
        ? config.transform(value, xmlItem)
        : String(value);

      if (transformedValue === null || transformedValue === undefined) {
        continue;
      }

      metafields.push({
        namespace: config.namespace || 'custom',
        key: key,
        value: transformedValue,
        type: config.type || 'single_line_text_field'
      });
    }

    return metafields;
  }

  getValue(obj, path) {
    if (!path) return null;

    if (obj[path] !== undefined) {
      return obj[path];
    }

    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
      if (value === null || value === undefined) return null;
      value = value[part];
    }
    return value;
  }
}

export function createMapper(config) {
  return new XmlMapper(config);
}

export const defaultMapper = new XmlMapper();

