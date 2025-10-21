import { cfg } from '../../config.js';
import { rateLimiter } from '../rate-limiter.js';

const base = `https://${cfg.shop}/admin/api/${cfg.apiVersion}`;

export async function gql(query, variables = {}, options = {}) {
  const { cost = 1, skipRateLimit = false } = options;

  if (!skipRateLimit) {
    await rateLimiter.waitForAvailability(cost);
  }

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

  if (json.extensions?.cost?.throttleStatus) {
    rateLimiter.updateFromResponse(json.extensions.cost.throttleStatus);
  }

  const actualCost = json.extensions?.cost?.actualQueryCost || cost;
  if (!skipRateLimit) {
    rateLimiter.consumePoints(actualCost);
  }

  return {
    data: json.data,
    extensions: json.extensions
  };
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