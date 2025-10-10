import { cfg } from './config.js';

const base = `https://${cfg.shop}/admin/api/${cfg.apiVersion}`;

export async function gql(query, variables = {}) {
  const res = await fetch(`${base}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': cfg.token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`GraphQL error: ${res.status} ${JSON.stringify(json)}`);
  }
  return json.data;
}

export async function rest(path, method = 'GET', body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': cfg.token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`REST ${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}
