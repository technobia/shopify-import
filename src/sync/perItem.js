import { gql, rest } from '../shopify.js';


const CREATE_PRODUCT = /* GraphQL */ `
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


const UPDATE_PRODUCT = /* GraphQL */ `
    mutation UpdateProduct($product: ProductUpdateInput!) {
        productUpdate(product: $product) { product { id } userErrors { field message } }
    }
`;


export async function createProduct(input, media) {
    const variables = { input };
    if (media?.length > 0) {
        variables.media = media;
    }
    const d = await gql(CREATE_PRODUCT, variables);
    const errs = d.productCreate.userErrors;
    if (errs?.length) throw new Error(JSON.stringify(errs));
    const product = d.productCreate.product;
    const variantId = product.variants.edges[0]?.node?.id;
    return { productId: product.id, variantId };
}


export async function updateProduct(id, input) {
    const product = { id, ...input };
    const d = await gql(UPDATE_PRODUCT, { product });
    const errs = d.productUpdate.userErrors;
    if (errs?.length) throw new Error(JSON.stringify(errs));
    return d.productUpdate.product.id;
}


export async function updateVariant(id, input) {
    const numericId = id.split('/').pop();
    const result = await rest(`/variants/${numericId}.json`, 'PUT', { variant: input });
    return result.variant?.id;
}
