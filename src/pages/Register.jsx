"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useDatabase } from "../contexts/DatabaseContext.jsx";
import Alert from "../components/Alert.jsx";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const { login } = useAuth();
  const { register } = useDatabase();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await register(formData);
      localStorage.setItem("token", res.token);
      login(res.user);
      setAlert({
        type: "success",
        message: "Registration successful!",
      });
      setTimeout(() => navigate("/home"), 1000);
    } catch (err) {
      setAlert({
        type: "danger",
        message: err.message || "Registration failed.",
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-content">
          <i className="fas fa-user-plus auth-icon"></i>
          <h2>Join Our Community</h2>
          <p className="auth-lead">
            Create an account to start managing your redeem codes
          </p>
          <p className="warning-text">
            ⚠️ WARNING: Misuse of this platform will lead to automatic
            termination!
          </p>
          <ul className="auth-features warning-list">
            <li>The redeem code you copied may already have been used.</li>
            <li>Don't worry — try using another code.</li>
            <li>Avoid unnecessary copying.</li>
            <li>Warning to those who misuse:</li>
            <li>
              Our AI system monitors user activity. If misuse is detected, the
              user will be terminated automatically.
            </li>
            <li>All activities are stored in our database.</li>
            <li>Use the code wisely and make the best use of it.</li>
          </ul>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-body">
            <h3 className="auth-title">Register</h3>

            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-success btn-full">
                Register
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login">Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
