import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Navbar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
    window.location.reload();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#2c3e50' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          MediBook
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} to="/">Home</Button>

          {/* Patient links */}
          {user?.role === 'PATIENT' && (
            <>
              <Button color="inherit" component={Link} to="/notifications">🔔 Notifications</Button>
              <Button color="inherit" component={Link} to="/dashboard">Find Doctors</Button>
              <Button color="inherit" component={Link} to="/appointments">My Appointments</Button>
              <Button color="inherit" component={Link} to="/records">My Records</Button>
            </>
          )}

          {/* Provider links */}
          {user?.role === 'PROVIDER' && (
            <>
              <Button color="inherit" component={Link} to="/notifications">🔔 Notifications</Button>
              <Button color="inherit" component={Link} to="/manage-slots">My Schedule</Button>
              <Button color="inherit" component={Link} to="/provider-appointments">Appointments</Button>
              <Button color="inherit" component={Link} to="/provider-records">Medical Records</Button>
            </>
          )}

          {user ? (
            <Button variant="contained" color="error" onClick={handleLogout} sx={{ ml: 2 }}>
              Logout
            </Button>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button variant="contained" color="primary" component={Link} to="/register">Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;