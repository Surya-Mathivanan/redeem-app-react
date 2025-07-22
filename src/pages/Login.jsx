"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useDatabase } from "../contexts/DatabaseContext.jsx"
import Alert from "../components/Alert.jsx"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [alert, setAlert] = useState(null)
  const { login } = useAuth()
  const { findUser, checkUserSuspension } = useDatabase()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const user = findUser(formData.email)

    if (user && user.password === formData.password) {
      // Check if user is suspended
      const suspension = checkUserSuspension(user.id)
      if (suspension) {
        setAlert({
          type: "danger",
          message: `Your account is suspended until ${new Date(suspension.suspendedUntil).toLocaleString()}. Reason: ${suspension.reason}`,
        })
        return
      }

      login(user)
      setAlert({
        type: "success",
        message: "Login successful!",
      })
      setTimeout(() => navigate("/home"), 1000)
    } else {
      setAlert({
        type: "danger",
        message: "Invalid email or password. Please register if you don't have an account.",
      })
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-content">
          <i className="fas fa-gift auth-icon"></i>
          <h2>Welcome to Redeem Code Manager</h2>
          <p className="auth-lead">Manage and share your Google Pay redeem codes easily</p>
          <ul className="auth-features">
            <li>This platform is free for users.</li>
            <li>Anyone can post their redeem code.</li>
            <li>Anyone can use it easily.</li>
          </ul>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-body">
            <h3 className="auth-title">Login</h3>

            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
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
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                Login
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account? <Link to="/register">Register here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
