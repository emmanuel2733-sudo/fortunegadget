export const productFallbackImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="#f2f4f7"/>
      <rect x="120" y="160" width="560" height="420" rx="28" fill="#dfe5ec"/>
      <circle cx="280" cy="300" r="52" fill="#b9c3d0"/>
      <path d="M190 520l130-150 95 105 70-75 125 120H190z" fill="#94a3b8"/>
      <text x="400" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#5b6777">
        Image unavailable
      </text>
    </svg>
  `);

export const getProductImage = (imageUrl) => {
  const normalizedImageUrl =
    typeof imageUrl === "string" ? imageUrl.trim() : "";

  if (
    !normalizedImageUrl ||
    normalizedImageUrl === "undefined" ||
    normalizedImageUrl === "null" ||
    normalizedImageUrl.startsWith("gs://")
  ) {
    return productFallbackImage;
  }

  return normalizedImageUrl;
};

export const fallbackToProductImage = (event) => {
  event.currentTarget.src = productFallbackImage;
};
