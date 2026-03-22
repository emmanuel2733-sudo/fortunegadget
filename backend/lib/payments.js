const https = require("https");
const { config } = require("./config");

const hasUsablePaystackSecret = () =>
  Boolean(config.paystackSecretKey) &&
  config.paystackSecretKey.startsWith("sk_") &&
  !config.paystackSecretKey.includes("your_secret_key");

const toAmountInSmallestUnit = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.round(numeric * 100);
};

const computeOrderAmount = (items) => {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce((sum, item) => {
    const unitPrice = toAmountInSmallestUnit(item?.price);
    const quantity = Number(item?.cartQuantity || 1);
    const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    return sum + unitPrice * safeQty;
  }, 0);
};

const createReference = () =>
  `fortunegadget_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const collectUniqueVendorIds = (items) => [
  ...new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => String(item?.vendorID || item?.vendorId || item?.vendor_id || "").trim())
      .filter(Boolean)
  ),
];

const paystackRequest = (method, pathname, payload) =>
  new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : null;
    const request = https.request(
      {
        hostname: config.paystackApiHost,
        path: pathname,
        method,
        headers: {
          Authorization: `Bearer ${config.paystackSecretKey}`,
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

            reject(
              new Error(
                parsed?.message ||
                  `Paystack request failed with status ${response.statusCode}`
              )
            );
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

module.exports = {
  collectUniqueVendorIds,
  computeOrderAmount,
  createReference,
  hasUsablePaystackSecret,
  paystackRequest,
  toAmountInSmallestUnit,
};
