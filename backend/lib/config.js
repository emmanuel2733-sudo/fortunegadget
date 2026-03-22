const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const APP_ROLES = {
  CUSTOMER: "customer",
  VENDOR_ADMIN: "vendor_admin",
  SUPER_ADMIN: "super_admin",
};

const normalizeUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const config = {
  port: Number(process.env.PORT || 4242),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  paystackApiHost: "api.paystack.co",
  paystackSecretKey: (process.env.PAYSTACK_SECRET_KEY || "").trim(),
  paystackCurrency: (process.env.PAYSTACK_CURRENCY || "NGN").toUpperCase(),
  supabaseUrl: normalizeUrl(process.env.SUPABASE_URL || ""),
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  normalizedFrontendUrl: normalizeUrl(process.env.FRONTEND_URL || "http://localhost:3000"),
  superAdminUids: new Set(
    (process.env.SUPER_ADMIN_UIDS || process.env.ADMIN_UIDS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  ),
  tables: {
    profiles: (process.env.SUPABASE_PROFILES_TABLE || "profiles").trim(),
    vendors: (process.env.SUPABASE_VENDORS_TABLE || "vendors").trim(),
    vendorAdmins: (process.env.SUPABASE_VENDOR_ADMINS_TABLE || "vendor_admins").trim(),
    vendorCategories: (
      process.env.SUPABASE_VENDOR_CATEGORIES_TABLE || "vendor_categories"
    ).trim(),
    vendorPaystackAccounts: (
      process.env.SUPABASE_VENDOR_PAYSTACK_TABLE || "vendor_paystack_accounts"
    ).trim(),
    products: (process.env.SUPABASE_PRODUCTS_TABLE || "products").trim(),
    orders: (process.env.SUPABASE_ORDERS_TABLE || "orders").trim(),
    reviews: (process.env.SUPABASE_REVIEWS_TABLE || "reviews").trim(),
  },
};

module.exports = {
  APP_ROLES,
  config,
  normalizeUrl,
};
