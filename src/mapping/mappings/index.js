import { zegMapping } from './zeg-mapping.js';
import { genericMapping } from './generic-mapping.js';

export const mappings = {
  zeg: zegMapping,
  generic: genericMapping,
  catalog: genericMapping,
};

export function getMappingByName(name) {
  const mapping = mappings[name.toLowerCase()];
  if (!mapping) {
    throw new Error(`Unknown mapping: ${name}. Available: ${Object.keys(mappings).join(', ')}`);
  }
  return mapping;
}

export function listMappings() {
  return Object.keys(mappings);
}

