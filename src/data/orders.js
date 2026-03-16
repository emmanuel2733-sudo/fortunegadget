import { getCurrentAccessToken } from "../auth/client";

const apiBaseUrl = (
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

const requestOrdersApi = async (endpoint, options = {}) => {
  const token = await getCurrentAccessToken();

  if (!token) {
    throw new Error("You must be signed in to access orders.");
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
    throw new Error(json?.error || "Order request failed.");
  }

  return json;
};

export const mapOrderRecord = (order = {}) => ({
  id: order.id,
  userID: String(order.user_id || order.userID || "").trim(),
  userEmail: String(order.user_email || order.userEmail || "").trim(),
  orderDate: String(order.order_date || order.orderDate || "").trim(),
  orderTime: String(order.order_time || order.orderTime || "").trim(),
  orderAmount: Number(order.order_amount || order.orderAmount || 0),
  orderStatus: String(order.order_status || order.orderStatus || "").trim(),
  cartItems: Array.isArray(order.cart_items || order.cartItems)
    ? order.cart_items || order.cartItems
    : [],
  shippingAddress: order.shipping_address || order.shippingAddress || {},
  paymentGateway: String(order.payment_gateway || order.paymentGateway || "").trim(),
  paymentReference: String(order.payment_reference || order.paymentReference || "").trim(),
  paymentStatus: String(order.payment_status || order.paymentStatus || "").trim(),
  createdAt: order.created_at || order.createdAt || null,
  editedAt: order.edited_at || order.editedAt || null,
});

export const listOrders = async ({ admin = false } = {}) => {
  const query = admin ? "?scope=all" : "";
  const data = await requestOrdersApi(`/orders${query}`, { method: "GET" });
  return Array.isArray(data) ? data.map(mapOrderRecord) : [];
};

export const getOrderById = async (id) => {
  const data = await requestOrdersApi(`/orders/${id}`, { method: "GET" });
  return data ? mapOrderRecord(data) : null;
};

export const createOrder = async (order) => {
  const data = await requestOrdersApi("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });

  return data ? mapOrderRecord(data) : null;
};

export const updateOrderStatus = async (id, status) => {
  const data = await requestOrdersApi(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return data ? mapOrderRecord(data) : null;
};

export const deleteOrder = async (id) =>
  requestOrdersApi(`/admin/orders/${id}`, { method: "DELETE" });
