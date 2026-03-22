const { APP_ROLES, config } = require("./config");
const { buildTablePath, getSupabaseUserFromToken, supabaseAuthAdminRequest, supabaseRestRequest } = require("./supabase");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const isValidEmail = (value) => {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toIsoString = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const querySingleRow = async (tableName, filters = {}) => {
  const query = new URLSearchParams({
    select: "*",
    limit: "1",
  });

  Object.entries(filters).forEach(([key, value]) => {
    query.set(key, `eq.${value}`);
  });

  const rows = await supabaseRestRequest(
    "GET",
    buildTablePath(tableName, query.toString()),
    undefined,
    { fallbackJson: [] }
  );

  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

const queryManyRows = async (tableName, filters = {}, extra = {}) => {
  const query = new URLSearchParams({
    select: "*",
    ...(extra.order ? { order: extra.order } : {}),
  });

  Object.entries(filters).forEach(([key, value]) => {
    query.set(key, `eq.${value}`);
  });

  const rows = await supabaseRestRequest(
    "GET",
    buildTablePath(tableName, query.toString()),
    undefined,
    { fallbackJson: [] }
  );

  return Array.isArray(rows) ? rows : [];
};

const getProfileById = (id) => (id ? querySingleRow(config.tables.profiles, { id }) : null);
const getVendorById = (id) => (id ? querySingleRow(config.tables.vendors, { id }) : null);
const getVendorBySlug = (slug) =>
  slug ? querySingleRow(config.tables.vendors, { slug: slugify(slug) }) : null;
const getVendorMembershipByUserId = (userId) =>
  userId ? querySingleRow(config.tables.vendorAdmins, { user_id: userId }) : null;
const getVendorMembershipsByVendorId = (vendorId) =>
  vendorId
    ? queryManyRows(config.tables.vendorAdmins, { vendor_id: vendorId }, { order: "created_at.asc" })
    : [];
const getVendorCategoryById = (categoryId) =>
  categoryId ? querySingleRow(config.tables.vendorCategories, { id: categoryId }) : null;
const getProductById = (productId) =>
  productId ? querySingleRow(config.tables.products, { id: productId }) : null;
const getVendorPaystackAccount = (vendorId) =>
  vendorId ? querySingleRow(config.tables.vendorPaystackAccounts, { vendor_id: vendorId }) : null;
const listVendorCategories = (vendorId) =>
  vendorId
    ? queryManyRows(config.tables.vendorCategories, { vendor_id: vendorId }, { order: "name.asc" })
    : [];
const listVendors = () => queryManyRows(config.tables.vendors, {}, { order: "created_at.desc" });

async function insertProfile(profile) {
  const rows = await supabaseRestRequest(
    "POST",
    buildTablePath(config.tables.profiles, "select=*"),
    profile
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

async function updateProfile(id, payload) {
  const query = new URLSearchParams({
    id: `eq.${id}`,
    select: "*",
  });
  const rows = await supabaseRestRequest(
    "PATCH",
    buildTablePath(config.tables.profiles, query.toString()),
    payload
  );

  return Array.isArray(rows) ? rows[0] : rows;
}

async function ensureProfileRow(user) {
  const email = normalizeEmail(user.email);
  const existingProfile = await getProfileById(user.id);
  const fallbackFullName =
    String(
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0] ||
        ""
    ).trim() || "Customer";
  const desiredRole = config.superAdminUids.has(user.id)
    ? APP_ROLES.SUPER_ADMIN
    : existingProfile?.role || APP_ROLES.CUSTOMER;

  if (!existingProfile) {
    return insertProfile({
      id: user.id,
      email,
      full_name: fallbackFullName,
      role: desiredRole,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  const nextPayload = {
    email,
    full_name: existingProfile.full_name || fallbackFullName,
    role: desiredRole,
    updated_at: new Date().toISOString(),
  };

  const shouldUpdate =
    existingProfile.email !== nextPayload.email ||
    existingProfile.full_name !== nextPayload.full_name ||
    existingProfile.role !== nextPayload.role;

  if (!shouldUpdate) {
    return existingProfile;
  }

  return updateProfile(user.id, nextPayload);
}

async function buildUserContext(user) {
  const profile = await ensureProfileRow(user);
  const membership = await getVendorMembershipByUserId(user.id);
  const vendor = membership?.vendor_id ? await getVendorById(membership.vendor_id) : null;

  return {
    user: {
      id: user.id,
      email: normalizeEmail(user.email),
    },
    profile,
    role: profile.role || APP_ROLES.CUSTOMER,
    vendor,
    membership,
    isSuperAdmin: profile.role === APP_ROLES.SUPER_ADMIN,
    isVendorAdmin: profile.role === APP_ROLES.VENDOR_ADMIN,
    canAccessVendorAdmin:
      profile.role === APP_ROLES.VENDOR_ADMIN || profile.role === APP_ROLES.SUPER_ADMIN,
  };
}

async function getAuthenticatedContextFromRequest(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing authorization token.");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const user = await getSupabaseUserFromToken(token);
  return buildUserContext(user);
}

const assertActiveProfile = (context) => {
  if (context.profile?.is_active === false) {
    throw new Error("This account has been disabled. Contact support.");
  }
};

const assertVendorOperational = (vendor) => {
  if (!vendor) {
    throw new Error("Vendor account is not assigned.");
  }

  if (vendor.status !== "active") {
    throw new Error("Vendor account is disabled.");
  }

  if (vendor.license_status !== "active") {
    throw new Error("Vendor license is not active.");
  }
};

const getRequestedVendorId = (req) =>
  String(
    req.body?.vendorID ||
      req.body?.vendorId ||
      req.query?.vendorId ||
      req.params?.vendorId ||
      ""
  ).trim();

const resolveManagedVendorId = (context, requestedVendorId = "") => {
  if (context.isSuperAdmin) {
    return String(requestedVendorId || context.vendor?.id || "").trim();
  }

  if (context.isVendorAdmin) {
    assertVendorOperational(context.vendor);

    if (requestedVendorId && requestedVendorId !== context.vendor.id) {
      throw new Error("You do not have access to this vendor.");
    }

    return context.vendor.id;
  }

  throw new Error("You do not have admin access.");
};

const requireAuthenticatedUser = async (req, res, next) => {
  try {
    const context = await getAuthenticatedContextFromRequest(req);
    assertActiveProfile(context);
    req.userContext = context;
    return next();
  } catch (error) {
    return res.status(401).json({ error: error?.message || "Unable to verify credentials." });
  }
};

const requireSuperAdminUser = async (req, res, next) => {
  try {
    const context = await getAuthenticatedContextFromRequest(req);
    assertActiveProfile(context);

    if (!context.isSuperAdmin) {
      return res.status(403).json({ error: "You do not have super admin access." });
    }

    req.userContext = context;
    return next();
  } catch (error) {
    return res.status(401).json({ error: error?.message || "Unable to verify super admin credentials." });
  }
};

const requireVendorManagerUser = async (req, res, next) => {
  try {
    const context = await getAuthenticatedContextFromRequest(req);
    assertActiveProfile(context);

    if (!context.canAccessVendorAdmin) {
      return res.status(403).json({ error: "You do not have admin access." });
    }

    if (context.isVendorAdmin) {
      assertVendorOperational(context.vendor);
    }

    req.userContext = context;
    return next();
  } catch (error) {
    return res.status(401).json({ error: error?.message || "Unable to verify admin credentials." });
  }
};

async function createSupabaseAuthUser({ email, password, fullName }) {
  const payload = await supabaseAuthAdminRequest("POST", "/auth/v1/admin/users", {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      name: fullName,
    },
  });

  return payload?.user || payload;
}

const updateSupabaseAuthUser = (userId, payload) =>
  supabaseAuthAdminRequest("PUT", `/auth/v1/admin/users/${encodeURIComponent(userId)}`, payload);

module.exports = {
  APP_ROLES,
  assertVendorOperational,
  buildUserContext,
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
  querySingleRow,
  requireAuthenticatedUser,
  requireSuperAdminUser,
  requireVendorManagerUser,
  resolveManagedVendorId,
  slugify,
  toIsoString,
  updateProfile,
  updateSupabaseAuthUser,
};
