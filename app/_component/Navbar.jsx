import Link from 'next/link'

export default function Navbar() {
  return (
    <>
      <style>{`
        .navbar {
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
        }
        .logo a {
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 700;
          text-decoration: none;
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nav-links {
          display: flex;
          gap: 32px;
          align-items: center;
        }
        .nav-links a {
          color: #475569;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
          position: relative;
          padding: 4px 0;
        }
        .nav-links a:hover {
          color: #3b82f6;
        }
        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #3b82f6;
          transition: width 0.2s;
        }
        .nav-links a:hover::after {
          width: 100%;
        }
        @media (max-width: 640px) {
          .nav-container {
            flex-direction: column;
            height: auto;
            padding: 16px 0;
            gap: 12px;
          }
          .nav-links {
            gap: 24px;
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <Link href="/">PDFCraft</Link>
          </div>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/login">Login</Link>
            <Link href="/signup">Register</Link>
          </div>
        </div>
      </nav>
    </>
  )
}