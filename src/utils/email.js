export const normalizeEmail = (value) => (value || "").trim().toLowerCase();

export const isValidEmail = (value) => {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const pickValidEmail = (...values) => {
  const match = values.map(normalizeEmail).find(isValidEmail);
  return match || "";
};
