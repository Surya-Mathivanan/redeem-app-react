"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const DatabaseContext = createContext();

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

function getTodayEnd() {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
}

export const DatabaseProvider = ({ children }) => {
  // Local state for users, codes, copies, suspensions, misuse logs
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : [];
  });
  const [redeemCodes, setRedeemCodes] = useState(() => {
    const saved = localStorage.getItem("redeemCodes");
    return saved ? JSON.parse(saved) : [];
  });
  const [copies, setCopies] = useState(() => {
    const saved = localStorage.getItem("copies");
    return saved ? JSON.parse(saved) : [];
  });
  const [misuseLogs, setMisuseLogs] = useState(() => {
    const saved = localStorage.getItem("misuseLogs");
    return saved ? JSON.parse(saved) : [];
  });
  const [suspensions, setSuspensions] = useState(() => {
    const saved = localStorage.getItem("suspensions");
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem("redeemCodes", JSON.stringify(redeemCodes));
  }, [redeemCodes]);
  useEffect(() => {
    localStorage.setItem("copies", JSON.stringify(copies));
  }, [copies]);
  useEffect(() => {
    localStorage.setItem("misuseLogs", JSON.stringify(misuseLogs));
  }, [misuseLogs]);
  useEffect(() => {
    localStorage.setItem("suspensions", JSON.stringify(suspensions));
  }, [suspensions]);

  // User management
  const addUser = (user) => {
    const id = crypto.randomUUID();
    const newUser = { ...user, id };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };
  const findUser = (email) => users.find((u) => u.email === email);
  const getUserById = (id) => users.find((u) => u.id === id);

  // Suspension management
  const suspendUser = (userId, reason) => {
    const suspendedUntil = getTodayEnd().toISOString();
    setSuspensions((prev) => [...prev, { userId, suspendedUntil, reason }]);
  };
  const checkUserSuspension = (userId) =>
    suspensions.find(
      (s) => s.userId === userId && new Date(s.suspendedUntil) > new Date()
    );

  // Misuse log
  const addMisuseLog = (log) =>
    setMisuseLogs((prev) => [
      ...prev,
      { ...log, timestamp: new Date().toISOString() },
    ]);

  // Redeem code management
  const addRedeemCode = ({ title, code, userId }) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    setRedeemCodes((prev) => [...prev, { id, title, code, userId, createdAt }]);
    return { id, title, code, userId, createdAt };
  };

  // Copy management
  const addCopy = ({ userId, redeemCodeId }) => {
    setCopies((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        userId,
        redeemCodeId,
        copiedAt: new Date().toISOString(),
      },
    ]);
  };

  // Rapid copying detection (5 copies in 1 minute)
  const checkRapidCopying = (userId) => {
    const now = Date.now();
    const recent = copies.filter(
      (c) =>
        c.userId === userId && now - new Date(c.copiedAt).getTime() < 60 * 1000
    );
    return { isRapid: recent.length >= 5, count: recent.length };
  };

  // Archive logic
  const getArchivedCodes = useCallback(
    (currentUserId) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return redeemCodes
        .map((code) => {
          const codeCopies = copies.filter(
            (copy) => copy.redeemCodeId === code.id
          );
          const totalCopies = codeCopies.length;
          const userCopied = codeCopies.some(
            (copy) => copy.userId === currentUserId
          );
          const codeUser = getUserById(code.userId);
          const isExpired = new Date(code.createdAt) < sevenDaysAgo;
          const isExhausted = totalCopies >= 5;
          if (isExpired || isExhausted) {
            return {
              ...code,
              totalCopies,
              userCopied,
              userName: codeUser ? codeUser.name : "Unknown",
              status: isExpired ? "Expired" : "Exhausted",
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    [redeemCodes, copies, users]
  );

  // Dashboard logic
  const getDashboardData = (userId) => ({
    totalCopies: copies.filter((c) => c.userId === userId).length,
    addedCodes: redeemCodes.filter((c) => c.userId === userId).length,
  });

  // Value for context
  const value = {
    users,
    addUser,
    findUser,
    getUserById,
    redeemCodes,
    addRedeemCode,
    copies,
    addCopy,
    misuseLogs,
    addMisuseLog,
    suspensions,
    suspendUser,
    checkUserSuspension,
    checkRapidCopying,
    getArchivedCodes,
    getDashboardData,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
