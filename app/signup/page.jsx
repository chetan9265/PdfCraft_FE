"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "../_component/Navbar"
import axios from "axios"

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 3000)
  }

  const register = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        email,
        password
      })

      showToast("Account created successfully! Please login.", "success")
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
      
    } catch (err) {
      showToast(err.response?.data?.message || "Registration failed. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      register()
    }
  }

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      position: "relative",
    },
    mainContent: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "calc(100vh - 70px)",
      padding: "40px",
    },
    registerCard: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      padding: "40px",
      width: "100%",
      marginTop: "10px",
      maxWidth: "450px",
      transition: "all 0.3s ease",
    },
    title: {
      textAlign: "center",
      color: "#1e293b",
      fontSize: "2rem",
      marginBottom: "10px",
      fontWeight: "600",
    },
    subtitle: {
      textAlign: "center",
      color: "#64748b",
      fontSize: "0.95rem",
      marginBottom: "30px",
    },
    inputGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      color: "#334155",
      fontSize: "0.9rem",
      fontWeight: "500",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "1rem",
      border: "2px solid #e2e8f0",
      borderRadius: "10px",
      outline: "none",
      transition: "all 0.3s ease",
      backgroundColor: "#f8fafc",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      padding: "14px",
      fontSize: "1rem",
      fontWeight: "600",
      color: "#ffffff",
      backgroundColor: "#10b981",
      border: "none",
      borderRadius: "10px",
      cursor: loading ? "not-allowed" : "pointer",
      transition: "all 0.3s ease",
      opacity: loading ? 0.7 : 1,
      marginTop: "10px",
    },
    error: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "20px",
      fontSize: "0.9rem",
      textAlign: "center",
      border: "1px solid #fecaca",
    },
    footer: {
      textAlign: "center",
      marginTop: "25px",
      color: "#64748b",
      fontSize: "0.9rem",
    },
    link: {
      color: "#10b981",
      textDecoration: "none",
      fontWeight: "500",
      cursor: "pointer",
      marginLeft: "5px",
    },toast: {
  position: "fixed",
  top: "20px",
  right: "20px",
  minWidth: "300px",
  maxWidth: "400px",
  padding: "16px 20px",
  borderRadius: "10px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  zIndex: 9999,
  animation: "slideIn 0.3s ease",
  backgroundColor: "#ffffff",
  color: "#1e293b",
  borderBottom: toast.type === "success" ? "4px solid #10b981" : "4px solid #ef4444",
  display: toast.show ? "block" : "none",
},
toastContent: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
},
toastMessage: {
  flex: 1,
  fontSize: "0.95rem",
  fontWeight: "500",
  color: "#334155",
},
toastClose: {
  background: "none",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: "1.2rem",
  fontWeight: "600",
  opacity: 0.8,
  transition: "opacity 0.2s",
  padding: "0 4px",
},
  }

  return (
    <div style={styles.container}>
      {/* Toast Message */}
      <div style={styles.toast}>
        <div style={styles.toastContent}>
          <span style={styles.toastMessage}>{toast.message}</span>
          <button 
            style={styles.toastClose}
            onClick={() => setToast({ show: false, message: "", type: "" })}
            onMouseOver={(e) => e.target.style.opacity = 1}
            onMouseOut={(e) => e.target.style.opacity = 0.8}
          >
            ✕
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .register-card {
            padding: 30px 20px !important;
          }
          h2 {
            font-size: 1.75rem !important;
          }
          div[style*="toast"] {
            min-width: 250px !important;
            right: 10px !important;
            left: 10px !important;
            top: 10px !important;
            width: auto !important;
          }
        }
        
        @media (max-width: 480px) {
          .register-card {
            padding: 25px 15px !important;
            max-width: 90% !important;
          }
          h2 {
            font-size: 1.5rem !important;
          }
          input {
            padding: 10px 14px !important;
            font-size: 0.95rem !important;
          }
          button {
            padding: 12px !important;
            font-size: 0.95rem !important;
          }
        }

        .register-card:hover {
          box-shadow: 0 15px 40px rgba(0,0,0,0.12);
        }

        input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
          background-color: #ffffff;
          outline: none;
        }

        button:hover:not(:disabled) {
          background-color: #059669;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(16,185,129,0.3);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        .next-link:hover {
          text-decoration: underline;
        }
        
        .next-link {
          color: #10b981;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        
        .next-link:hover {
          color: #059669;
          text-decoration: underline;
        }

        .toast-close:hover {
          color: #64748b;
        }
      `}</style>

      <div style={styles.mainContent}>
        <div className="register-card" style={styles.registerCard}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Sign up to get started</p>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            onClick={register}
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <div style={styles.footer}>
            Already have an account?
            <Link 
              href="/login" 
              className="next-link"
              style={styles.link}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}