// NEW FILE: src/components/Sidebar.jsx
// Create this file in your components folder.

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/browse');
    window.location.reload();
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const patientLinks = [
    { to: '/dashboard',    icon: '🏠', label: 'Find Doctors'     },
    { to: '/appointments', icon: '📅', label: 'My Appointments'  },
    { to: '/records',      icon: '📋', label: 'Medical Records'  },
    { to: '/notifications',icon: '🔔', label: 'Alerts'           },
  ];

  const providerLinks = [
    { to: '/manage-slots',          icon: '🗓️', label: 'Manage Schedule' },
    { to: '/provider-appointments', icon: '📅', label: 'Appointments'    },
    { to: '/provider-records',      icon: '📋', label: 'Records'         },
    { to: '/notifications',         icon: '🔔', label: 'Alerts'          },
  ];

  const adminLinks = [
    { to: '/admin', icon: '📊', label: 'Dashboard' },
  ];

  const links =
    user?.role === 'PATIENT'  ? patientLinks  :
    user?.role === 'PROVIDER' ? providerLinks :
    user?.role === 'ADMIN'    ? adminLinks    : [];

  const isActive = (path) => location.pathname === path;

  /* ─── styles ─── */
  const sidebarStyle = {
    width: collapsed ? '68px' : '240px',
    minWidth: collapsed ? '68px' : '240px',
    height: '100vh',
    position: 'sticky',
    top: 0,
    background: 'linear-gradient(180deg,#0a1628 0%,#0f2044 100%)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s ease, min-width 0.25s ease',
    overflow: 'hidden',
    zIndex: 200,
    boxShadow: '4px 0 20px rgba(0,0,0,0.18)',
    flexShrink: 0,
  };

  const toggleBtn = {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    borderRadius: '6px',
    width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0,
    fontSize: '18px',
    lineHeight: 1,
  };

  return (
    <>
      <aside style={sidebarStyle}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '16px 0' : '16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          minHeight: '64px',
          gap: '8px',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '32px', height: '32px',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0,
              }}>⚕️</div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                MediBook
              </span>
            </div>
          )}
          <button
            style={toggleBtn}
            onClick={() => setCollapsed(p => !p)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* ── Profile ── */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setProfileOpen(p => !p)}
            title={collapsed ? (user?.fullName || '') : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '12px',
              padding: collapsed ? '16px 0' : '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#0a84ff,#34aadc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.9rem',
              border: '2px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}>{initials}</div>

            {!collapsed && <>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.fullName || 'User'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', textTransform: 'capitalize' }}>
                  {user?.role?.toLowerCase() || 'patient'}
                </div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                {profileOpen ? '▲' : '▼'}
              </span>
            </>}
          </div>

          {/* Profile dropdown */}
          {profileOpen && !collapsed && (
            <div style={{
              position: 'absolute', left: '16px', right: '16px', top: '100%',
              background: '#1a2e50', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              zIndex: 300, overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: 'white', fontSize: '0.82rem', fontWeight: 600 }}>{user?.fullName}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{user?.role}</div>
              </div>
              <button onClick={handleLogout} style={{
                width: '100%', padding: '10px 14px',
                background: 'none', border: 'none',
                color: '#ff6b6b', cursor: 'pointer',
                textAlign: 'left', fontSize: '0.85rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                → Sign Out
              </button>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {!collapsed && (
            <div style={{
              padding: '4px 16px 8px',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '1.2px', textTransform: 'uppercase',
            }}>Navigation</div>
          )}

          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '12px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive(link.to) ? 'white' : 'rgba(255,255,255,0.58)',
                textDecoration: 'none',
                fontWeight: isActive(link.to) ? 600 : 400,
                fontSize: '0.9rem',
                margin: '2px 0',
                background: isActive(link.to)
                  ? 'linear-gradient(90deg,rgba(10,132,255,0.28),rgba(10,132,255,0.08))'
                  : 'transparent',
                borderLeft: isActive(link.to)
                  ? '3px solid #0a84ff'
                  : '3px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive(link.to))
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                if (!isActive(link.to))
                  e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        {/* ── Footer / Sign Out ── */}
        <div style={{
          padding: collapsed ? '14px 0' : '14px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.25)',
              color: '#ff6b6b',
              padding: collapsed ? '9px' : '9px 14px',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600,
              width: collapsed ? '40px' : '100%',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '1rem' }}>→</span>
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Click-outside overlay to close profile dropdown */}
      {profileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => setProfileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
