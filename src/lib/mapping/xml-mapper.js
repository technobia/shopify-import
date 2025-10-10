import { getMappingByName } from './mappings/index.js';

export class XmlMapper {
  constructor(config = {}) {
    if (typeof config === 'string') {
      this.config = getMappingByName(config);
    } else {
      this.config = config;
    }
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

    return mapped;
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

export function createMapper(mappingNameOrConfig = 'zeg') {
  return new XmlMapper(mappingNameOrConfig);
}

export const defaultMapper = new XmlMapper('zeg');

