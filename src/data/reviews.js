import { getCurrentAccessToken } from "../auth/client";

const apiBaseUrl = (
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

const requestReviewsApi = async (endpoint, options = {}, requireAuth = false) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (requireAuth) {
    const token = await getCurrentAccessToken();

    if (!token) {
      throw new Error("You must be signed in to submit a review.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error || "Review request failed.");
  }

  return json;
};

export const mapReviewRecord = (review = {}) => ({
  id: review.id,
  userID: String(review.user_id || review.userID || "").trim(),
  userName: String(review.user_name || review.userName || "").trim(),
  productID: String(review.product_id || review.productID || "").trim(),
  rate: Number(review.rate || 0),
  review: String(review.review || "").trim(),
  reviewDate: String(review.review_date || review.reviewDate || "").trim(),
  createdAt: review.created_at || review.createdAt || null,
});

export const listReviews = async ({ productId } = {}) => {
  const query = productId
    ? `?productId=${encodeURIComponent(productId)}`
    : "";
  const data = await requestReviewsApi(`/reviews${query}`, { method: "GET" });
  return Array.isArray(data) ? data.map(mapReviewRecord) : [];
};

export const createReview = async (review) => {
  const data = await requestReviewsApi(
    "/reviews",
    {
      method: "POST",
      body: JSON.stringify(review),
    },
    true
  );

  return data ? mapReviewRecord(data) : null;
};
