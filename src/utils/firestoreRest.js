import { auth, firebaseConfig } from "../firebase/config";

const FIRESTORE_BASE_URL = "https://firestore.googleapis.com/v1";

const getFirestoreBasePath = () => {
  const projectId = (firebaseConfig.projectId || "").trim();

  if (!projectId) {
    throw new Error("Firebase project ID is missing.");
  }

  return `${FIRESTORE_BASE_URL}/projects/${projectId}/databases/(default)/documents`;
};

const getAuthHeaders = async () => {
  const apiKey = (firebaseConfig.apiKey || "").trim();
  const currentUser = auth?.currentUser;

  if (!apiKey) {
    throw new Error("Firebase API key is missing.");
  }

  if (!currentUser) {
    throw new Error("You must be logged in before saving a product.");
  }

  const idToken = await currentUser.getIdToken();

  return {
    apiKey,
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  };
};

const toTimestampValue = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const toNumberField = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return { integerValue: "0" };
  }

  if (Number.isInteger(numericValue)) {
    return { integerValue: String(numericValue) };
  }

  return { doubleValue: numericValue };
};

const toFirestoreFields = (product) => {
  const createdAt = toTimestampValue(product.createdAt || new Date());
  const editedAt = toTimestampValue(product.editedAt);

  return {
    name: { stringValue: String(product.name || "") },
    imageURL: { stringValue: String(product.imageURL || "").trim() },
    price: toNumberField(product.price),
    category: { stringValue: String(product.category || "") },
    brand: { stringValue: String(product.brand || "") },
    desc: { stringValue: String(product.desc || "") },
    ...(createdAt ? { createdAt: { timestampValue: createdAt } } : {}),
    ...(editedAt ? { editedAt: { timestampValue: editedAt } } : {}),
  };
};

const parseFirestoreError = async (response) => {
  try {
    const json = await response.json();
    return json?.error?.message || "Firestore request failed.";
  } catch (_error) {
    return "Firestore request failed.";
  }
};

export const createProductViaRest = async (product) => {
  const { apiKey, headers } = await getAuthHeaders();
  const response = await fetch(
    `${getFirestoreBasePath()}/products?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        fields: toFirestoreFields(product),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await parseFirestoreError(response));
  }

  return response.json();
};

export const updateProductViaRest = async (id, product) => {
  if (!id) {
    throw new Error("Product ID is missing.");
  }

  const { apiKey, headers } = await getAuthHeaders();
  const response = await fetch(
    `${getFirestoreBasePath()}/products/${encodeURIComponent(id)}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        fields: toFirestoreFields(product),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await parseFirestoreError(response));
  }

  return response.json();
};
