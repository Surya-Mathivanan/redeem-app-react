"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout.jsx"
import Alert from "../components/Alert.jsx"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useDatabase } from "../contexts/DatabaseContext.jsx"

const AddCode = () => {
  const [formData, setFormData] = useState({
    title: "",
    code: "",
  })
  const [alert, setAlert] = useState(null)
  const { user } = useAuth()
  const { addRedeemCode } = useDatabase()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    try {
      addRedeemCode({
        ...formData,
        userId: user.id,
      })

      setAlert({
        type: "success",
        message: "Redeem code added successfully!",
      })

      setTimeout(() => {
        navigate("/home")
      }, 1500)
    } catch (error) {
      setAlert({
        type: "danger",
        message: "Error adding code. Please try again.",
      })
    }
  }

  return (
    <Layout>
      <h2>Add New Redeem Code</h2>

      <div className="form-container">
        <div className="form-card">
          <div className="uiverse-card-responsive">
            <div className="card-body">
              {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="title">
                    <i className="fas fa-tag"></i>Code Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter the redeem code title"
                    required
                  />
                  <small>Give your redeem code a descriptive title</small>
                </div>

                <div className="form-group">
                  <label htmlFor="code">
                    <i className="fas fa-key"></i>Redeem Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Enter the redeem code"
                    required
                  />
                  <small>Enter the actual redeem code</small>
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  <i className="fas fa-plus"></i>Add Redeem Code
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AddCode
