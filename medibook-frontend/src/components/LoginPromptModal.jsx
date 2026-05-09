import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * LoginPromptModal
 * Shows whenever a guest tries to perform an action that requires authentication.
 * Pass `onClose` to dismiss, and optionally `redirectPath` so the user lands
 * back on the right page after logging in.
 */
const LoginPromptModal = ({ onClose, redirectPath = '', message = '' }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    if (redirectPath) {
      sessionStorage.setItem('guestRedirectPath', redirectPath);
    }
    navigate('/login');
    if (onClose) onClose();
  };

  const handleRegister = () => {
    navigate('/register');
    if (onClose) onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {/* Icon */}
        <div style={styles.iconWrap}>
          <span style={styles.lockIcon}>🔐</span>
        </div>

        <h2 style={styles.title}>Sign In Required</h2>

        <p style={styles.subtitle}>
          {message || 'You need to be logged in to perform this action. Please sign in or create an account to continue.'}
        </p>

        <div style={styles.btnGroup}>
          <button style={styles.primaryBtn} onClick={handleLogin}>
            Sign In
          </button>
          <button style={styles.secondaryBtn} onClick={handleRegister}>
            Create Account
          </button>
        </div>

        <p style={styles.continueText}>
          or{' '}
          <span style={styles.continueLink} onClick={onClose}>
            continue browsing as guest
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(3px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    position: 'relative',
    animation: 'fadeInScale 0.2s ease',
  },
  closeBtn: {
    position: 'absolute',
    top: '14px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#999',
    lineHeight: 1,
  },
  iconWrap: {
    marginBottom: '1rem',
  },
  lockIcon: {
    fontSize: '3rem',
  },
  title: {
    color: '#0066cc',
    fontSize: '1.5rem',
    margin: '0 0 0.75rem',
    fontWeight: 700,
  },
  subtitle: {
    color: '#555',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    margin: '0 0 1.75rem',
  },
  btnGroup: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #0066cc, #0052a3)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.65rem 1.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  secondaryBtn: {
    background: '#fff',
    color: '#0066cc',
    border: '2px solid #0066cc',
    borderRadius: '8px',
    padding: '0.65rem 1.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  continueText: {
    color: '#aaa',
    fontSize: '0.85rem',
    margin: 0,
  },
  continueLink: {
    color: '#0066cc',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default LoginPromptModal;
