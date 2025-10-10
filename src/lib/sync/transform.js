import fs from 'node:fs';


export function buildCreateJsonl(path, createItems) {
  const lines = createItems.map(({ rec }) => {
    const { input, media } = toProductCreateInput(rec);
    const line = { input };
    if (media) line.media = media;
    return line;
  });
  fs.writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n'));
}


export function buildUpdateJsonl(path, updateItems) {
  const lines = updateItems.map(({ rec, ids }) => ({ id: ids.productId, input: toProductUpdateInput(rec) }));
  fs.writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n'));
}


export function toProductCreateInput(rec) {
  const input = {
    title: rec.title,
    status: rec.status.toUpperCase(),
    descriptionHtml: rec.descriptionHtml,
    vendor: rec.vendor,
    productType: rec.productType,
  };

  const media = rec.images?.length > 0
    ? rec.images.map(src => ({
      originalSource: src,
      mediaContentType: 'IMAGE'
    }))
    : undefined;

  return { input, media };
}


export function toProductUpdateInput(rec) {
  return {
    title: rec.title,
    status: rec.status.toUpperCase(),
    descriptionHtml: rec.descriptionHtml,
    vendor: rec.vendor,
    productType: rec.productType,
  };
}
