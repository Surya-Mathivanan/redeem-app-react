"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Alert from "../components/Alert.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useDatabase } from "../contexts/DatabaseContext.jsx";

const Home = () => {
  const [alert, setAlert] = useState(null);
  const [activeCodes, setActiveCodes] = useState([]);
  const { user } = useAuth();
  const {
    redeemCodes,
    copies,
    users,
    addCopy,
    addMisuseLog,
    checkRapidCopying,
    suspendUser,
  } = useDatabase();

  useEffect(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeCodesData = redeemCodes
      .filter((code) => new Date(code.createdAt) >= sevenDaysAgo)
      .map((code) => {
        const codeCopies = copies.filter(
          (copy) => copy.redeemCodeId === code.id
        );
        const totalCopies = codeCopies.length;
        const userCopied = codeCopies.some((copy) => copy.userId === user.id);
        const codeUser = users.find((u) => u.id === code.userId);
        return {
          ...code,
          totalCopies,
          userCopied,
          userName: codeUser ? codeUser.name : "Unknown",
        };
      })
      .filter((code) => code.totalCopies < 5)
      .sort(
        (a, b) =>
          a.totalCopies - b.totalCopies ||
          new Date(b.createdAt) - new Date(a.createdAt)
      );
    setActiveCodes(activeCodesData);
  }, [redeemCodes, copies, users, user.id]);

  const handleCopyCode = async (codeId, codeText) => {
    const rapidCheck = checkRapidCopying(user.id);
    if (rapidCheck.isRapid) {
      addMisuseLog({
        userId: user.id,
        actionType: "RAPID_COPYING_DETECTED",
        details: `Attempted to copy code ${codeId} with ${rapidCheck.count} recent copies`,
      });
      suspendUser(
        user.id,
        "Rapid copying detected - potential misuse of platform"
      );
      setAlert({
        type: "danger",
        message:
          "<strong>Account Suspended!</strong><br>You have misused this platform by copying codes too rapidly. Your account has been temporarily suspended for the rest of the day.",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 5000);
      return;
    }
    const existingCopy = copies.find(
      (copy) => copy.userId === user.id && copy.redeemCodeId === codeId
    );
    if (existingCopy) {
      setAlert({
        type: "danger",
        message: "You have already copied this code.",
      });
      return;
    }
    const currentCopies = copies.filter(
      (copy) => copy.redeemCodeId === codeId
    ).length;
    if (currentCopies >= 5) {
      setAlert({
        type: "danger",
        message: "Copy limit reached for this code.",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(codeText);
      addCopy({
        userId: user.id,
        redeemCodeId: codeId,
      });
      addMisuseLog({
        userId: user.id,
        actionType: "CODE_COPIED",
        details: `Successfully copied code ${codeId}`,
      });
      setAlert({
        type: "success",
        message: "Code copied to clipboard!",
      });
      setActiveCodes((prev) =>
        prev
          .map((code) => {
            if (code.id === codeId) {
              const newTotalCopies = code.totalCopies + 1;
              return {
                ...code,
                totalCopies: newTotalCopies,
                userCopied: true,
              };
            }
            return code;
          })
          .filter((code) => code.totalCopies < 5)
      );
    } catch (err) {
      setAlert({
        type: "danger",
        message: "Failed to copy code to clipboard.",
      });
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h2 style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          Welcome, {user.name}!
        </h2>
        <span className="badge badge-primary">
          {activeCodes.length} Codes Available
        </span>
      </div>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="alert alert-warning">
        <i className="fas fa-exclamation-triangle"></i>
        <strong>Anti-Misuse System Active:</strong> Our AI monitors copying
        patterns. Rapid copying will result in automatic account suspension.
      </div>
      {activeCodes.length > 0 ? (
        <div className="codes-grid">
          {activeCodes.map((code) => (
            <div key={code.id} className="code-card">
              <div className="uiverse-card-responsive">
                <div className="card-body">
                  <h5 className="card-title">{code.title}</h5>
                  <div className="code-display-container">
                    <div
                      className={`code-display ${
                        !code.userCopied ? "blurred" : ""
                      }`}
                      id={`code-display-${code.id}`}
                    >
                      {code.code}
                    </div>
                    {!code.userCopied && (
                      <div
                        className="blur-overlay"
                        id={`blur-overlay-${code.id}`}
                      >
                        <small>
                          <i className="fas fa-eye-slash"></i>
                          Click copy to reveal code
                        </small>
                      </div>
                    )}
                  </div>
                  <p className="card-text">
                    <small>
                      <i className="fas fa-user"></i>Added by: {code.userName}
                      <br />
                      <i className="fas fa-calendar"></i>Date:{" "}
                      {new Date(code.createdAt).toLocaleString()}
                    </small>
                  </p>
                  <div className="card-footer">
                    <span className="badge badge-info">
                      <i className="fas fa-copy"></i>Copies: {code.totalCopies}
                    </span>
                    <button
                      className={`btn btn-copy ${
                        code.userCopied ? "btn-copied" : ""
                      }`}
                      onClick={() => handleCopyCode(code.id, code.code)}
                      disabled={code.userCopied}
                    >
                      {code.userCopied ? (
                        <>
                          <i className="fas fa-check"></i>Copied
                        </>
                      ) : (
                        <>
                          <i className="fas fa-copy"></i>Copy Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-inbox empty-icon"></i>
          <h4>No active redeem codes available</h4>
          <p>
            Codes are hidden after 7 days or when they reach 5 copies. Add a new
            code to get started!
          </p>
          <Link to="/add-code" className="btn btn-primary">
            <i className="fas fa-plus"></i>Add New Code
          </Link>
        </div>
      )}
    </Layout>
  );
};

export default Home;
