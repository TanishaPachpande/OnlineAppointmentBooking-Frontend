// REPLACE: src/components/Login.jsx
// Changes vs original:
//  - Full-screen split layout: left gradient panel (welcome) + right form panel
//  - All logic (handleSubmit, handleGoogleLogin, guest redirect) is UNCHANGED

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── unchanged logic ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, form);
      const { token, userId, role, fullName } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("role", role);
      localStorage.setItem("fullName", fullName || "");
      toast.success("Login successful!");

      const savedPath = sessionStorage.getItem("guestRedirectPath");
      if (savedPath) {
        sessionStorage.removeItem("guestRedirectPath");
        navigate(savedPath);
        return;
      }
      if (role === "ADMIN") {
        navigate("/admin");
      } else if (role === "PROVIDER") {
        // Check provider profile status before deciding where to land
        try {
          const provRes = await axios.get(`${API_BASE}/providers/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const status = provRes.data?.verificationStatus;
          if (status === "APPROVED") {
            navigate("/manage-slots");   // fully verified → provider dashboard
          } else {
            navigate("/provider-setup"); // PENDING / REJECTED → show status screen
          }
        } catch {
          navigate("/provider-setup");   // no profile yet → show registration form
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `http://localhost:8082/oauth2/authorization/google`;
  };

  // ── UI ──
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ────────────── LEFT PANEL ────────────── */}
      <div style={{
        flex: '0 0 45%',
        background: 'linear-gradient(145deg, #0a1628 0%, #0a66c2 55%, #0088ff 100%)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px', position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        {[
          { top: '-80px', left: '-80px', size: '300px' },
          { bottom: '-60px', right: '-60px', size: '240px' },
          { top: '42%', right: '-50px', size: '180px' },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: c.top, left: c.left, bottom: c.bottom, right: c.right,
            width: c.size, height: c.size, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }} />
        ))}

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '360px' }}>
          {/* logo badge */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '36px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>⚕️</div>

          <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, marginBottom: '14px', lineHeight: 1.2 }}>
            Welcome to<br />MediBook
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.97rem', lineHeight: 1.75, marginBottom: '36px' }}>
            Your trusted platform for seamless healthcare appointments. Connect with top doctors — anytime, anywhere.
          </p>

          {/* feature bullets */}
          {[
            { icon: '📅', text: 'Book appointments instantly' },
            { icon: '👨‍⚕️', text: 'Verified healthcare providers' },
            { icon: '📋', text: 'Manage your medical records' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', flexShrink: 0,
              }}>{f.icon}</div>
              <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.9rem' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ────────────── RIGHT PANEL ────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 64px',
        background: '#f7f9fc',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0a1628', marginBottom: '8px' }}>Sign In</h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#0a66c2', fontWeight: 700, textDecoration: 'none' }}>
                Create one free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email" name="email"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password" name="password"
                placeholder="Enter your password"
                value={form.password} onChange={handleChange} required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-auth-primary">
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '22px 0' }}>
            <span>or continue with</span>
          </div>

          <button type="button" onClick={handleGoogleLogin} className="btn-auth-google">
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#94a3b8' }}>
            Just browsing?{' '}
            <Link to="/browse" style={{ color: '#0a66c2', fontWeight: 600, textDecoration: 'none' }}>
              Continue as Guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
