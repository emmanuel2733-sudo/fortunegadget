import { supabase } from "../supabase/config";
import { getCurrentAccessToken } from "../auth/client";

const apiBaseUrl = (
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

const vendorsTable = (import.meta.env.REACT_APP_SUPABASE_VENDORS_TABLE || "vendors").trim();

const requestVendorsApi = async (endpoint, options = {}) => {
  const token = await getCurrentAccessToken();

  if (!token) {
    throw new Error("You must be signed in to manage vendors.");
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error || "Vendor request failed.");
  }

  return json;
};

export const mapVendorRecord = (vendor = {}) => ({
  id: String(vendor.id || "").trim(),
  name: String(vendor.name || "").trim(),
  slug: String(vendor.slug || "").trim(),
  logoURL: String(vendor.logo_url || vendor.logoURL || "").trim(),
  bannerURL: String(vendor.banner_url || vendor.bannerURL || "").trim(),
  description: String(vendor.description || "").trim(),
  status: String(vendor.status || "").trim(),
  licenseStatus: String(vendor.license_status || vendor.licenseStatus || "").trim(),
  currency: String(vendor.currency || "NGN").trim(),
  paystackSubaccountCode: String(
    vendor.subaccount_code ||
      vendor.paystack_subaccount_code ||
      vendor.vendor_paystack_accounts?.subaccount_code ||
      ""
  ).trim(),
  createdAt: vendor.created_at || vendor.createdAt || null,
  updatedAt: vendor.updated_at || vendor.updatedAt || null,
});

export const listPublicVendors = async () => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from(vendorsTable)
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(mapVendorRecord);
};

export const getPublicVendorBySlug = async (slug) => {
  if (!supabase || !slug) {
    return null;
  }

  const { data, error } = await supabase
    .from(vendorsTable)
    .select("*")
    .eq("slug", String(slug).trim())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapVendorRecord(data) : null;
};

export const listManagedVendors = async () => {
  const data = await requestVendorsApi("/super-admin/vendors", { method: "GET" });
  return Array.isArray(data) ? data.map(mapVendorRecord) : [];
};

export const createManagedVendor = async (payload) => {
  const data = await requestVendorsApi("/super-admin/vendors", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data;
};

export const updateManagedVendorStatus = async (id, payload) => {
  const data = await requestVendorsApi(`/super-admin/vendors/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return data;
};

export const resetManagedVendorPassword = async (vendorId, payload) => {
  const data = await requestVendorsApi(`/super-admin/vendors/${vendorId}/reset-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data;
};
