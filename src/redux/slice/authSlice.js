import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  isAuthReady: false,
  email: null,
  userName: null,
  userID: null,
  role: null,
  vendor: null,
  isAdmin: false,
  isSuperAdmin: false,
  isVendorAdmin: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    SET_AUTH_READY: (state, action) => {
      state.isAuthReady = Boolean(action.payload);
    },
    SET_ACTIVE_USER: (state, action) => {
      // console.log(action.payload);
      const {
        email,
        userName,
        userID,
        role,
        vendor,
        isAdmin,
        isSuperAdmin,
        isVendorAdmin,
      } = action.payload;
      state.isLoggedIn = true;
      state.isAuthReady = true;
      state.email = email;
      state.userName = userName;
      state.userID = userID;
      state.role = role;
      state.vendor = vendor || null;
      state.isAdmin = Boolean(isAdmin);
      state.isSuperAdmin = Boolean(isSuperAdmin);
      state.isVendorAdmin = Boolean(isVendorAdmin);
    },
    REMOVE_ACTIVE_USER(state, action) {
      state.isLoggedIn = false;
      state.isAdmin = false;
      state.isSuperAdmin = false;
      state.isVendorAdmin = false;
      state.email = null;
      state.userName = null;
      state.userID = null;
      state.role = null;
      state.vendor = null;
    },
  },
});

export const { SET_ACTIVE_USER, SET_AUTH_READY, REMOVE_ACTIVE_USER } = authSlice.actions;

export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectIsAuthReady = (state) => state.auth.isAuthReady;
export const selectEmail = (state) => state.auth.email;
export const selectUserName = (state) => state.auth.userName;
export const selectUserID = (state) => state.auth.userID;
export const selectRole = (state) => state.auth.role;
export const selectVendor = (state) => state.auth.vendor;
export const selectIsAdmin = (state) => state.auth.isAdmin;
export const selectIsSuperAdmin = (state) => state.auth.isSuperAdmin;
export const selectIsVendorAdmin = (state) => state.auth.isVendorAdmin;

export default authSlice.reducer;
