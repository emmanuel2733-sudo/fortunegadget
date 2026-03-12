import {
  auth as firebaseAuth,
  firebaseInitError,
  isFirebaseEnabled,
} from "../firebase/config";
import { supabase, supabaseInitError, isSupabaseEnabled } from "../supabase/config";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";

export const authProvider = (import.meta.env.REACT_APP_BACKEND_PROVIDER || "firebase")
  .trim()
  .toLowerCase();

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

const mapFirebaseUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    email: user.email || "",
    id: user.uid,
    displayName: getDisplayName(user),
    rawUser: user,
  };
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

export const getAuthInitError = () => {
  if (authProvider === "supabase") {
    return supabaseInitError;
  }

  return firebaseInitError;
};

export const isAuthConfigured = () => {
  if (authProvider === "supabase") {
    return isSupabaseEnabled && Boolean(supabase);
  }

  return isFirebaseEnabled && Boolean(firebaseAuth);
};

export const signInWithPassword = async (email, password) => {
  if (authProvider === "supabase") {
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
  }

  if (!firebaseAuth) {
    throw new Error(getAuthInitError() || "Firebase is not configured.");
  }

  const { user } = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return mapFirebaseUser(user);
};

export const signUpWithPassword = async (email, password) => {
  if (authProvider === "supabase") {
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
  }

  if (!firebaseAuth) {
    throw new Error(getAuthInitError() || "Firebase is not configured.");
  }

  const { user } = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return {
    needsEmailConfirmation: false,
    user: mapFirebaseUser(user),
  };
};

export const requestPasswordReset = async (email) => {
  if (authProvider === "supabase") {
    if (!supabase) {
      throw new Error(getAuthInitError() || "Supabase is not configured.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${frontendUrl}/reset`,
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (!firebaseAuth) {
    throw new Error(getAuthInitError() || "Firebase is not configured.");
  }

  await sendPasswordResetEmail(firebaseAuth, email.trim());
};

export const signInWithGoogleProvider = async () => {
  if (authProvider === "supabase") {
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
  }

  if (!firebaseAuth) {
    throw new Error(getAuthInitError() || "Firebase is not configured.");
  }

  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(firebaseAuth, provider);
  return {
    redirecting: false,
    user: mapFirebaseUser(user),
  };
};

export const signOutUser = async () => {
  if (authProvider === "supabase") {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return;
  }

  if (!firebaseAuth) {
    return;
  }

  await firebaseSignOut(firebaseAuth);
};

export const getCurrentAccessToken = async () => {
  if (authProvider === "supabase") {
    if (!supabase) {
      return "";
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  if (!firebaseAuth?.currentUser) {
    return "";
  }

  return firebaseAuth.currentUser.getIdToken();
};

export const subscribeToAuthUser = async (callback) => {
  if (authProvider === "supabase") {
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
  }

  if (!firebaseAuth) {
    callback(null);
    return () => undefined;
  }

  const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
    callback(mapFirebaseUser(user));
  });

  return unsubscribe;
};
