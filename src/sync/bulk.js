import fs from 'node:fs';
import { gql } from '../shopify.js';


const STAGED_UPLOADS = /* GraphQL */ `
    mutation StagedUploads($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } }
    }
`;


const RUN_BULK = /* GraphQL */ `
    mutation RunBulk($mutation: String!, $stagedUploadPath: String!) {
        bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath) {
            bulkOperation { id status }
            userErrors { field message }
        }
    }
`;


const CURRENT_BULK = /* GraphQL */ `
    query { currentBulkOperation { id status errorCode objectCount fileUrl } }
`;


export async function runBulk(jsonlPath, mutationName) {
// 1) Request staged upload target
  const up = await gql(STAGED_UPLOADS, {
    input: [{
      resource: 'BULK_MUTATION_VARIABLES',
      filename: jsonlPath.split('/').pop(),
      mimeType: 'application/jsonl',
      httpMethod: 'POST'
    }]
  });
  const target = up.stagedUploadsCreate.stagedTargets[0];
  if (!target) throw new Error('No staged upload target');


// 2) Upload JSONL to S3 direct POST
  const form = new URLSearchParams();
  target.parameters.forEach(p => form.append(p.name, p.value));
  const file = await fs.promises.readFile(jsonlPath);
  const res = await fetch(target.url, { method: 'POST', body: formToBlob(form, file) });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);


// 3) Run bulk mutation
  const mutation = buildMutationString(mutationName);
  const run = await gql(RUN_BULK, { mutation, stagedUploadPath: target.resourceUrl });
  if (run.bulkOperationRunMutation.userErrors?.length) {
    throw new Error(JSON.stringify(run.bulkOperationRunMutation.userErrors));
  }


// 4) Poll until finished
  let status = 'RUNNING', last;
  while (status === 'RUNNING') {
    await new Promise(r => setTimeout(r, 5000));
    const d = await gql(CURRENT_BULK);
    last = d.currentBulkOperation;
    status = last?.status ?? 'COMPLETED';
    process.stdout.write(`\rBulk status: ${status} count=${last?.objectCount ?? 0}`);
  }
  console.log('\nBulk done:', last?.status, last?.fileUrl || '');
  if (last?.errorCode) throw new Error(`Bulk error: ${last.errorCode}`);
  return last;
}


function formToBlob(form, file) {
// Convert URLSearchParams + file into multipart/form-data
// Node 18: use FormData
  const fd = new FormData();
  for (const [k, v] of form) fd.append(k, v);
  fd.append('file', new Blob([file]), 'data.jsonl');
  return fd;
}


function buildMutationString(name) {
  if (name === 'productCreate') {
    return /* GraphQL */ `mutation bulkCreate($input: ProductInput!) { productCreate(input: $input) { product { id } userErrors { field message } } }`;
  }
  if (name === 'productUpdate') {
    return /* GraphQL */ `mutation bulkUpdate($id: ID!, $input: ProductInput!) { productUpdate(input: $input, id: $id) { product { id } userErrors { field message } } }`;
  }
  if (name === 'productVariantUpdate') {
    return /* GraphQL */ `mutation bulkVarUpdate($id: ID!, $input: ProductVariantInput!) { productVariantUpdate(id: $id, input: $input) { productVariant { id } userErrors { field message } } }`;
  }
  throw new Error('Unknown mutation for bulk');
}
