const { slugify, toIsoString } = require("./marketplace");

const normalizeProductPayload = (payload = {}) => ({
  vendorID: String(payload.vendorID || payload.vendorId || "").trim(),
  categoryID: String(payload.categoryID || payload.categoryId || "").trim(),
  name: String(payload.name || "").trim(),
  imageURL: String(payload.imageURL || "").trim(),
  imagePath: String(payload.imagePath || "").trim(),
  price: Number(payload.price),
  category: String(payload.category || "").trim(),
  brand: String(payload.brand || "").trim(),
  desc: String(payload.desc || "").trim(),
  createdAt: payload.createdAt || null,
  editedAt: payload.editedAt || null,
});

const validateProductPayload = (product) => {
  if (!product.vendorID) return "Vendor is required for this product.";
  if (!product.categoryID) return "Product category is required.";
  if (!product.name) return "Product name is required.";
  if (!product.imageURL) return "Product image URL is required.";
  if (!Number.isFinite(product.price) || product.price <= 0) {
    return "Product price must be greater than zero.";
  }
  if (!product.category) return "Product category is required.";
  if (!product.brand) return "Product brand is required.";
  if (!product.desc) return "Product description is required.";
  return "";
};

const toSupabaseProductRecord = (product) => ({
  vendor_id: product.vendorID,
  category_id: product.categoryID,
  name: product.name,
  image_url: product.imageURL,
  image_path: product.imagePath,
  price: product.price,
  category: product.category,
  brand: product.brand,
  desc: product.desc,
  created_at: toIsoString(product.createdAt),
  edited_at: product.editedAt ? toIsoString(product.editedAt) : null,
});

const normalizeCategoryPayload = (payload = {}) => ({
  vendorID: String(payload.vendorID || payload.vendorId || "").trim(),
  name: String(payload.name || "").trim(),
  slug: slugify(payload.slug || payload.name),
  isActive:
    payload.isActive === undefined && payload.is_active === undefined
      ? true
      : Boolean(payload.isActive ?? payload.is_active),
});

const validateCategoryPayload = (category) => {
  if (!category.vendorID) return "Vendor is required for this category.";
  if (!category.name) return "Category name is required.";
  if (!category.slug) return "Category slug is required.";
  return "";
};

const normalizeVendorPayload = (payload = {}) => ({
  name: String(payload.name || "").trim(),
  slug: slugify(payload.slug || payload.name),
  description: String(payload.description || "").trim(),
  logoURL: String(payload.logoURL || payload.logo_url || "").trim(),
  bannerURL: String(payload.bannerURL || payload.banner_url || "").trim(),
  status: String(payload.status || "active").trim() || "active",
  licenseStatus:
    String(payload.licenseStatus || payload.license_status || "active").trim() || "active",
  currency: String(payload.currency || "NGN").trim() || "NGN",
  adminName: String(payload.adminName || payload.admin_name || "").trim(),
  adminEmail: String(payload.adminEmail || payload.admin_email || "").trim().toLowerCase(),
  adminPassword: String(payload.adminPassword || payload.admin_password || "").trim(),
  subaccountCode: String(payload.subaccountCode || payload.subaccount_code || "").trim(),
  percentageCharge: Number(payload.percentageCharge || payload.percentage_charge || 0),
});

const validateVendorPayload = (vendor, isValidEmail) => {
  if (!vendor.name) return "Vendor name is required.";
  if (!vendor.slug) return "Vendor slug is required.";
  if (!isValidEmail(vendor.adminEmail)) return "A valid vendor admin email is required.";
  if (!vendor.adminPassword || vendor.adminPassword.length < 8) {
    return "Vendor admin password must be at least 8 characters.";
  }
  if (!vendor.adminName) return "Vendor admin name is required.";
  return "";
};

const normalizeOrderPayload = (payload = {}, authenticatedContext = null, vendorId = "") => ({
  vendorID: String(vendorId || payload.vendorID || payload.vendorId || payload.vendor_id || "").trim(),
  userID: String(authenticatedContext?.user?.id || payload.userID || payload.userId || "").trim(),
  userEmail: String(
    authenticatedContext?.user?.email || payload.userEmail || payload.user_email || ""
  )
    .trim()
    .toLowerCase(),
  orderDate: String(payload.orderDate || "").trim(),
  orderTime: String(payload.orderTime || "").trim(),
  orderAmount: Number(payload.orderAmount),
  orderStatus: String(payload.orderStatus || "").trim(),
  cartItems: Array.isArray(payload.cartItems) ? payload.cartItems : [],
  shippingAddress:
    payload.shippingAddress && typeof payload.shippingAddress === "object"
      ? payload.shippingAddress
      : {},
  paymentGateway: String(payload.paymentGateway || "").trim(),
  paymentReference: String(payload.paymentReference || "").trim(),
  paymentStatus: String(payload.paymentStatus || "").trim(),
  createdAt: payload.createdAt || null,
  editedAt: payload.editedAt || null,
});

const validateOrderPayload = (order, isValidEmail) => {
  if (!order.vendorID) return "A vendor is required to save an order.";
  if (!order.userID) return "A signed-in user is required to save an order.";
  if (!isValidEmail(order.userEmail)) return "A valid order email is required.";
  if (!order.orderDate || !order.orderTime) return "Order date and time are required.";
  if (!Number.isFinite(order.orderAmount) || order.orderAmount <= 0) {
    return "Order amount must be greater than zero.";
  }
  if (!order.orderStatus) return "Order status is required.";
  if (!Array.isArray(order.cartItems) || order.cartItems.length === 0) {
    return "Order items are required.";
  }
  return "";
};

const toSupabaseOrderRecord = (order) => ({
  vendor_id: order.vendorID,
  user_id: order.userID,
  user_email: order.userEmail,
  order_date: order.orderDate,
  order_time: order.orderTime,
  order_amount: order.orderAmount,
  order_status: order.orderStatus,
  cart_items: order.cartItems,
  shipping_address: order.shippingAddress,
  payment_gateway: order.paymentGateway,
  payment_reference: order.paymentReference,
  payment_status: order.paymentStatus,
  created_at: toIsoString(order.createdAt),
  edited_at: order.editedAt ? toIsoString(order.editedAt) : null,
});

const normalizeReviewPayload = (payload = {}, authenticatedContext = null) => ({
  userID: String(authenticatedContext?.user?.id || payload.userID || "").trim(),
  userName: String(payload.userName || authenticatedContext?.profile?.full_name || "").trim(),
  productID: String(payload.productID || "").trim(),
  rate: Number(payload.rate),
  review: String(payload.review || "").trim(),
  reviewDate: String(payload.reviewDate || "").trim(),
  createdAt: payload.createdAt || null,
});

const validateReviewPayload = (review) => {
  if (!review.userID) return "A signed-in user is required to submit a review.";
  if (!review.userName) return "Reviewer name is required.";
  if (!review.productID) return "A product is required for the review.";
  if (!Number.isFinite(review.rate) || review.rate <= 0) {
    return "A review rating is required.";
  }
  if (!review.review) return "Review text is required.";
  return "";
};

const toSupabaseReviewRecord = (review, vendorId) => ({
  vendor_id: vendorId || null,
  user_id: review.userID,
  user_name: review.userName,
  product_id: review.productID,
  rate: review.rate,
  review: review.review,
  review_date: review.reviewDate,
  created_at: toIsoString(review.createdAt),
});

module.exports = {
  normalizeCategoryPayload,
  normalizeOrderPayload,
  normalizeProductPayload,
  normalizeReviewPayload,
  normalizeVendorPayload,
  toSupabaseOrderRecord,
  toSupabaseProductRecord,
  toSupabaseReviewRecord,
  validateCategoryPayload,
  validateOrderPayload,
  validateProductPayload,
  validateReviewPayload,
  validateVendorPayload,
};
