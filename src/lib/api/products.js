import { gql, rest } from './client.js';

const CREATE_PRODUCT = `
    mutation CreateProduct($input: ProductInput!, $media: [CreateMediaInput!]) {
        productCreate(input: $input, media: $media) { 
            product { 
                id 
                variants(first: 1) { 
                    edges { 
                        node { id sku } 
                    } 
                } 
            } 
            userErrors { field message } 
        }
    }
`;

const UPDATE_PRODUCT = `
    mutation UpdateProduct($product: ProductUpdateInput!) {
        productUpdate(product: $product) { product { id } userErrors { field message } }
    }
`;

export async function createProduct(input, media) {
    const variables = { input };
    if (media?.length > 0) {
        variables.media = media;
    }
    const response = await gql(CREATE_PRODUCT, variables, { cost: 10 });
    const d = response.data;
    const errs = d.productCreate.userErrors;
    if (errs?.length) throw new Error(JSON.stringify(errs));
    const product = d.productCreate.product;
    const variantId = product.variants.edges[0]?.node?.id;

    return {
        productId: product.id,
        variantId,
        throttleStatus: response.extensions?.cost?.throttleStatus
    };
}

export async function updateProduct(id, input) {
    const product = { id, ...input };
    const response = await gql(UPDATE_PRODUCT, { product }, { cost: 10 });
    const d = response.data;
    const errs = d.productUpdate.userErrors;
    if (errs?.length) throw new Error(JSON.stringify(errs));

    return {
        productId: d.productUpdate.product.id,
        throttleStatus: response.extensions?.cost?.throttleStatus
    };
}

export async function updateVariant(id, input) {
    const numericId = id.split('/').pop();
    const result = await rest(`/variants/${numericId}.json`, 'PUT', { variant: input });
    return result.variant?.id;
}