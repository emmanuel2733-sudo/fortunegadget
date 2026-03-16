import { getCurrentAccessToken } from "../auth/client";

const apiBaseUrl = (
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

const requestAdminProductsApi = async (endpoint, method, payload) => {
  const idToken = await getCurrentAccessToken();

  if (!idToken) {
    throw new Error("You must be signed in before managing products.");
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error || "Product request failed.");
  }

  return json;
};

export const createAdminProduct = (product) =>
  requestAdminProductsApi("/admin/products", "POST", product);

export const updateAdminProduct = (id, product) =>
  requestAdminProductsApi(`/admin/products/${id}`, "PUT", product);

export const deleteAdminProduct = (id) =>
  requestAdminProductsApi(`/admin/products/${id}`, "DELETE");
