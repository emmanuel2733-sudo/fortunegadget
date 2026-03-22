const express = require("express");
const cors = require("cors");
const { APP_ROLES, config, normalizeUrl } = require("./lib/config");
const { buildTablePath, supabaseRestRequest } = require("./lib/supabase");
const {
  assertVendorOperational,
  createSupabaseAuthUser,
  getProductById,
  getProfileById,
  getRequestedVendorId,
  getVendorById,
  getVendorBySlug,
  getVendorCategoryById,
  getVendorMembershipsByVendorId,
  getVendorPaystackAccount,
  insertProfile,
  isValidEmail,
  listVendorCategories,
  listVendors,
  normalizeEmail,
  queryManyRows,
  requireAuthenticatedUser,
  requireSuperAdminUser,
  requireVendorManagerUser,
  resolveManagedVendorId,
  updateProfile,
  updateSupabaseAuthUser,
} = require("./lib/marketplace");
const {
  collectUniqueVendorIds,
  computeOrderAmount,
  createReference,
  hasUsablePaystackSecret,
  paystackRequest,
} = require("./lib/payments");
const {
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
} = require("./lib/normalizers");

const app = express();

const getVendorManagementRecord = async (vendor) => {
  const [paystackAccount, memberships] = await Promise.all([
    getVendorPaystackAccount(vendor.id),
    getVendorMembershipsByVendorId(vendor.id),
  ]);

  const primaryMembership =
    memberships.find((membership) => membership.is_primary) || memberships[0] || null;
  const primaryAdmin = primaryMembership?.user_id
    ? await getProfileById(primaryMembership.user_id)
    : null;

  return {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    logo_url: vendor.logo_url || "",
    banner_url: vendor.banner_url || "",
    description: vendor.description || "",
    status: vendor.status || "active",
    license_status: vendor.license_status || "active",
    currency: vendor.currency || "NGN",
    created_at: vendor.created_at || null,
    updated_at: vendor.updated_at || null,
    subaccount_code: paystackAccount?.subaccount_code || "",
    business_name: paystackAccount?.business_name || "",
    settlement_bank: paystackAccount?.settlement_bank || "",
    account_number_last4: paystackAccount?.account_number_last4 || "",
    percentage_charge: paystackAccount?.percentage_charge || 0,
    primary_admin_user_id: primaryAdmin?.id || "",
    primary_admin_email: primaryAdmin?.email || "",
    primary_admin_name: primaryAdmin?.full_name || "",
    primary_admin_active:
      primaryAdmin?.is_active === undefined ? true : Boolean(primaryAdmin.is_active),
  };
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || normalizeUrl(origin) === config.normalizedFrontendUrl) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/me", requireAuthenticatedUser, (req, res) => {
  const context = req.userContext;
  res.json({
    userID: context.user.id,
    email: context.user.email,
    full_name: context.profile.full_name,
    role: context.role,
    is_active: context.profile.is_active,
    vendor: context.vendor,
  });
});

app.post("/me/sync", requireAuthenticatedUser, (req, res) => {
  const context = req.userContext;
  res.json({
    userID: context.user.id,
    email: context.user.email,
    full_name: context.profile.full_name,
    role: context.role,
    is_active: context.profile.is_active,
    vendor: context.vendor,
  });
});

app.get("/super-admin/vendors", requireSuperAdminUser, async (_req, res) => {
  try {
    const vendors = await listVendors();
    const payload = await Promise.all(vendors.map((vendor) => getVendorManagementRecord(vendor)));
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to load vendors." });
  }
});

app.post("/super-admin/vendors", requireSuperAdminUser, async (req, res) => {
  try {
    const vendor = normalizeVendorPayload(req.body);
    const validationError = validateVendorPayload(vendor, isValidEmail);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingVendor = await getVendorBySlug(vendor.slug);
    if (existingVendor) {
      return res.status(400).json({ error: "A vendor with this slug already exists." });
    }

    const createdUser = await createSupabaseAuthUser({
      email: vendor.adminEmail,
      password: vendor.adminPassword,
      fullName: vendor.adminName,
    });

    const vendorRows = await supabaseRestRequest(
      "POST",
      buildTablePath(config.tables.vendors, "select=*"),
      {
        name: vendor.name,
        slug: vendor.slug,
        description: vendor.description,
        logo_url: vendor.logoURL,
        banner_url: vendor.bannerURL,
        status: vendor.status,
        license_status: vendor.licenseStatus,
        currency: vendor.currency,
      }
    );
    const createdVendor = Array.isArray(vendorRows) ? vendorRows[0] : vendorRows;

    await insertProfile({
      id: createdUser.id,
      email: vendor.adminEmail,
      full_name: vendor.adminName,
      role: APP_ROLES.VENDOR_ADMIN,
      is_active: true,
    });

    await supabaseRestRequest(
      "POST",
      buildTablePath(config.tables.vendorAdmins, "select=*"),
      {
        vendor_id: createdVendor.id,
        user_id: createdUser.id,
        is_primary: true,
      }
    );

    if (vendor.subaccountCode) {
      await supabaseRestRequest(
        "POST",
        buildTablePath(config.tables.vendorPaystackAccounts, "select=*"),
        {
          vendor_id: createdVendor.id,
          subaccount_code: vendor.subaccountCode,
          business_name: vendor.name,
          percentage_charge: vendor.percentageCharge,
          is_active: true,
        }
      );
    }

    res.status(201).json(await getVendorManagementRecord(createdVendor));
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to create vendor." });
  }
});

app.patch("/super-admin/vendors/:id/status", requireSuperAdminUser, async (req, res) => {
  try {
    const vendorId = String(req.params.id || "").trim();
    const status = String(req.body?.status || "").trim();

    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required." });
    }

    if (!["active", "disabled", "suspended"].includes(status)) {
      return res.status(400).json({ error: "Vendor status is invalid." });
    }

    const memberships = await getVendorMembershipsByVendorId(vendorId);
    const primaryMembership =
      memberships.find((membership) => membership.is_primary) || memberships[0] || null;

    const query = new URLSearchParams({ id: `eq.${vendorId}`, select: "*" });
    const rows = await supabaseRestRequest(
      "PATCH",
      buildTablePath(config.tables.vendors, query.toString()),
      { status }
    );
    const updatedVendor = Array.isArray(rows) ? rows[0] : rows;

    if (primaryMembership?.user_id) {
      await updateProfile(primaryMembership.user_id, { is_active: status === "active" });
    }

    res.json(await getVendorManagementRecord(updatedVendor));
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to update vendor status." });
  }
});

app.post("/super-admin/vendors/:id/reset-password", requireSuperAdminUser, async (req, res) => {
  try {
    const vendorId = String(req.params.id || "").trim();
    const password = String(req.body?.password || "").trim();

    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const memberships = await getVendorMembershipsByVendorId(vendorId);
    const primaryMembership =
      memberships.find((membership) => membership.is_primary) || memberships[0] || null;

    if (!primaryMembership?.user_id) {
      return res.status(404).json({ error: "Vendor admin was not found." });
    }

    await updateSupabaseAuthUser(primaryMembership.user_id, { password });
    res.json({ success: true, vendorId });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to reset vendor password." });
  }
});

app.get("/admin/categories", requireVendorManagerUser, async (req, res) => {
  try {
    const vendorId = resolveManagedVendorId(req.userContext, getRequestedVendorId(req));
    res.json(await listVendorCategories(vendorId));
  } catch (error) {
    res.status(403).json({ error: error?.message || "Failed to load categories." });
  }
});

app.post("/admin/categories", requireVendorManagerUser, async (req, res) => {
  try {
    const vendorId = resolveManagedVendorId(req.userContext, getRequestedVendorId(req));
    const category = normalizeCategoryPayload({ ...req.body, vendorID: vendorId });
    const validationError = validateCategoryPayload(category);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const rows = await supabaseRestRequest(
      "POST",
      buildTablePath(config.tables.vendorCategories, "select=*"),
      {
        vendor_id: category.vendorID,
        name: category.name,
        slug: category.slug,
        is_active: category.isActive,
      }
    );

    res.status(201).json(Array.isArray(rows) ? rows[0] : rows);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to create category." });
  }
});

app.put("/admin/categories/:id", requireVendorManagerUser, async (req, res) => {
  try {
    const categoryId = String(req.params.id || "").trim();
    const vendorId = resolveManagedVendorId(req.userContext, getRequestedVendorId(req));
    const existingCategory = await getVendorCategoryById(categoryId);

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found." });
    }
    if (existingCategory.vendor_id !== vendorId) {
      return res.status(403).json({ error: "You do not have access to this category." });
    }

    const category = normalizeCategoryPayload({ ...req.body, vendorID: vendorId });
    const validationError = validateCategoryPayload(category);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const query = new URLSearchParams({ id: `eq.${categoryId}`, select: "*" });
    const rows = await supabaseRestRequest(
      "PATCH",
      buildTablePath(config.tables.vendorCategories, query.toString()),
      {
        name: category.name,
        slug: category.slug,
        is_active: category.isActive,
      }
    );

    res.json(Array.isArray(rows) ? rows[0] : rows);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to update category." });
  }
});

app.delete("/admin/categories/:id", requireVendorManagerUser, async (req, res) => {
  try {
    const categoryId = String(req.params.id || "").trim();
    const vendorId = resolveManagedVendorId(req.userContext, getRequestedVendorId(req));
    const category = await getVendorCategoryById(categoryId);

    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }
    if (category.vendor_id !== vendorId) {
      return res.status(403).json({ error: "You do not have access to this category." });
    }

    const query = new URLSearchParams({ id: `eq.${categoryId}` });
    await supabaseRestRequest(
      "DELETE",
      buildTablePath(config.tables.vendorCategories, query.toString()),
      undefined,
      { prefer: "" }
    );

    res.json({ success: true, id: categoryId });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to delete category." });
  }
});

app.post("/initialize-payment", async (req, res) => {
  try {
    if (!hasUsablePaystackSecret()) {
      return res.status(503).json({
        error: "Paystack secret key is missing or still set to the example value in backend/.env",
      });
    }

    const { items, userEmail, shipping, billing, description } = req.body || {};
    const amount = computeOrderAmount(items);
    const reference = createReference();
    const normalizedEmail = normalizeEmail(userEmail);
    const vendorIds = collectUniqueVendorIds(items);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: "A valid customer email is required for checkout." });
    }
    if (!amount) {
      return res.status(400).json({ error: "Cart amount is invalid." });
    }
    if (vendorIds.length !== 1) {
      return res.status(400).json({ error: "Checkout only supports one vendor at a time." });
    }

    const vendor = await getVendorById(vendorIds[0]);
    const paystackAccount = await getVendorPaystackAccount(vendorIds[0]);

    if (!vendor) {
      return res.status(400).json({ error: "Vendor was not found for this cart." });
    }

    const payload = {
      email: normalizedEmail,
      amount,
      currency: config.paystackCurrency,
      reference,
      channels: ["card"],
      metadata: {
        description: description || "Marketplace checkout payment",
        shipping: shipping || {},
        billing: billing || {},
        vendor_id: vendor.id,
        vendor_slug: vendor.slug,
      },
    };

    if (paystackAccount?.is_active && paystackAccount?.subaccount_code) {
      payload.subaccount = paystackAccount.subaccount_code;
    }

    const initialization = await paystackRequest("POST", "/transaction/initialize", payload);
    const transaction = initialization?.data;

    if (!initialization?.status || !transaction?.access_code) {
      return res.status(502).json({ error: "Invalid Paystack initialization response." });
    }

    res.json({
      accessCode: transaction.access_code,
      amount,
      authorizationUrl: transaction.authorization_url,
      currency: config.paystackCurrency,
      email: normalizedEmail,
      reference: transaction.reference || reference,
      vendorID: vendor.id,
      vendorSlug: vendor.slug,
    });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to initialize payment." });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    if (!hasUsablePaystackSecret()) {
      return res.status(503).json({
        error: "Paystack secret key is missing or still set to the example value in backend/.env",
      });
    }

    const { items, reference } = req.body || {};
    const expectedAmount = computeOrderAmount(items);

    if (!reference) {
      return res.status(400).json({ error: "Payment reference is required." });
    }
    if (!expectedAmount) {
      return res.status(400).json({ error: "Cart amount is invalid." });
    }

    const verification = await paystackRequest(
      "GET",
      `/transaction/verify/${encodeURIComponent(reference)}`
    );
    const transaction = verification?.data;

    if (!verification?.status || !transaction) {
      return res.status(502).json({ error: "Invalid Paystack verification response." });
    }

    if (transaction.status !== "success") {
      return res.json({
        amount: transaction.amount || null,
        paidAt: transaction.paid_at || transaction.paidAt || null,
        reference: transaction.reference || reference,
        status: transaction.status || "unknown",
        verified: false,
      });
    }

    if (Number(transaction.amount) !== expectedAmount) {
      return res.status(400).json({ error: "Verified amount does not match the cart total." });
    }
    if ((transaction.currency || "").toUpperCase() !== config.paystackCurrency) {
      return res.status(400).json({ error: "Verified currency does not match configuration." });
    }

    res.json({
      amount: transaction.amount,
      paidAt: transaction.paid_at || transaction.paidAt || null,
      reference: transaction.reference,
      status: transaction.status,
      verified: true,
    });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to verify payment." });
  }
});

app.post("/orders", requireAuthenticatedUser, async (req, res) => {
  try {
    const vendorIds = collectUniqueVendorIds(req.body?.cartItems || []);
    const order = normalizeOrderPayload(req.body, req.userContext, vendorIds[0] || "");
    const validationError = validateOrderPayload(order, isValidEmail);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const vendor = await getVendorById(order.vendorID);
    if (!vendor) {
      return res.status(400).json({ error: "Vendor was not found for this order." });
    }

    const rows = await supabaseRestRequest(
      "POST",
      buildTablePath(config.tables.orders, "select=*"),
      toSupabaseOrderRecord(order)
    );

    res.status(201).json(Array.isArray(rows) ? rows[0] : rows);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to create order." });
  }
});

app.get("/orders", requireAuthenticatedUser, async (req, res) => {
  try {
    const context = req.userContext;
    const filters = {};

    if (!(context.isSuperAdmin && req.query.scope === "all")) {
      if (context.isVendorAdmin) {
        filters.vendor_id = context.vendor.id;
      } else {
        filters.user_id = context.user.id;
      }
    }

    res.json(await queryManyRows(config.tables.orders, filters, { order: "created_at.desc" }));
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to load orders." });
  }
});

app.get("/orders/:id", requireAuthenticatedUser, async (req, res) => {
  try {
    const order = await querySingleOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const context = req.userContext;
    if (
      !context.isSuperAdmin &&
      !(
        (context.isVendorAdmin && order.vendor_id === context.vendor.id) ||
        order.user_id === context.user.id
      )
    ) {
      return res.status(403).json({ error: "You do not have access to this order." });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to load the order." });
  }
});

async function querySingleOrder(orderId) {
  const rows = await queryManyRows(config.tables.orders, { id: orderId });
  return rows[0] || null;
}

app.patch("/admin/orders/:id/status", requireVendorManagerUser, async (req, res) => {
  try {
    const order = await querySingleOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (!req.userContext.isSuperAdmin && order.vendor_id !== req.userContext.vendor.id) {
      return res.status(403).json({ error: "You do not have access to this order." });
    }

    const query = new URLSearchParams({ id: `eq.${req.params.id}`, select: "*" });
    const rows = await supabaseRestRequest(
      "PATCH",
      buildTablePath(config.tables.orders, query.toString()),
      {
        order_status: String(req.body?.status || "").trim(),
      }
    );
    res.json(Array.isArray(rows) ? rows[0] : rows);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to update the order." });
  }
});

app.delete("/admin/orders/:id", requireVendorManagerUser, async (req, res) => {
  try {
    const order = await querySingleOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (!req.userContext.isSuperAdmin && order.vendor_id !== req.userContext.vendor.id) {
      return res.status(403).json({ error: "You do not have access to this order." });
    }

    const query = new URLSearchParams({ id: `eq.${req.params.id}` });
    await supabaseRestRequest(
      "DELETE",
      buildTablePath(config.tables.orders, query.toString()),
      undefined,
      { prefer: "" }
    );
    res.json({ id: req.params.id, success: true });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to delete the order." });
  }
});

app.get("/reviews", async (req, res) => {
  try {
    const filters = {};
    if (req.query.productId) filters.product_id = String(req.query.productId).trim();
    if (req.query.vendorId) filters.vendor_id = String(req.query.vendorId).trim();
    res.json(await queryManyRows(config.tables.reviews, filters, { order: "created_at.desc" }));
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to load reviews." });
  }
});

app.post("/reviews", requireAuthenticatedUser, async (req, res) => {
  try {
    const review = normalizeReviewPayload(req.body, req.userContext);
    const validationError = validateReviewPayload(review);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = await getProductById(review.productID);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const rows = await supabaseRestRequest(
      "POST",
      buildTablePath(config.tables.reviews, "select=*"),
      toSupabaseReviewRecord(review, product.vendor_id)
    );
    res.status(201).json(Array.isArray(rows) ? rows[0] : rows);
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to create review." });
  }
});

app.post("/admin/products", requireVendorManagerUser, async (req, res) => {
  try {
    const vendorId = resolveManagedVendorId(req.userContext, getRequestedVendorId(req));
    const product = normalizeProductPayload({ ...req.body, vendorID: vendorId });
    const validationError = validateProductPayload(product);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const category = await getVendorCategoryById(product.categoryID);
    if (!category || category.vendor_id !== vendorId) {
      return res.status(403).json({ error: "Category does not belong to this vendor." });
    }

    product.category = category.name;
    const rows = await supabaseRestRequest(
      "POST",
      buildTablePath(config.tables.products, "select=*"),
      toSupabaseProductRecord(product)
    );

    const createdProduct = Array.isArray(rows) ? rows[0] : rows;
    res.status(201).json({ id: createdProduct?.id, product: createdProduct, success: true });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to create product." });
  }
});

app.put("/admin/products/:id", requireVendorManagerUser, async (req, res) => {
  try {
    const existingProduct = await getProductById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    const vendorId = resolveManagedVendorId(req.userContext, getRequestedVendorId(req));
    if (!req.userContext.isSuperAdmin && existingProduct.vendor_id !== vendorId) {
      return res.status(403).json({ error: "You do not have access to this product." });
    }

    const product = normalizeProductPayload({ ...req.body, vendorID: vendorId });
    const validationError = validateProductPayload(product);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const category = await getVendorCategoryById(product.categoryID);
    if (!category || category.vendor_id !== vendorId) {
      return res.status(403).json({ error: "Category does not belong to this vendor." });
    }

    product.category = category.name;
    const query = new URLSearchParams({ id: `eq.${req.params.id}`, select: "*" });
    const rows = await supabaseRestRequest(
      "PATCH",
      buildTablePath(config.tables.products, query.toString()),
      toSupabaseProductRecord(product)
    );

    const updatedProduct = Array.isArray(rows) ? rows[0] : rows;
    res.json({ id: req.params.id, product: updatedProduct, success: true });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to update product." });
  }
});

app.delete("/admin/products/:id", requireVendorManagerUser, async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    if (!req.userContext.isSuperAdmin && product.vendor_id !== req.userContext.vendor.id) {
      return res.status(403).json({ error: "You do not have access to this product." });
    }

    const query = new URLSearchParams({ id: `eq.${req.params.id}` });
    await supabaseRestRequest(
      "DELETE",
      buildTablePath(config.tables.products, query.toString()),
      undefined,
      { prefer: "" }
    );

    res.json({ id: req.params.id, success: true });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to delete product." });
  }
});

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
