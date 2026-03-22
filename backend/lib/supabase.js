const { config } = require("./config");

const hasSupabaseAdminConfig = () =>
  Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);

const buildTablePath = (tableName, query = "") =>
  `/rest/v1/${encodeURIComponent(tableName)}${query ? `?${query}` : ""}`;

const getResponseErrorMessage = (json, fallback) =>
  json?.message || json?.msg || json?.error_description || json?.error || fallback;

const parseJsonResponse = async (response, fallback = {}) =>
  response.json().catch(() => fallback);

async function supabaseRestRequest(method, pathname, payload, options = {}) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error(
      "Supabase Admin is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend variables."
    );
  }

  const body = payload ? JSON.stringify(payload) : undefined;
  const preferHeader =
    options.prefer || (body ? "return=representation" : "");

  const response = await fetch(`${config.supabaseUrl}${pathname}`, {
    method,
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(preferHeader ? { Prefer: preferHeader } : {}),
    },
    ...(body ? { body } : {}),
  });

  const json = await parseJsonResponse(
    response,
    Array.isArray(options.fallbackJson) ? [] : {}
  );

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(json, "Supabase request failed."));
  }

  return json;
}

async function supabaseAuthAdminRequest(method, pathname, payload) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error(
      "Supabase Admin is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend variables."
    );
  }

  const body = payload ? JSON.stringify(payload) : undefined;
  const response = await fetch(`${config.supabaseUrl}${pathname}`, {
    method,
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body } : {}),
  });

  const json = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(json, "Supabase auth admin request failed."));
  }

  return json;
}

async function getSupabaseUserFromToken(token) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error(
      "Supabase Admin is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend variables."
    );
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(payload, "Unable to verify Supabase credentials."));
  }

  return payload;
}

module.exports = {
  buildTablePath,
  getSupabaseUserFromToken,
  hasSupabaseAdminConfig,
  supabaseAuthAdminRequest,
  supabaseRestRequest,
};
