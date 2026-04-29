import React from 'react';
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
    <nav className="navbar">
      <div className="navbar-toolbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="navbar-brand">
            <span>MediBook</span>
          </div>

          <div className="navbar-menu">
            {/* Patient links */}
            {user?.role === 'PATIENT' && (
              <>
                <Link to="/notifications" className="navbar-button">🔔 Alerts</Link>
                <Link to="/dashboard" className="navbar-button">Find Doctors</Link>
                <Link to="/appointments" className="navbar-button">My Appointments</Link>
                <Link to="/records" className="navbar-button">Medical Records</Link>
              </>
            )}

            {/* Provider links */}
            {user?.role === 'PROVIDER' && (
              <>
                <Link to="/notifications" className="navbar-button">🔔 Alerts</Link>
                <Link to="/manage-slots" className="navbar-button">Manage Schedule</Link>
                <Link to="/provider-appointments" className="navbar-button">Appointments</Link>
                <Link to="/provider-records" className="navbar-button">Records</Link>
              </>
            )}

            {user ? (
              <button className="navbar-button navbar-button-logout" onClick={handleLogout}>
                Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" className="navbar-button">Sign In</Link>
                <Link to="/register" className="navbar-button" style={{ background: 'rgba(255,255,255,0.2)' }}>Join</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;