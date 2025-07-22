"use client"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout.jsx"
import { useAuth } from "../contexts/AuthContext.jsx"

const Account = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <Layout>
      <h2>Account Information</h2>

      <div className="account-container">
        <div className="account-card">
          <div className="uiverse-card2-responsive">
            <div className="card-body account-info">
              <div className="account-avatar">
                <i className="fas fa-user-circle"></i>
              </div>

              <h4>{user.name}</h4>

              <div className="account-details">
                <p>
                  <i className="fas fa-envelope"></i>
                  <strong>Email:</strong> {user.email}
                </p>
              </div>

              <button className="btn btn-danger btn-full" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="subscription-notice">
        <p className="typing-text">Subscription coming soon...</p>
      </div>
    </Layout>
  )
}

export default Account
