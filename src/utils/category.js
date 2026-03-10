export const normalizeCategory = (category) => {
  if ((category || "").trim().toLowerCase() === "fashon") {
    return "Accessories";
  }

  return category;
};

export const normalizeProductCategory = (product) => ({
  ...product,
  category: normalizeCategory(product?.category),
});
