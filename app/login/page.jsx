"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "../_component/Navbar"
import axios from "axios"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 3000)
  }

  const login = async () => {
    // Validation
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        email,
        password
      })

      // Store token in localStorage (if your API returns a token)
      if (response.data.token) {
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
      }

      showToast("Login successful", "success")
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
      
    } catch (err) {
      showToast(err.response?.data?.message || "Login failed. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      login()
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
    loginCard: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      padding: "40px",
      width: "100%",
      maxWidth: "450px",
      transition: "all 0.3s ease",
      marginTop: "10px"
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
      backgroundColor: "#3b82f6",
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
      color: "#3b82f6",
      textDecoration: "none",
      fontWeight: "500",
      cursor: "pointer",
      marginLeft: "5px",
    },
  // Update the toast style in Signup component
toast: {
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
          .login-card {
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
          .login-card {
            padding: 25px 15px !important;
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

        .login-card:hover {
          box-shadow: 0 15px 40px rgba(0,0,0,0.12);
        }

        input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          background-color: #ffffff;
          outline: none;
        }

        button:hover:not(:disabled) {
          background-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(59,130,246,0.3);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        .next-link:hover {
          text-decoration: underline;
        }
        
        .next-link {
          color: #3b82f6;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        
        .next-link:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        .toast-close:hover {
          color: #64748b;
        }
      `}</style>

      <div style={styles.mainContent}>
        <div className="login-card" style={styles.loginCard}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Please login to your account</p>

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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            onClick={login}
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div style={styles.footer}>
            Don't have an account?
            <Link 
              href="/signup" 
              className="next-link"
              style={styles.link}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}