"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Alert from "../components/Alert.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useDatabase } from "../contexts/DatabaseContext.jsx";

const Home = () => {
  const { getRedeemCodes } = useDatabase();
  const { user } = useAuth();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    setLoading(true);
    getRedeemCodes()
      .then((data) => {
        setCodes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setAlert({
          type: "danger",
          message: err.message || "Failed to load codes",
        });
        setCodes([]);
        setLoading(false);
      });
  }, [getRedeemCodes]);

  // Always check codes is an array before using .filter or .map
  const activeCodes = Array.isArray(codes)
    ? codes.filter((code) => !code.user_copied)
    : [];

  return (
    <Layout>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      {loading ? (
        <div>Loading...</div>
      ) : activeCodes.length > 0 ? (
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
