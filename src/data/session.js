import { getCurrentAccessToken } from "../auth/client";
import {
  APP_ROLES,
  canAccessVendorAdmin,
  isSuperAdminRole,
  isVendorAdminRole,
} from "../utils/roles";

const apiBaseUrl = (
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

const normalizeVendor = (vendor = null) => {
  if (!vendor) {
    return null;
  }

  return {
    id: String(vendor.id || "").trim(),
    name: String(vendor.name || "").trim(),
    slug: String(vendor.slug || "").trim(),
    status: String(vendor.status || "").trim(),
    licenseStatus: String(vendor.license_status || vendor.licenseStatus || "").trim(),
    logoURL: String(vendor.logo_url || vendor.logoURL || "").trim(),
    bannerURL: String(vendor.banner_url || vendor.bannerURL || "").trim(),
    description: String(vendor.description || "").trim(),
    currency: String(vendor.currency || "NGN").trim(),
  };
};

export const normalizeAppContext = (payload = {}, fallbackUser = null) => {
  const role = String(payload.role || APP_ROLES.CUSTOMER).trim() || APP_ROLES.CUSTOMER;
  const vendor = normalizeVendor(payload.vendor || null);
  const user = payload.user || {};

  return {
    email: String(payload.email || user.email || fallbackUser?.email || "").trim(),
    displayName: String(
      payload.fullName ||
        payload.full_name ||
        user.full_name ||
        fallbackUser?.displayName ||
        ""
    ).trim(),
    role,
    vendor,
    userID: String(payload.userID || payload.user_id || user.id || fallbackUser?.id || "").trim(),
    isSuperAdmin: isSuperAdminRole(role),
    isVendorAdmin: isVendorAdminRole(role),
    canAccessVendorAdmin: canAccessVendorAdmin(role),
    isActive: payload.isActive ?? payload.is_active ?? true,
  };
};

export const syncCurrentUserContext = async (fallbackUser = null) => {
  const token = await getCurrentAccessToken();

  if (!token) {
    return normalizeAppContext({}, fallbackUser);
  }

  const response = await fetch(`${apiBaseUrl}/me/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error || "Unable to load your account context.");
  }

  return normalizeAppContext(json, fallbackUser);
};

export const getCurrentUserContext = async (fallbackUser = null) => {
  const token = await getCurrentAccessToken();

  if (!token) {
    return normalizeAppContext({}, fallbackUser);
  }

  const response = await fetch(`${apiBaseUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error || "Unable to load your account context.");
  }

  return normalizeAppContext(json, fallbackUser);
};
