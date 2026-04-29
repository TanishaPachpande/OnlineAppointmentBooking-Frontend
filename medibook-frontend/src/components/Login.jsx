import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import providerService from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      localStorage.clear();
      const response = await authService.login({ email, password });

      if (response.role === 'PROVIDER') {
        try {
          await providerService.getProviderByUserId(response.userId);
          navigate('/manage-slots');
        } catch {
          navigate('/provider-setup');
        }
      } else if (response.role === 'PATIENT') {
        navigate('/dashboard');
      } else if (response.role === 'ADMIN') {
        navigate('/admin');
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid Email or Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <div className="form-container">
        <div className="form-header">
          <h2>Welcome Back</h2>
          <p>Sign in to access your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="form-link">
            Don't have an account?{' '}
            <Link to="/register">Create one now</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;