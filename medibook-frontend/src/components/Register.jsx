import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'PATIENT' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authService.register(formData);
      alert("Registration successful! Please login.");
      navigate('/login');
    } catch (err) {
      // Catching the error from your Auth-Service
      setError(err.response?.data?.message || "Registration failed. Check your details.");
    }
  };

  // Inline Styles Objects
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f4f7f6',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    },
    card: {
      background: '#ffffff',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      width: '100%',
      maxSize: '450px',
      maxWidth: '450px'
    },
    title: {
      textAlign: 'center',
      color: '#2c3e50',
      marginBottom: '30px',
      fontSize: '28px',
      fontWeight: 'bold'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#34495e'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #dcdfe6',
      borderRadius: '6px',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '14px',
      backgroundColor: '#2c3e50',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'background 0.3s'
    },
    errorBanner: {
      backgroundColor: '#fde2e2',
      color: '#f56c6c',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '20px',
      textAlign: 'center',
      fontSize: '14px'
    },
    linkText: {
      textAlign: 'center',
      marginTop: '20px',
      fontSize: '14px',
      color: '#606266'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Join MediBook</h2>
        
        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              name="fullName"
              type="text"
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              name="email"
              type="email"
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              name="password"
              type="password"
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              style={styles.input}
              name="phone"
              type="text"
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Register as a...</label>
            <select 
              style={styles.input} 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              required
            >
              <option value="PATIENT">Patient</option>
              <option value="PROVIDER">Provider (Doctor)</option>
            </select>
          </div>

          <button 
            type="submit" 
            style={styles.button}
            onMouseOver={(e) => e.target.style.backgroundColor = '#34495e'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2c3e50'}
          >
            Create Account
          </button>
          
          <div style={styles.linkText}>
            Already have an account? <Link to="/login" style={{ color: '#3498db', textDecoration: 'none' }}>Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;