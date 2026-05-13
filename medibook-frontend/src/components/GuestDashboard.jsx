import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginPromptModal from './LoginPromptModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const GuestDashboard = () => {
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterSpec, setFilterSpec] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalRedirect, setModalRedirect] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE}/providers`);
      const data = Array.isArray(response.data) ? response.data : [];
      setProviders(data);
      setFilteredProviders(data);
    } catch (err) {
      console.error('Guest dashboard load error:', err);
      setError('Unable to load providers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) { setFilteredProviders(providers); return; }
    try {
      const response = await axios.get(`${API_BASE}/providers/search?keyword=${encodeURIComponent(searchKeyword)}`);
      setFilteredProviders(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFilteredProviders([]);
    }
  };

  const handleSpecFilter = async (spec) => {
    setFilterSpec(spec);
    if (!spec) { setFilteredProviders(providers); return; }
    try {
      const response = await axios.get(`${API_BASE}/providers/specialization/${encodeURIComponent(spec)}`);
      setFilteredProviders(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFilteredProviders([]);
    }
  };

  const handleGuestAction = (providerId, actionMsg) => {
    setModalMessage(actionMsg || 'Please sign in to book an appointment.');
    setModalRedirect(providerId ? `/book/${providerId}` : '/dashboard');
    setShowModal(true);
  };

  const getProviderName = (provider) =>
    provider.fullName ? `Dr. ${provider.fullName}` : `Dr. (Provider #${provider.providerId})`;

  const specializations = [...new Set(providers.map(p => p.specialization).filter(Boolean))];

  if (loading) return (
    <div className="page-content">
      <div className="loading-container"><div className="spinner"></div></div>
    </div>
  );

  return (
    <div className="page-content">
      {showModal && (
        <LoginPromptModal
          onClose={() => setShowModal(false)}
          redirectPath={modalRedirect}
          message={modalMessage}
        />
      )}

      {/* Hero Banner */}
      <div style={styles.heroBanner}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Find Your Perfect Doctor</h1>
          <p style={styles.heroSubtitle}>
            Browse {providers.length}+ verified healthcare providers.
            Sign in to book appointments, view medical records and more.
          </p>
          <div style={styles.heroBtns}>
            <button style={styles.heroSignIn} onClick={() => navigate('/login')}>Sign In to Book</button>
            <button style={styles.heroRegister} onClick={() => navigate('/register')}>Create Free Account</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ margin: '24px 0' }}>
        <div className="stat-card">
          <div className="stat-number">{providers.length}</div>
          <p className="stat-label">Healthcare Providers</p>
        </div>
        <div className="stat-card">
          <div className="stat-number">{specializations.length}</div>
          <p className="stat-label">Specializations</p>
        </div>
        <div className="stat-card">
          <div className="stat-number">{providers.filter(p => p.isVerified).length}</div>
          <p className="stat-label">Verified Doctors</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <span>⚠️ {error}</span>
          <button onClick={fetchProviders} style={styles.retryBtn}>Retry</button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="search-filter-container">
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0066cc' }}>🔍 Find a Healthcare Provider</h3>
        <div className="search-box">
          <input
            className="search-input"
            placeholder="Search by name, clinic, or specialization..."
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-btn" onClick={handleSearch}>Search</button>
          <button className="search-btn" style={{ backgroundColor: '#666' }}
            onClick={() => { setSearchKeyword(''); setFilteredProviders(providers); setFilterSpec(''); }}>
            Clear
          </button>
        </div>
        {specializations.length > 0 && (
          <div className="filter-tags">
            <button className={`filter-tag ${filterSpec === '' ? 'active' : ''}`} onClick={() => handleSpecFilter('')}>
              All Specialists
            </button>
            {specializations.map(spec => (
              <button key={spec} className={`filter-tag ${filterSpec === spec ? 'active' : ''}`}
                onClick={() => handleSpecFilter(spec)}>
                {spec}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guest notice */}
      <div style={styles.guestNotice}>
        <span>👤</span>
        <span>
          You are browsing as a <strong>Guest</strong>.{' '}
          <button
              style={styles.signInLink}
              onClick={() => navigate('/login')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/login')}
            >Sign in</button>{' '}
          to book appointments and access full features.
        </span>
      </div>

      {/* Provider Grid */}
      <div style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '20px' }}>
          {filteredProviders.length === 1 ? 'Healthcare Provider' : 'Healthcare Providers'} Available
        </h2>

        {filteredProviders.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">👨‍⚕️</div>
            <div className="empty-title">No providers found</div>
            <p className="empty-text">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="provider-grid">
            {filteredProviders.map(provider => (
              <div key={provider.providerId} className="provider-card">

                {/* ── Avatar banner: photo if available, else gradient + initial ── */}
                <div className="provider-avatar" style={{ position: 'relative', overflow: 'hidden' }}>
                  {provider.profilePhotoUrl ? (
                    <img
                      src={provider.profilePhotoUrl}
                      alt={`Dr. ${provider.fullName}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback initial */}
                  <span style={{
                    display: provider.profilePhotoUrl ? 'none' : 'flex',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    fontWeight: 600,
                    color: 'white',
                    position: 'absolute',
                    top: 0, left: 0,
                  }}>
                    {provider.fullName?.charAt(0) || 'D'}
                  </span>
                </div>

                <div className="provider-info">
                  <h4 className="provider-name">{getProviderName(provider)}</h4>
                  <p className="provider-spec">{provider.specialization}</p>

                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
                    {provider.isVerified && <span style={{ color: '#00c853', fontWeight: '600' }}>✓ Verified Provider</span>}
                  </div>

                  <div className="provider-details">
                    <div>🎓 {provider.qualification}</div>
                    <div>💼 {provider.experienceYears} years experience</div>
                    <div>🏥 {provider.clinicName}</div>
                    {provider.clinicAddress && <div>📍 {provider.clinicAddress.substring(0, 40)}...</div>}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#999', margin: '12px 0 0', lineHeight: '1.5', minHeight: '40px' }}>
                    {provider.bio
                      ? (provider.bio.length > 80 ? provider.bio.slice(0, 80) + '...' : provider.bio)
                      : ''}
                  </p>

                  <div className="provider-rating">
                    <span className="stars">★★★★★</span>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      {provider.avgRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>

                  <button
                    className="provider-action"
                    onClick={() => provider.isAvailable
                      ? handleGuestAction(provider.providerId, `Please sign in to book an appointment with ${getProviderName(provider)}.`)
                      : null
                    }
                    disabled={!provider.isAvailable}
                    style={{ opacity: provider.isAvailable ? 1 : 0.5 }}
                  >
                    {provider.isAvailable ? '🔒 Book Appointment' : 'Not Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  heroBanner: { background: 'linear-gradient(135deg, #0066cc 0%, #004999 100%)', borderRadius: '16px', padding: '2.5rem 2rem', marginBottom: '8px', color: '#fff' },
  heroContent: { maxWidth: '600px' },
  heroTitle: { fontSize: '2rem', fontWeight: 700, margin: '0 0 0.75rem', color:'#ffffff'},
  heroSubtitle: { fontSize: '1rem', color: '#ffffff', margin: '0 0 1.5rem', lineHeight: 1.6 },
  heroBtns: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  heroSignIn: { background: '#fff', color: '#0066cc', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' },
  heroRegister: { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '8px', padding: '0.65rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
  guestNotice: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#795548', marginTop: '16px' },
  signInLink: { color: '#0066cc', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', padding: 0, font: 'inherit' },
  errorBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffeaea', border: '1px solid #ffb3b3', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '16px', color: '#c62828', fontSize: '0.9rem' },
  retryBtn: { background: '#c62828', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.85rem' },
};

export default GuestDashboard;