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

    // ✅ Shows real name if available, fallback to ID
    const getProviderName = (provider) =>
        provider.fullName ? `Dr. ${provider.fullName}` : `Dr. (Provider #${provider.providerId})`;

    // ✅ Match appointment's providerId to provider list for name
    const getAppointmentProviderName = (apt) => {
        const match = providers.find(p => p.providerId === apt.providerId);
        return match?.fullName ? `Dr. ${match.fullName}` : `Provider #${apt.providerId}`;
    };

    const specializations = [...new Set(providers.map(p => p.specialization))];

    const statusColor = (status) => {
        if (status === 'SCHEDULED') return { bg: '#d4edda', color: '#155724' };
        if (status === 'COMPLETED') return { bg: '#cce5ff', color: '#004085' };
        if (status === 'CANCELLED') return { bg: '#f8d7da', color: '#721c24' };
        return { bg: '#fff3cd', color: '#856404' };
    };

    const s = {
        page: { padding: '30px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
        card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        sectionTitle: { color: '#2c3e50', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', marginTop: 0 },
        providerCard: {
            background: 'white', borderRadius: '10px', padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '8px'
        },
        bookBtn: {
            padding: '8px 16px', backgroundColor: '#2c3e50', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginTop: '8px'
        },
        input: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
        searchBtn: { padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
        filterBtn: (active) => ({
            padding: '6px 14px', borderRadius: '20px', border: '1px solid #2c3e50',
            cursor: 'pointer', fontSize: '13px', fontWeight: '500',
            backgroundColor: active ? '#2c3e50' : 'white', color: active ? 'white' : '#2c3e50'
        }),
        statCard: (color) => ({
            background: color, borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px'
        })
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px', color: '#2c3e50' }}>Loading...</div>;

    return (
        <div style={s.page}>
            <h2 style={{ color: '#2c3e50', marginBottom: '6px' }}>Welcome, {user?.fullName || 'Patient'} 👋</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '24px' }}>Book appointments and manage your health</p>

            {message && (
                <div style={{
                    padding: '12px', borderRadius: '6px', marginBottom: '20px',
                    backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    {message.text}
                    <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                <div style={s.statCard('#eaf4fb')}>
                    <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#2980b9' }}>{upcomingAppointments.length}</span>
                    <span style={{ color: '#555', fontSize: '14px' }}>Upcoming Appointments</span>
                </div>
                <div style={s.statCard('#eafaf1')}>
                    <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>{providers.length}</span>
                    <span style={{ color: '#555', fontSize: '14px' }}>Available Doctors</span>
                </div>
                <div style={s.statCard('#fef9e7')}>
                    <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#f39c12' }}>{specializations.length}</span>
                    <span style={{ color: '#555', fontSize: '14px' }}>Specializations</span>
                </div>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
                <div style={{ ...s.card, marginBottom: '28px' }}>
                    <h3 style={s.sectionTitle}>📅 Upcoming Appointments</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {upcomingAppointments.slice(0, 3).map(apt => {
                            const sc = statusColor(apt.status);
                            return (
                                <div key={apt.appointmentId} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f8f9fa',
                                    borderLeft: '4px solid #2c3e50'
                                }}>
                                    <div>
                                        <strong style={{ color: '#2c3e50' }}>{getAppointmentProviderName(apt)}</strong>
                                        <span style={{ color: '#7f8c8d', marginLeft: '12px', fontSize: '14px' }}>
                                            {apt.appointmentDate} at {apt.startTime?.slice(0, 5)}
                                        </span>
                                        <span style={{ marginLeft: '12px', fontSize: '13px', color: '#555' }}>
                                            {apt.modeOfConsultation?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                                        fontWeight: '600', backgroundColor: sc.bg, color: sc.color
                                    }}>{apt.status}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => navigate('/appointments')}
                        style={{ ...s.bookBtn, marginTop: '12px', backgroundColor: '#7f8c8d' }}>
                        View All Appointments →
                    </button>
                </div>
            )}

            {/* Search & Filter */}
            <div style={{ ...s.card, marginBottom: '24px' }}>
                <h3 style={s.sectionTitle}>🔍 Find a Doctor</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <input style={{ ...s.input, flex: 1, minWidth: '200px' }}
                        placeholder="Search by name, clinic, or specialization..."
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                    <button style={s.searchBtn} onClick={handleSearch}>Search</button>
                    <button style={{ ...s.searchBtn, backgroundColor: '#7f8c8d' }}
                        onClick={() => { setSearchKeyword(''); setFilteredProviders(providers); setFilterSpec(''); }}>
                        Clear
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button style={s.filterBtn(!filterSpec)} onClick={() => handleSpecFilter('')}>All</button>
                    {specializations.map(spec => (
                        <button key={spec} style={s.filterBtn(filterSpec === spec)} onClick={() => handleSpecFilter(spec)}>
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Doctors Grid */}
            <h3 style={{ color: '#2c3e50', marginBottom: '16px' }}>
                {filteredProviders.length} Doctor{filteredProviders.length !== 1 ? 's' : ''} Found
            </h3>
            {filteredProviders.length === 0 ? (
                <div style={{ ...s.card, textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                    No doctors found. Try a different search.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredProviders.map(provider => (
                        <div key={provider.providerId} style={s.providerCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    {/* ✅ Real doctor name shown here */}
                                    <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '16px' }}>
                                        {getProviderName(provider)}
                                    </h4>
                                    <span style={{
                                        display: 'inline-block', marginTop: '4px', padding: '2px 10px',
                                        backgroundColor: '#eaf0fb', color: '#2c3e50',
                                        borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                                    }}>{provider.specialization}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: '#f39c12', fontSize: '14px' }}>★ {provider.avgRating?.toFixed(1) || '0.0'}</span>
                                    {provider.isVerified && <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: '600' }}>✓ Verified</div>}
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
                                <div>🎓 {provider.qualification}</div>
                                <div>💼 {provider.experienceYears} years experience</div>
                                <div>🏥 {provider.clinicName}</div>
                                <div>📍 {provider.clinicAddress}</div>
                            </div>
                            {provider.bio && (
                                <p style={{ fontSize: '13px', color: '#7f8c8d', margin: 0, lineHeight: '1.5' }}>
                                    {provider.bio.length > 100 ? provider.bio.slice(0, 100) + '...' : provider.bio}
                                </p>
                            )}
                            <button
                                style={{
                                    ...s.bookBtn,
                                    backgroundColor: provider.isAvailable ? '#2c3e50' : '#bdc3c7',
                                    cursor: provider.isAvailable ? 'pointer' : 'not-allowed'
                                }}
                                onClick={() => provider.isAvailable && navigate(`/book/${provider.providerId}`)}
                                disabled={!provider.isAvailable}
                            >
                                {provider.isAvailable ? 'Book Appointment' : 'Not Available'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;