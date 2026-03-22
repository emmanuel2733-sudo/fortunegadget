import { getCurrentAccessToken } from "../auth/client";

const apiBaseUrl = (
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

const requestCategoriesApi = async (endpoint, options = {}) => {
  const token = await getCurrentAccessToken();

  if (!token) {
    throw new Error("You must be signed in to manage categories.");
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
    throw new Error(json?.error || "Category request failed.");
  }

  return json;
};

export const mapCategoryRecord = (category = {}) => ({
  id: String(category.id || "").trim(),
  vendorID: String(category.vendor_id || category.vendorID || "").trim(),
  name: String(category.name || "").trim(),
  slug: String(category.slug || "").trim(),
  isActive: Boolean(category.is_active ?? category.isActive ?? true),
  createdAt: category.created_at || category.createdAt || null,
  updatedAt: category.updated_at || category.updatedAt || null,
});

export const listAdminCategories = async () => {
  const data = await requestCategoriesApi("/admin/categories", { method: "GET" });
  return Array.isArray(data) ? data.map(mapCategoryRecord) : [];
};

export const createAdminCategory = async (payload) => {
  const data = await requestCategoriesApi("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data ? mapCategoryRecord(data) : null;
};

export const updateAdminCategory = async (id, payload) => {
  const data = await requestCategoriesApi(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return data ? mapCategoryRecord(data) : null;
};

export const deleteAdminCategory = async (id) =>
  requestCategoriesApi(`/admin/categories/${id}`, { method: "DELETE" });
