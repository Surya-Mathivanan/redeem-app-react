"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useDatabase } from "../contexts/DatabaseContext.jsx"

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { checkUserSuspension } = useDatabase()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      const suspension = checkUserSuspension(user.id)
      if (suspension) {
        logout()
        alert(
          `Your account has been suspended for misuse. Suspension ends: ${new Date(suspension.suspendedUntil).toLocaleString()}`,
        )
        navigate("/login")
      }
    }
  }, [user, checkUserSuspension, logout, navigate])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const showComingSoon = (feature) => {
    alert(`${feature} feature is coming soon!`)
    closeMobileMenu()
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
          <i className="fas fa-bars"></i>
        </button>
        <h5 className="mobile-title">
          <i className="fas fa-gift"></i>Redeem Manager
        </h5>
        <div style={{ width: "40px" }}></div>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && <div className="mobile-backdrop" onClick={closeMobileMenu}></div>}

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-drawer-header">
          <h5>
            <i className="fas fa-gift"></i>Menu
          </h5>
          <button className="mobile-drawer-close" onClick={closeMobileMenu}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="mobile-nav">
          <Link to="/home" className={`nav-link ${isActive("/home") ? "active" : ""}`} onClick={closeMobileMenu}>
            <i className="fas fa-home"></i>Home
          </Link>
          <Link
            to="/add-code"
            className={`nav-link ${isActive("/add-code") ? "active" : ""}`}
            onClick={closeMobileMenu}
          >
            <i className="fas fa-plus"></i>Add Redeem Code
          </Link>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
            onClick={closeMobileMenu}
          >
            <i className="fas fa-chart-bar"></i>Dashboard
          </Link>
          <Link to="/archive" className={`nav-link ${isActive("/archive") ? "active" : ""}`} onClick={closeMobileMenu}>
            <i className="fas fa-archive"></i>Archive
          </Link>
          <Link to="/account" className={`nav-link ${isActive("/account") ? "active" : ""}`} onClick={closeMobileMenu}>
            <i className="fas fa-user"></i>Account
          </Link>
          <button className="nav-link" onClick={() => showComingSoon("Contact")}>
            <i className="fas fa-envelope"></i>Contact
          </button>
          <button className="nav-link" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>Logout
          </button>
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="sidebar">
        <div className="sidebar-content">
          <h4 className="sidebar-logo">
            <i className="fas fa-gift"></i>
          </h4>
          <nav className="desktop-nav">
            <Link to="/home" className={`nav-link ${isActive("/home") ? "active" : ""}`}>
              <i className="fas fa-home"></i>Home
            </Link>
            <Link to="/account" className={`nav-link ${isActive("/account") ? "active" : ""}`}>
              <i className="fas fa-user"></i>Account
            </Link>
            <Link to="/add-code" className={`nav-link ${isActive("/add-code") ? "active" : ""}`}>
              <i className="fas fa-plus"></i>Add Redeem Code
            </Link>
            <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
              <i className="fas fa-chart-bar"></i>Dashboard
            </Link>
            <Link to="/archive" className={`nav-link ${isActive("/archive") ? "active" : ""}`}>
              <i className="fas fa-archive"></i>Archive
            </Link>
            <button className="nav-link" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">{children}</div>
    </div>
  )
}

export default Layout
