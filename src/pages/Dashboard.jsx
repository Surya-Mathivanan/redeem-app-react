"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout.jsx"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useDatabase } from "../contexts/DatabaseContext.jsx"

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCopies: 0,
    addedCodes: 0,
  })
  const { user } = useAuth()
  const { copies, redeemCodes } = useDatabase()

  useEffect(() => {
    const totalCopies = copies.filter((copy) => copy.userId === user.id).length
    const addedCodes = redeemCodes.filter((code) => code.userId === user.id).length

    setStats({ totalCopies, addedCodes })
  }, [copies, redeemCodes, user.id])

  return (
    <Layout>
      <h2>Dashboard</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="uiverse-card-responsive">
            <div className="card-body dashboard-stat">
              <i className="fas fa-copy stat-icon"></i>
              <h3>{stats.totalCopies}</h3>
              <p>Total Codes Copied</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="uiverse-card2-responsive">
            <div className="card-body dashboard-stat">
              <i className="fas fa-plus-circle stat-icon stat-success"></i>
              <h3>{stats.addedCodes}</h3>
              <p>Codes Added by You</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-summary">
        <div className="uiverse-card-responsive">
          <div className="card-body">
            <h5>
              <i className="fas fa-info-circle"></i>Your Activity Summary
            </h5>
            <p>
              You have copied <strong>{stats.totalCopies}</strong> redeem codes and contributed{" "}
              <strong>{stats.addedCodes}</strong> codes to the community.
            </p>
            {stats.totalCopies === 0 && stats.addedCodes === 0 && (
              <div className="alert alert-info">
                <i className="fas fa-lightbulb"></i>
                Get started by adding your first redeem code or copying codes from other users!
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
