import { supabase, supabaseInitError, isSupabaseEnabled } from "../supabase/config";

export const authProvider = "supabase";

const frontendUrl =
  (import.meta.env.REACT_APP_FRONTEND_URL || "").trim() || window.location.origin;

const getDisplayName = (user) => {
  if (!user) {
    return "";
  }

  const candidates = [
    user.user_metadata?.full_name,
    user.user_metadata?.name,
    user.displayName,
    user.email ? user.email.split("@")[0] : "",
  ];

  const displayName = candidates.find((value) => String(value || "").trim());
  return displayName ? String(displayName).trim() : "";
};

const mapSupabaseUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    email: user.email || "",
    id: user.id,
    displayName: getDisplayName(user),
    rawUser: user,
  };
};

export const getAuthInitError = () => supabaseInitError;

export const isAuthConfigured = () => isSupabaseEnabled && Boolean(supabase);

export const signInWithPassword = async (email, password) => {
  if (!supabase) {
    throw new Error(getAuthInitError() || "Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  return mapSupabaseUser(data.user);
};

export const signUpWithPassword = async (email, password) => {
  if (!supabase) {
    throw new Error(getAuthInitError() || "Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${frontendUrl}/login`,
    },
  });

  if (error) {
    throw error;
  }

  return {
    needsEmailConfirmation: !data.session,
    user: mapSupabaseUser(data.user),
  };
};

export const requestPasswordReset = async (email) => {
  if (!supabase) {
    throw new Error(getAuthInitError() || "Supabase is not configured.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${frontendUrl}/reset`,
  });

  if (error) {
    throw error;
  }
};

export const signInWithGoogleProvider = async () => {
  if (!supabase) {
    throw new Error(getAuthInitError() || "Supabase is not configured.");
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${frontendUrl}/`,
    },
  });

  if (error) {
    throw error;
  }

  return { redirecting: true };
};

export const signOutUser = async () => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

export const getCurrentAccessToken = async () => {
  if (!supabase) {
    return "";
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || "";
};

export const subscribeToAuthUser = async (callback) => {
  if (!supabase) {
    callback(null);
    return () => undefined;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  callback(mapSupabaseUser(session?.user || null));

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, nextSession) => {
    callback(mapSupabaseUser(nextSession?.user || null));
  });

  return () => subscription.unsubscribe();
};
