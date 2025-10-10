import { gql } from '../api/client.js';


const Q = /* GraphQL */ `
    query FindVariants($query: String!, $first: Int = 50) {
        productVariants(first: $first, query: $query) {
            edges { node { id sku product { id } } }
            pageInfo { hasNextPage endCursor }
        }
    }
`;


export async function discoverBySkus(skus) {
  const mapping = new Map();
  for (const sku of skus) {
    const query = `sku:${escapeSku(sku)}`;
    let hasNext = true, cursor = undefined;
    while (hasNext) {
      const data = await gql(Q, { query, first: 50, after: cursor });
      const pv = data.productVariants;
      pv.edges.forEach((e) => mapping.set(sku, { productId: e.node.product.id, variantId: e.node.id }));
      hasNext = pv.pageInfo.hasNextPage;
      cursor = pv.pageInfo.endCursor;
    }
  }
  return mapping;
}


function escapeSku(s) {
  return s.replace(/\s+/g, '\\ ');
}
