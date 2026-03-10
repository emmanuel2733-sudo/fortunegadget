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

function hasUsablePaystackSecret(key) {
  return Boolean(key) && key.startsWith("sk_") && !key.includes("your_secret_key");
}

app.use(
  cors({
    origin: FRONTEND_URL,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

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

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
