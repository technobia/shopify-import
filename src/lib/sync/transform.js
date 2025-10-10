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
