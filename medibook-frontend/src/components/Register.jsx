// REPLACE: src/components/Register.jsx
// Changes vs original:
//  - Full-screen split layout: left gradient panel (teal/green) + right scrollable form
//  - All logic (OTP send/verify, handleSubmit, handleGoogleLogin) is UNCHANGED

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

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", role: "PATIENT" });
  const [otp, setOtp]               = useState("");
  const [otpSent, setOtpSent]       = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Step 1: Send OTP — unchanged ──
  const handleSendOtp = async () => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email before requesting an OTP.");
      return;
    }
    setOtpLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/send-otp`, { email: form.email });
      setOtpSent(true);
      toast.success(`OTP sent to ${form.email}. Check your inbox.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally { setOtpLoading(false); }
  };

  // ── Step 2: Verify OTP — unchanged ──
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) { toast.error("Please enter the 6-digit OTP."); return; }
    setOtpLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, { email: form.email, otp });
      setOtpVerified(true);
      toast.success("OTP verified ✓ You can now complete your registration.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally { setOtpLoading(false); }
  };

  // ── Step 3: Register — unchanged ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) { toast.error("Please verify your email with an OTP first."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/register-with-otp`, { ...form, otp });
      const { token, userId, role, fullName } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("role", role);
      localStorage.setItem("fullName", fullName || form.fullName || "");
      toast.success("Account created successfully!");
      navigate(role === "PROVIDER" ? "/provider-setup" : "/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  // ── UI ──
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ────────────── LEFT PANEL ────────────── */}
      <div style={{
        flex: '0 0 42%',
        background: 'linear-gradient(145deg, #0a1628 0%, #007d52 55%, #00a86b 100%)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px', position: 'relative', overflow: 'hidden',
      }}>
        {[
          { top: '-80px', left: '-80px', size: '280px' },
          { bottom: '-60px', right: '-60px', size: '220px' },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: c.top, left: c.left, bottom: c.bottom, right: c.right,
            width: c.size, height: c.size, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }} />
        ))}

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '340px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '36px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>⚕️</div>

          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '14px', lineHeight: 1.2 }}>
            Join<br />MediBook Today
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '32px' }}>
            Start your journey to better healthcare management. Sign up in minutes.
          </p>

          {[
            { icon: '🔒', text: 'Secure & private health data' },
            { icon: '⚡', text: 'Instant appointment booking' },
            { icon: '💬', text: 'Real-time notifications' },
            { icon: '📊', text: 'Complete health dashboard' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', textAlign: 'left' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
              }}>{f.icon}</div>
              <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ────────────── RIGHT PANEL ────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '48px 64px',
        background: '#f7f9fc',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0a1628', marginBottom: '8px' }}>Create Account</h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#0a66c2', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" name="fullName"
                placeholder="Enter your full name" value={form.fullName}
                onChange={handleChange} required />
            </div>

            {/* Email + Send OTP */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input className="form-input" style={{ flex: 1 }} type="email" name="email"
                  placeholder="Enter your email" value={form.email}
                  onChange={handleChange} required disabled={otpVerified} />
                <button type="button" onClick={handleSendOtp}
                  disabled={otpLoading || otpVerified}
                  className="btn-otp"
                  style={{
                    background: otpVerified
                      ? '#dcfce7' : 'linear-gradient(135deg,#0a66c2,#0088ff)',
                    color: otpVerified ? '#15803d' : 'white',
                  }}>
                  {otpVerified ? '✓ Done' : otpLoading ? '…' : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
            </div>

            {/* OTP verify row */}
            {otpSent && !otpVerified && (
              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input className="form-input"
                    style={{ flex: 1, letterSpacing: "0.22em", textAlign: "center" }}
                    type="text" inputMode="numeric" maxLength={6}
                    placeholder="6-digit OTP"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                  <button type="button" onClick={handleVerifyOtp}
                    disabled={otpLoading}
                    className="btn-otp"
                    style={{ background: 'linear-gradient(135deg,#00a86b,#2ecc71)', color: 'white' }}>
                    {otpLoading ? '…' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password"
                placeholder="Create a strong password" value={form.password}
                onChange={handleChange} required />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" name="phone"
                placeholder="10-digit mobile number" value={form.phone}
                onChange={handleChange} required />
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label">I am a</label>
              <select className="form-input form-select" name="role"
                value={form.role} onChange={handleChange}>
                <option value="PATIENT">Patient</option>
                <option value="PROVIDER">Healthcare Provider</option>
              </select>
            </div>

            <button type="submit" disabled={loading || !otpSent} className="btn-auth-primary"
              style={{ opacity: (!otpSent) ? 0.6 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '20px 0' }}>
            <span>or continue with</span>
          </div>

          <button type="button" onClick={handleGoogleLogin} className="btn-auth-google">
            <GoogleIcon />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
