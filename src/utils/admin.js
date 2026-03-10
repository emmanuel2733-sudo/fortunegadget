const parseListFromEnv = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const adminUids = parseListFromEnv(import.meta.env.REACT_APP_ADMIN_UIDS);

export const isAdminUser = (_email, uid) => {
  const normalizedUid = uid || "";
  return adminUids.includes(normalizedUid);
};

export const hasAdminRules = adminUids.length > 0;
