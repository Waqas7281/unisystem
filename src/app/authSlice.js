import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

const clearStorage = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    // Server ne kyun nikala: 'blocked' | 'expired' | null
    logoutReason: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.logoutReason = null;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.accessToken);
    },
    // User ne khud Logout dabaya
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.logoutReason = null;
      clearStorage();
    },
    // Server ne 401 diya (blocked / deleted / token expired)
    forceLogout: (state, action) => {
      state.user = null;
      state.token = null;
      state.logoutReason = action.payload || "expired";
      clearStorage();
    },
    clearLogoutReason: (state) => {
      state.logoutReason = null;
    },
  },
});

export const { setCredentials, logout, forceLogout, clearLogoutReason } =
  authSlice.actions;
export default authSlice.reducer;
