export const APP_ROLES = {
  CUSTOMER: "customer",
  VENDOR_ADMIN: "vendor_admin",
  SUPER_ADMIN: "super_admin",
};

export const isSuperAdminRole = (role) => role === APP_ROLES.SUPER_ADMIN;

export const isVendorAdminRole = (role) => role === APP_ROLES.VENDOR_ADMIN;

export const canAccessVendorAdmin = (role) =>
  isVendorAdminRole(role) || isSuperAdminRole(role);
