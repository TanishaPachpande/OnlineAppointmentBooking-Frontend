import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import providerService from '../services/api';
import appointmentService from '../services/appointmentService';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [providers, setProviders] = useState([]);
    const [filteredProviders, setFilteredProviders] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterSpec, setFilterSpec] = useState('');
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') { navigate('/login'); return; }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [providerData, appointmentData] = await Promise.all([
                providerService.getAllProviders(),
                appointmentService.getUpcomingByPatient(user.userId)
            ]);
            setProviders(providerData);
            setFilteredProviders(providerData);
            setUpcomingAppointments(appointmentData);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchKeyword.trim()) { setFilteredProviders(providers); return; }
        try {
            const results = await providerService.searchProviders(searchKeyword);
            setFilteredProviders(results);
        } catch {
            setMessage({ type: 'error', text: 'Search failed' });
        }
    };

    const handleSpecFilter = async (spec) => {
        setFilterSpec(spec);
        if (!spec) { setFilteredProviders(providers); return; }
        try {
            const results = await providerService.getProvidersBySpecialization(spec);
            setFilteredProviders(results);
        } catch {
            setFilteredProviders([]);
        }
    };

    const getProviderName = (provider) =>
        provider.fullName ? `Dr. ${provider.fullName}` : `Dr. (Provider #${provider.providerId})`;

    const getAppointmentProviderName = (apt) => {
        const match = providers.find(p => p.providerId === apt.providerId);
        return match?.fullName ? `Dr. ${match.fullName}` : `Provider #${apt.providerId}`;
    };

    const specializations = [...new Set(providers.map(p => p.specialization))];

    if (loading) return (
        <div className="page-content">
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        </div>
    );

    return (
        <div className="page-content">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Welcome back, {user?.fullName || 'Patient'} 👋</h1>
                <p className="dashboard-subtitle">Book appointments and manage your healthcare</p>
            </div>

            {message && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
                     className={message.type === 'error' ? 'error-message' : 'success-message'}>
                    {message.text}
                    <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
            )}

            {/* Stats */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-number">{upcomingAppointments.length}</div>
                    <p className="stat-label">Upcoming Appointments</p>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{providers.length}</div>
                    <p className="stat-label">Healthcare Providers</p>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{specializations.length}</div>
                    <p className="stat-label">Specializations</p>
                </div>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
                <div className="card" style={{ marginBottom: '32px' }}>
                    <h3 className="card-title">📅 Upcoming Appointments</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {upcomingAppointments.slice(0, 3).map(apt => {
                            const statusClass = `appointment-status ${apt.status?.toLowerCase()}`;
                            return (
                                <div key={apt.appointmentId} style={{
                                    padding: '16px',
                                    backgroundColor: '#f9fafb',
                                    borderLeft: '4px solid #0066cc',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <strong style={{ color: '#0066cc', fontSize: '1rem' }}>{getAppointmentProviderName(apt)}</strong>
                                            <div style={{ color: '#666', marginTop: '6px', fontSize: '0.9rem' }}>
                                                📅 {apt.appointmentDate} at {apt.startTime?.slice(0, 5)}
                                            </div>
                                            <div style={{ color: '#999', marginTop: '4px', fontSize: '0.85rem' }}>
                                                {apt.modeOfConsultation?.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <span className={statusClass}>{apt.status}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => navigate('/appointments')}
                        className="btn btn-outline" style={{ marginTop: '12px', width: '100%' }}>
                        View All Appointments →
                    </button>
                </div>
            )}

            {/* Search & Filter */}
            <div className="search-filter-container">
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0066cc' }}>🔍 Find a Healthcare Provider</h3>
                <div className="search-box">
                    <input className="search-input"
                        placeholder="Search by name, clinic, or specialization..."
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                    <button className="search-btn" onClick={handleSearch}>Search</button>
                    <button className="search-btn" style={{ backgroundColor: '#666' }}
                        onClick={() => { setSearchKeyword(''); setFilteredProviders(providers); setFilterSpec(''); }}>
                        Clear
                    </button>
                </div>
                <div className="filter-tags">
                    <button className={`filter-tag ${!filterSpec ? 'active' : ''}`} onClick={() => handleSpecFilter('')}>All Specialists</button>
                    {specializations.map(spec => (
                        <button key={spec} className={`filter-tag ${filterSpec === spec ? 'active' : ''}`} onClick={() => handleSpecFilter(spec)}>
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Doctors Grid */}
            <div style={{ marginTop: '32px' }}>
                <h2 style={{ marginBottom: '20px' }}>
                    {filteredProviders.length} Healthcare Provider{filteredProviders.length !== 1 ? 's' : ''} Available
                </h2>

                {filteredProviders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👨‍⚕️</div>
                        <div className="empty-title">No providers found</div>
                        <p className="empty-text">Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    <div className="provider-grid">
                        {filteredProviders.map(provider => (
                            <div key={provider.providerId} className="provider-card">
                                <div className="provider-avatar">
                                    {provider.fullName?.charAt(0) || 'D'}
                                </div>
                                <div className="provider-info">
                                    <h4 className="provider-name">
                                        {getProviderName(provider)}
                                    </h4>
                                    <p className="provider-spec">{provider.specialization}</p>
                                    
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
                                        {provider.isVerified && <span style={{ color: '#00c853', fontWeight: '600' }}>✓ Verified Provider</span>}
                                    </div>

                                    <div className="provider-details">
                                        <div>🎓 {provider.qualification}</div>
                                        <div>💼 {provider.experienceYears} years experience</div>
                                        <div>🏥 {provider.clinicName}</div>
                                        <div>📍 {provider.clinicAddress?.substring(0, 40)}...</div>
                                    </div>

                                    {provider.bio && (
                                        <p style={{ fontSize: '0.85rem', color: '#999', margin: '12px 0 0', lineHeight: '1.5' }}>
                                            {provider.bio.length > 80 ? provider.bio.slice(0, 80) + '...' : provider.bio}
                                        </p>
                                    )}

                                    <div className="provider-rating">
                                        <span className="stars">★★★★★</span>
                                        <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                            {provider.avgRating?.toFixed(1) || '0.0'}
                                        </span>
                                    </div>

                                    <button
                                        className="provider-action"
                                        onClick={() => provider.isAvailable && navigate(`/book/${provider.providerId}`)}
                                        disabled={!provider.isAvailable}
                                        style={{ opacity: provider.isAvailable ? 1 : 0.5 }}
                                    >
                                        {provider.isAvailable ? 'Book Appointment' : 'Not Available'}
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

export default PatientDashboard;