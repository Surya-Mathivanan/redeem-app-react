"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Layout from "../components/Layout.jsx"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useDatabase } from "../contexts/DatabaseContext.jsx"

const Archive = () => {
  const [archivedCodes, setArchivedCodes] = useState([])
  const { user } = useAuth()
  const { redeemCodes, copies, users } = useDatabase()

  useEffect(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const archived = redeemCodes
      .map((code) => {
        const codeCopies = copies.filter((copy) => copy.redeemCodeId === code.id)
        const totalCopies = codeCopies.length
        const userCopied = codeCopies.some((copy) => copy.userId === user.id)
        const codeUser = users.find((u) => u.id === code.userId)
        const isExpired = new Date(code.createdAt) < sevenDaysAgo
        const isExhausted = totalCopies >= 5

        if (isExpired || isExhausted) {
          return {
            ...code,
            totalCopies,
            userCopied,
            userName: codeUser ? codeUser.name : "Unknown",
            status: isExpired ? "Expired" : "Exhausted",
          }
        }
        return null
      })
      .filter((code) => code !== null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    setArchivedCodes(archived)
  }, [redeemCodes, copies, users, user.id])

  return (
    <Layout>
      <div className="page-header">
        <h2>Archived Codes</h2>
        <span className="badge badge-secondary">{archivedCodes.length} Archived Codes</span>
      </div>

      <div className="alert alert-info">
        <i className="fas fa-info-circle"></i>
        This page shows codes that are no longer active - either expired (older than 7 days) or exhausted (more than 5
        copies).
      </div>

      {archivedCodes.length > 0 ? (
        <div className="codes-grid">
          {archivedCodes.map((code) => (
            <div key={code.id} className="code-card">
              <div className="uiverse-card2-responsive archived-card">
                <div className="card-body">
                  <div className="card-header-with-badge">
                    <h5 className="card-title archived-title">{code.title}</h5>
                    <span className={`badge ${code.status === "Expired" ? "badge-warning" : "badge-danger"}`}>
                      {code.status}
                    </span>
                  </div>

                  <div className="code-display archived-code">{code.code}</div>

                  <p className="card-text">
                    <small>
                      <i className="fas fa-user"></i>Added by: {code.userName}
                      <br />
                      <i className="fas fa-calendar"></i>Date: {new Date(code.createdAt).toLocaleString()}
                    </small>
                  </p>

                  <div className="card-footer">
                    <span className="badge badge-secondary">
                      <i className="fas fa-copy"></i>Final Copies: {code.totalCopies}
                    </span>
                    <button className="btn btn-secondary" disabled>
                      <i className="fas fa-archive"></i>Archived
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-archive empty-icon"></i>
          <h4>No archived codes</h4>
          <p>Codes will appear here when they expire or reach the copy limit.</p>
          <Link to="/home" className="btn btn-primary">
            <i className="fas fa-home"></i>Back to Home
          </Link>
        </div>
      )}
    </Layout>
  )
}

export default Archive
