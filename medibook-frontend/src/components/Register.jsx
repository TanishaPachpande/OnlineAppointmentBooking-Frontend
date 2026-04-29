import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

/**
 * REPLACES medibook-frontend/src/components/Register.jsx
 *
 * What changed vs the original:
 *  - Adds a "Send OTP" step before the final submit.
 *  - OTP input field appears after the user enters their email and clicks "Send OTP".
 *  - On submit, calls POST /auth/register-with-otp instead of /auth/register.
 *  - Falls back to /auth/register if you prefer the non-OTP path (just remove the otp field).
 *  - All existing field layout, CSS classes, and UI structure are preserved.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "PATIENT",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
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
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step 2: Verify OTP (optional inline check) ───────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }
    setOtpLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, { email: form.email, otp });
      setOtpVerified(true);
      toast.success("OTP verified ✓ You can now complete your registration.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step 3: Final registration ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      toast.error("Please verify your email with an OTP first.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/register-with-otp`, {
        ...form,
        otp,
      });
      const { token, userId, role } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("role", role);
      toast.success("Account created successfully!");
      navigate(role === "PROVIDER" ? "/provider-setup" : "/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth2 helpers ────────────────────────────────────────────────────────
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };
  

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', padding: '2rem' }}>
      <div className="auth-card glass-panel hover-lift" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', borderRadius: 'var(--radius-xl)' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="auth-title" style={{ fontSize: '2rem', color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Create Account</h1>
          <p className="auth-subtitle" style={{ color: 'var(--text-secondary)' }}>Join MediBook to manage your health</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email + Send OTP */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={otpVerified}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleSendOtp}
                disabled={otpLoading || otpVerified}
                style={{ whiteSpace: "nowrap" }}
              >
                {otpLoading ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
          </div>

          {/* OTP input – shown after OTP is sent */}
          {otpSent && !otpVerified && (
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="form-input"
                  style={{ flex: 1, letterSpacing: "0.2em", textAlign: "center" }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? "Verifying…" : "Verify"}
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              className="form-input"
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label">I am a</label>
            <select
              className="form-input form-select"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="PATIENT">Patient</option>
              <option value="PROVIDER">Healthcare Provider</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !otpSent}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {/* OAuth2 divider */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-outline btn-full"
            onClick={handleGoogleLogin}
          >
            {/* Google icon via SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: "0.4rem" }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google
          </button>

          
        </div>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
