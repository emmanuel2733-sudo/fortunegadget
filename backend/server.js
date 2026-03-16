const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const https = require("https");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT || 4242);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const PAYSTACK_API_HOST = "api.paystack.co";
const paystackSecretKey = (process.env.PAYSTACK_SECRET_KEY || "").trim();
const supabaseUrl = normalizeUrl(process.env.SUPABASE_URL || "");
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const supabaseProductsTable = (process.env.SUPABASE_PRODUCTS_TABLE || "products").trim();
const supabaseOrdersTable = (process.env.SUPABASE_ORDERS_TABLE || "orders").trim();
const supabaseReviewsTable = (process.env.SUPABASE_REVIEWS_TABLE || "reviews").trim();
const adminUids = new Set(
  (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const normalizedFrontendUrl = normalizeUrl(FRONTEND_URL);

function hasUsablePaystackSecret(key) {
  return Boolean(key) && key.startsWith("sk_") && !key.includes("your_secret_key");
}

function hasSupabaseAdminConfig() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

async function getSupabaseUserFromToken(token) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error(
      "Supabase Admin is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend variables."
    );
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.msg || payload?.message || "Unable to verify Supabase credentials.");
  }

  return payload;
}

async function supabaseRestRequest(method, pathname, payload) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error(
      "Supabase Admin is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend variables."
    );
  }

  const body = payload ? JSON.stringify(payload) : undefined;
  const response = await fetch(`${supabaseUrl}${pathname}`, {
    method,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json", Prefer: "return=representation" } : {}),
    },
    ...(body ? { body } : {}),
  });

  const json = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(
      json?.message ||
        json?.error_description ||
        json?.error ||
        "Supabase request failed."
    );
  }

  return json;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (normalizeUrl(origin) === normalizedFrontendUrl) {
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

function toIsoString(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeProductPayload(payload = {}) {
  return {
    name: String(payload.name || "").trim(),
    imageURL: String(payload.imageURL || "").trim(),
    imagePath: String(payload.imagePath || "").trim(),
    price: Number(payload.price),
    category: String(payload.category || "").trim(),
    brand: String(payload.brand || "").trim(),
    desc: String(payload.desc || "").trim(),
    createdAt: payload.createdAt || null,
    ...(payload.editedAt ? { editedAt: payload.editedAt } : {}),
  };
}

function toSupabaseProductRecord(product) {
  return {
    name: product.name,
    image_url: product.imageURL,
    image_path: product.imagePath,
    price: product.price,
    category: product.category,
    brand: product.brand,
    desc: product.desc,
    created_at: toIsoString(product.createdAt),
    edited_at: product.editedAt ? toIsoString(product.editedAt) : null,
  };
}

function validateProductPayload(product) {
  if (!product.name) {
    return "Product name is required.";
  }

  if (!product.imageURL) {
    return "Product image URL is required.";
  }

  if (!Number.isFinite(product.price) || product.price <= 0) {
    return "Product price must be greater than zero.";
  }

  if (!product.category) {
    return "Product category is required.";
  }

  if (!product.brand) {
    return "Product brand is required.";
  }

  if (!product.desc) {
    return "Product description is required.";
  }

  return "";
}

async function getAuthenticatedUserFromToken(token) {
  const user = await getSupabaseUserFromToken(token);
  return {
    email: normalizeEmail(user.email),
    id: user.id,
    rawUser: user,
  };
}

async function requireAuthenticatedUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token." });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    req.user = await getAuthenticatedUserFromToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({
      error: error?.message || "Unable to verify credentials.",
    });
  }
}

async function requireAdminUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing admin authorization token." });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const user = await getAuthenticatedUserFromToken(token);

    if (adminUids.size > 0 && !adminUids.has(user.id)) {
      return res.status(403).json({ error: "You do not have admin access." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      error: error?.message || "Unable to verify admin credentials.",
    });
  }
}

function toAmountInSmallestUnit(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.round(numeric * 100);
}

function computeOrderAmount(items) {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce((sum, item) => {
    const unitPrice = toAmountInSmallestUnit(item?.price);
    const quantity = Number(item?.cartQuantity || 1);
    const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    return sum + unitPrice * safeQty;
  }, 0);
}

function createReference() {
  return `eshop_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeOrderPayload(payload = {}, authenticatedUser = null) {
  const userId = authenticatedUser?.id || payload.userID || payload.userId || "";
  const userEmail = authenticatedUser?.email || payload.userEmail || payload.user_email || "";

  return {
    userID: String(userId).trim(),
    userEmail: normalizeEmail(userEmail),
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
  };
}

function validateOrderPayload(order) {
  if (!order.userID) {
    return "A signed-in user is required to save an order.";
  }

  if (!isValidEmail(order.userEmail)) {
    return "A valid order email is required.";
  }

  if (!order.orderDate || !order.orderTime) {
    return "Order date and time are required.";
  }

  if (!Number.isFinite(order.orderAmount) || order.orderAmount <= 0) {
    return "Order amount must be greater than zero.";
  }

  if (!order.orderStatus) {
    return "Order status is required.";
  }

  if (!Array.isArray(order.cartItems) || order.cartItems.length === 0) {
    return "Order items are required.";
  }

  return "";
}

function toSupabaseOrderRecord(order) {
  return {
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
  };
}

function normalizeReviewPayload(payload = {}, authenticatedUser = null) {
  return {
    userID: String(authenticatedUser?.id || payload.userID || "").trim(),
    userName: String(payload.userName || "").trim(),
    productID: String(payload.productID || "").trim(),
    rate: Number(payload.rate),
    review: String(payload.review || "").trim(),
    reviewDate: String(payload.reviewDate || "").trim(),
    createdAt: payload.createdAt || null,
  };
}

function validateReviewPayload(review) {
  if (!review.userID) {
    return "A signed-in user is required to submit a review.";
  }

  if (!review.userName) {
    return "Reviewer name is required.";
  }

  if (!review.productID) {
    return "A product is required for the review.";
  }

  if (!Number.isFinite(review.rate) || review.rate <= 0) {
    return "A review rating is required.";
  }

  if (!review.review) {
    return "Review text is required.";
  }

  return "";
}

function toSupabaseReviewRecord(review) {
  return {
    user_id: review.userID,
    user_name: review.userName,
    product_id: review.productID,
    rate: review.rate,
    review: review.review,
    review_date: review.reviewDate,
    created_at: toIsoString(review.createdAt),
  };
}

function paystackRequest(method, pathname, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : null;
    const request = https.request(
      {
        hostname: PAYSTACK_API_HOST,
        path: pathname,
        method,
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          Accept: "application/json",
          ...(body
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
              }
            : {}),
        },
      },
      (response) => {
        let rawData = "";

        response.on("data", (chunk) => {
          rawData += chunk;
        });

        response.on("end", () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};

            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(parsed);
              return;
            }

            const error = new Error(
              parsed?.message || `Paystack request failed with status ${response.statusCode}`
            );
            error.statusCode = response.statusCode;
            reject(error);
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", reject);
    if (body) {
      request.write(body);
    }
    request.end();
  });
}

app.post("/initialize-payment", async (req, res) => {
  try {
    if (!hasUsablePaystackSecret(paystackSecretKey)) {
      return res.status(503).json({
        error:
          "Paystack secret key is missing or still set to the example value in backend/.env",
      });
    }

    const { items, userEmail, shipping, billing, description } = req.body || {};
    const amount = computeOrderAmount(items);
    const currency = (process.env.PAYSTACK_CURRENCY || "NGN").toUpperCase();
    const reference = createReference();
    const normalizedEmail = normalizeEmail(userEmail);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: "A valid customer email is required for Paystack checkout.",
      });
    }

    if (!amount) {
      return res.status(400).json({ error: "Cart amount is invalid" });
    }

    const initialization = await paystackRequest("POST", "/transaction/initialize", {
      email: normalizedEmail,
      amount,
      currency,
      reference,
      channels: ["card"],
      metadata: {
        description: description || "Checkout payment",
        shipping: shipping || {},
        billing: billing || {},
      },
    });
    const transaction = initialization?.data;

    if (!initialization?.status || !transaction?.access_code) {
      return res.status(502).json({
        error: "Invalid Paystack initialization response.",
      });
    }

    return res.json({
      accessCode: transaction.access_code,
      amount,
      authorizationUrl: transaction.authorization_url,
      currency,
      email: normalizedEmail,
      reference: transaction.reference || reference,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to initialize payment",
    });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    if (!hasUsablePaystackSecret(paystackSecretKey)) {
      return res.status(503).json({
        error:
          "Paystack secret key is missing or still set to the example value in backend/.env",
      });
    }

    const { items, reference } = req.body || {};
    const expectedAmount = computeOrderAmount(items);
    const expectedCurrency = (process.env.PAYSTACK_CURRENCY || "NGN").toUpperCase();

    if (!reference) {
      return res.status(400).json({ error: "Payment reference is required." });
    }

    if (!expectedAmount) {
      return res.status(400).json({ error: "Cart amount is invalid" });
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
      return res.status(400).json({
        error: "Verified amount does not match the cart total.",
      });
    }

    if ((transaction.currency || "").toUpperCase() !== expectedCurrency) {
      return res.status(400).json({
        error: "Verified currency does not match the configured currency.",
      });
    }

    return res.json({
      amount: transaction.amount,
      paidAt: transaction.paid_at || transaction.paidAt || null,
      reference: transaction.reference,
      status: transaction.status,
      verified: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to verify payment",
    });
  }
});

app.post("/orders", requireAuthenticatedUser, async (req, res) => {
  try {
    const order = normalizeOrderPayload(req.body, req.user);
    const validationError = validateOrderPayload(order);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const rows = await supabaseRestRequest(
      "POST",
      `/rest/v1/${encodeURIComponent(supabaseOrdersTable)}?select=*`,
      toSupabaseOrderRecord(order)
    );
    const createdOrder = Array.isArray(rows) ? rows[0] : rows;
    return res.status(201).json(createdOrder);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to create order.",
    });
  }
});

app.get("/orders", requireAuthenticatedUser, async (req, res) => {
  try {
    const query = new URLSearchParams({
      select: "*",
      order: "created_at.desc",
    });

    if (req.query.scope !== "all" || !adminUids.has(req.user.id)) {
      query.set("user_id", `eq.${req.user.id}`);
    }

    const rows = await supabaseRestRequest(
      "GET",
      `/rest/v1/${encodeURIComponent(supabaseOrdersTable)}?${query.toString()}`
    );

    return res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to load orders.",
    });
  }
});

app.get("/orders/:id", requireAuthenticatedUser, async (req, res) => {
  try {
    const orderId = String(req.params.id || "").trim();

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const query = new URLSearchParams({
      select: "*",
      id: `eq.${orderId}`,
    });
    const rows = await supabaseRestRequest(
      "GET",
      `/rest/v1/${encodeURIComponent(supabaseOrdersTable)}?${query.toString()}`
    );
    const order = Array.isArray(rows) ? rows[0] : rows;

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (!adminUids.has(req.user.id) && order.user_id !== req.user.id) {
      return res.status(403).json({ error: "You do not have access to this order." });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to load the order.",
    });
  }
});

app.patch("/admin/orders/:id/status", requireAdminUser, async (req, res) => {
  try {
    const orderId = String(req.params.id || "").trim();
    const status = String(req.body?.status || "").trim();

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    if (!status) {
      return res.status(400).json({ error: "Order status is required." });
    }

    const query = new URLSearchParams({
      id: `eq.${orderId}`,
      select: "*",
    });
    const rows = await supabaseRestRequest(
      "PATCH",
      `/rest/v1/${encodeURIComponent(supabaseOrdersTable)}?${query.toString()}`,
      {
        order_status: status,
        edited_at: new Date().toISOString(),
      }
    );
    const updatedOrder = Array.isArray(rows) ? rows[0] : rows;
    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to update the order.",
    });
  }
});

app.delete("/admin/orders/:id", requireAdminUser, async (req, res) => {
  try {
    const orderId = String(req.params.id || "").trim();

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const query = new URLSearchParams({
      id: `eq.${orderId}`,
    });
    await supabaseRestRequest(
      "DELETE",
      `/rest/v1/${encodeURIComponent(supabaseOrdersTable)}?${query.toString()}`
    );
    return res.json({ id: orderId, success: true });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to delete the order.",
    });
  }
});

app.get("/reviews", async (req, res) => {
  try {
    const query = new URLSearchParams({
      select: "*",
      order: "created_at.desc",
    });

    if (req.query.productId) {
      query.set("product_id", `eq.${String(req.query.productId).trim()}`);
    }

    const rows = await supabaseRestRequest(
      "GET",
      `/rest/v1/${encodeURIComponent(supabaseReviewsTable)}?${query.toString()}`
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to load reviews.",
    });
  }
});

app.post("/reviews", requireAuthenticatedUser, async (req, res) => {
  try {
    const review = normalizeReviewPayload(req.body, req.user);
    const validationError = validateReviewPayload(review);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const rows = await supabaseRestRequest(
      "POST",
      `/rest/v1/${encodeURIComponent(supabaseReviewsTable)}?select=*`,
      toSupabaseReviewRecord(review)
    );
    const createdReview = Array.isArray(rows) ? rows[0] : rows;
    return res.status(201).json(createdReview);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to create review.",
    });
  }
});

app.post("/admin/products", requireAdminUser, async (req, res) => {
  try {
    const product = normalizeProductPayload(req.body);
    const validationError = validateProductPayload(product);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const rows = await supabaseRestRequest(
      "POST",
      `/rest/v1/${encodeURIComponent(supabaseProductsTable)}?select=*`,
      toSupabaseProductRecord(product)
    );
    const createdProduct = Array.isArray(rows) ? rows[0] : rows;
    return res.status(201).json({
      id: createdProduct?.id,
      product: createdProduct,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to create product.",
    });
  }
});

app.put("/admin/products/:id", requireAdminUser, async (req, res) => {
  try {
    const productId = String(req.params.id || "").trim();
    const product = normalizeProductPayload(req.body);
    const validationError = validateProductPayload(product);

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const query = new URLSearchParams({
      id: `eq.${productId}`,
      select: "*",
    });
    const rows = await supabaseRestRequest(
      "PATCH",
      `/rest/v1/${encodeURIComponent(supabaseProductsTable)}?${query.toString()}`,
      toSupabaseProductRecord(product)
    );
    const updatedProduct = Array.isArray(rows) ? rows[0] : rows;
    return res.json({
      id: productId,
      product: updatedProduct,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to update product.",
    });
  }
});

app.delete("/admin/products/:id", requireAdminUser, async (req, res) => {
  try {
    const productId = String(req.params.id || "").trim();

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    const query = new URLSearchParams({
      id: `eq.${productId}`,
    });
    await supabaseRestRequest(
      "DELETE",
      `/rest/v1/${encodeURIComponent(supabaseProductsTable)}?${query.toString()}`
    );
    return res.json({
      id: productId,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to delete product.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
