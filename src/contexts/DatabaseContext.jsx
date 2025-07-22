"use client";

import { createContext, useContext } from "react";
import { apiClient } from "../utils/apiClient.js";

const DatabaseContext = createContext();

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  // All DB actions are now API calls
  const register = (data) => apiClient.post("/api/register", data);
  const login = (data) => apiClient.post("/api/login", data);
  const getRedeemCodes = () => apiClient.get("/api/redeem-codes");
  const addRedeemCode = (data) => apiClient.post("/api/redeem-codes", data);
  const copyCode = (data) => apiClient.post("/api/copy-code", data);
  const getArchive = () => apiClient.get("/api/archive");
  const getDashboard = () => apiClient.get("/api/dashboard");
  const getAccount = () => apiClient.get("/api/account");

  return (
    <DatabaseContext.Provider
      value={{
        register,
        login,
        getRedeemCodes,
        addRedeemCode,
        copyCode,
        getArchive,
        getDashboard,
        getAccount,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
