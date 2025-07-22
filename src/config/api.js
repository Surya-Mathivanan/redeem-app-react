export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_ENDPOINTS = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ADD_CODE: "/add_code",
  COPY_CODE: "/copy_code",
  ARCHIVE: "/archive",
  DASHBOARD: "/dashboard",
  LOGOUT: "/logout",
};
