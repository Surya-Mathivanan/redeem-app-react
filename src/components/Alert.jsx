"use client"

import { useState, useEffect } from "react"

const Alert = ({ type, message, onClose, autoClose = true }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false)
        if (onClose) onClose()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  const handleClose = () => {
    setVisible(false)
    if (onClose) onClose()
  }

  if (!visible) return null

  return (
    <div className={`alert alert-${type}`}>
      <span dangerouslySetInnerHTML={{ __html: message }} />
      <button className="alert-close" onClick={handleClose}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  )
}

export default Alert
