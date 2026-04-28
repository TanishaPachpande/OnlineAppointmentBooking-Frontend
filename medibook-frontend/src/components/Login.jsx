import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Container, Box } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import providerService from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      localStorage.clear();
      const response = await authService.login({ email, password });

      if (response.role === 'PROVIDER') {
        // ✅ Check if provider profile already exists
        try {
          await providerService.getProviderByUserId(response.userId);
          navigate('/manage-slots'); // ✅ Profile exists → go to dashboard
        } catch {
          navigate('/provider-setup'); // ✅ No profile → go to setup form
        }
      } else if (response.role === 'PATIENT') {
        navigate('/dashboard');
      } else if (response.role === 'ADMIN') {
        navigate('/admin');
      }

    } catch (error) {
      setError(error.response?.data?.message || "Invalid Email or Password.");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: '600' }}>
            Welcome Back
          </Typography>

          {error && (
            <Typography color="error" align="center" sx={{ mb: 2, fontSize: '14px' }}>
              {error}
            </Typography>
          )}

          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Email Address" margin="normal"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField fullWidth label="Password" type="password" margin="normal"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" fullWidth variant="contained" size="large"
              sx={{ mt: 3, mb: 2, backgroundColor: '#2c3e50' }}>
              Sign In
            </Button>
            <Typography align="center" fontSize="14px">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#3498db', textDecoration: 'none' }}>
                Register here
              </Link>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;