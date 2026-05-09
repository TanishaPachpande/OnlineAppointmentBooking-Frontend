import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';

// ── ALL calls go through the API Gateway ──
// Gateway routes: /auth/** → auth-service, /providers/** → provider-service,
//                 /appointments/** → appointment-service, /payments/** → payment-service
const GATEWAY = 'http://localhost:8080';

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .ad-root * { box-sizing: border-box; }
  .ad-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f0f4f8;
    min-height: 100vh;
    padding: 32px 24px;
  }

  .ad-header {
    max-width: 1200px;
    margin: 0 auto 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ad-header h2 {
    margin: 0 0 4px;
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .ad-header p { margin: 0; font-size: 14px; color: #64748b; font-weight: 500; }

  .ad-stats {
    max-width: 1200px;
    margin: 0 auto 28px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .ad-stat {
    background: white;
    border-radius: 14px;
    padding: 22px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05);
    border-top: 3px solid transparent;
    transition: transform 0.15s;
  }
  .ad-stat:hover { transform: translateY(-2px); }
  .ad-stat-value { font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
  .ad-stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
  .ad-stat-total     { border-top-color: #6366f1; }
  .ad-stat-total .ad-stat-value     { color: #4338ca; }
  .ad-stat-patients  { border-top-color: #10b981; }
  .ad-stat-patients .ad-stat-value  { color: #065f46; }
  .ad-stat-providers { border-top-color: #3b82f6; }
  .ad-stat-providers .ad-stat-value { color: #1d4ed8; }
  .ad-stat-revenue   { border-top-color: #f59e0b; }
  .ad-stat-revenue .ad-stat-value   { color: #b45309; }

  .ad-tabs {
    max-width: 1200px;
    margin: 0 auto 20px;
    display: flex;
    gap: 8px;
    background: white;
    border-radius: 14px;
    padding: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .ad-tab {
    flex: 1;
    padding: 11px 16px;
    border: none;
    background: transparent;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    color: #64748b;
    transition: all 0.15s;
    font-family: inherit;
  }
  .ad-tab.active {
    background: #1e40af;
    color: white;
    box-shadow: 0 2px 8px rgba(30,64,175,0.3);
  }

  .ad-content { max-width: 1200px; margin: 0 auto; }

  .ad-card {
    background: white;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .ad-card-header {
    padding: 18px 24px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ad-card-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: #0f172a; }

  .ad-search {
    padding: 9px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    width: 240px;
    transition: border-color 0.15s;
  }
  .ad-search:focus { outline: none; border-color: #3b82f6; }

  .ad-table { width: 100%; border-collapse: collapse; }
  .ad-table th {
    padding: 12px 20px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #94a3b8;
    background: #f8fafc;
  }
  .ad-table td {
    padding: 14px 20px;
    border-top: 1px solid #f1f5f9;
    font-size: 14px;
    color: #1e293b;
  }
  .ad-table tr:hover td { background: #fafbfc; }

  .ad-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }
  .ad-badge-active    { background: #dcfce7; color: #15803d; }
  .ad-badge-inactive  { background: #fee2e2; color: #b91c1c; }
  .ad-badge-patient   { background: #d1fae5; color: #065f46; }
  .ad-badge-provider  { background: #dbeafe; color: #1e40af; }
  .ad-badge-admin     { background: #ede9fe; color: #6d28d9; }
  .ad-badge-success   { background: #dcfce7; color: #15803d; }
  .ad-badge-refunded  { background: #dbeafe; color: #1e40af; }
  .ad-badge-scheduled  { background: #d1fae5; color: #065f46; }
  .ad-badge-completed  { background: #e0e7ff; color: #4338ca; }
  .ad-badge-cancelled  { background: #fee2e2; color: #b91c1c; }
  .ad-badge-verified   { background: #dcfce7; color: #15803d; }
  .ad-badge-unverified { background: #fef9c3; color: #a16207; }
  .ad-badge-rejected   { background: #fee2e2; color: #b91c1c; }

  .ad-btn-activate {
    padding: 5px 14px;
    background: #dcfce7; color: #15803d;
    border: 1px solid #86efac; border-radius: 6px;
    cursor: pointer; font-size: 12px; font-weight: 700;
    font-family: inherit; margin-right: 6px; transition: background 0.15s;
  }
  .ad-btn-activate:hover { background: #bbf7d0; }
  .ad-btn-deactivate {
    padding: 5px 14px;
    background: #fee2e2; color: #b91c1c;
    border: 1px solid #fca5a5; border-radius: 6px;
    cursor: pointer; font-size: 12px; font-weight: 700;
    font-family: inherit; transition: background 0.15s;
  }
  .ad-btn-deactivate:hover { background: #fecaca; }
  .ad-btn-verify {
    padding: 5px 14px;
    background: #dbeafe; color: #1e40af;
    border: 1px solid #93c5fd; border-radius: 6px;
    cursor: pointer; font-size: 12px; font-weight: 700;
    font-family: inherit; transition: background 0.15s;
  }
  .ad-btn-verify:hover { background: #bfdbfe; }

  .ad-toast {
    max-width: 1200px;
    margin: 0 auto 16px;
    padding: 13px 18px;
    border-radius: 10px;
    font-size: 14px; font-weight: 600;
    display: flex; justify-content: space-between; align-items: center;
  }
  .ad-toast.success { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
  .ad-toast.error   { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }
  .ad-toast button  { background: none; border: none; cursor: pointer; font-size: 16px; }

  .ad-loading {
    display: flex; align-items: center; justify-content: center;
    height: 300px; gap: 12px; color: #64748b; font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ad-spinner {
    width: 24px; height: 24px;
    border: 3px solid #e2e8f0; border-top-color: #1e40af;
    border-radius: 50%; animation: ad-spin 0.8s linear infinite;
  }
  @keyframes ad-spin { to { transform: rotate(360deg); } }
  .ad-empty { padding: 60px; text-align: center; color: #94a3b8; font-size: 14px; font-weight: 500; }
`;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [activeTab, setActiveTab] = useState('overview');
    const [message, setMessage] = useState(null);
    const [search, setSearch] = useState('');

    const [users, setUsers] = useState([]);
    const [providers, setProviders] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [verificationQueue, setVerificationQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewNote, setReviewNote] = useState({});

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') { navigate('/login'); return; }
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        setMessage(null);
        try {
            // ── All calls routed through API Gateway (port 8080) ──
            // Gateway forwards: /auth/** → auth-service, /providers/** → provider-service,
            //                   /appointments/** → appointment-service, /payments/** → payment-service
            const [usersRes, providersRes, appointmentsRes, paymentsRes, pendingRes] = await Promise.allSettled([
                axios.get(`${GATEWAY}/auth/admin/users`,                    { headers: getHeaders() }),
                axios.get(`${GATEWAY}/providers`,                           { headers: getHeaders() }),
                axios.get(`${GATEWAY}/appointments`,                        { headers: getHeaders() }),
                axios.get(`${GATEWAY}/payments`,                            { headers: getHeaders() }),
                axios.get(`${GATEWAY}/providers/pending-verification`,      { headers: getHeaders() }),
            ]);

            if (usersRes.status        === 'fulfilled') setUsers(usersRes.value.data);
            else setMessage({ type: 'error', text: `Users failed: ${usersRes.reason?.response?.status} – check /auth/admin/users` });

            if (providersRes.status    === 'fulfilled') setProviders(providersRes.value.data);
            if (appointmentsRes.status === 'fulfilled') setAppointments(appointmentsRes.value.data || []);
            if (paymentsRes.status     === 'fulfilled') setPayments(paymentsRes.value.data || []);
            if (pendingRes.status      === 'fulfilled') setVerificationQueue(pendingRes.value.data || []);

        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load data. Check browser console for details.' });
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (userId) => {
        try {
            await axios.put(`${GATEWAY}/auth/admin/users/${userId}/activate`, {}, { headers: getHeaders() });
            setMessage({ type: 'success', text: 'User activated successfully.' });
            fetchAll();
        } catch (e) {
            setMessage({ type: 'error', text: `Failed to activate user. (${e?.response?.status})` });
        }
    };

    const handleDeactivate = async (userId) => {
        if (!window.confirm('Deactivate this user?')) return;
        try {
            await axios.put(`${GATEWAY}/auth/admin/users/${userId}/deactivate`, {}, { headers: getHeaders() });
            setMessage({ type: 'success', text: 'User deactivated successfully.' });
            fetchAll();
        } catch (e) {
            setMessage({ type: 'error', text: `Failed to deactivate user. (${e?.response?.status})` });
        }
    };

    // ── verify goes through gateway → provider-service; requires ?verified=true param ──
    const handleVerifyProvider = async (providerId) => {
        try {
            await axios.put(`${GATEWAY}/providers/${providerId}/verify?verified=true`, {}, { headers: getHeaders() });
            setMessage({ type: 'success', text: 'Provider verified successfully.' });
            fetchAll();
        } catch (e) {
            setMessage({ type: 'error', text: `Failed to verify provider. (${e?.response?.status})` });
        }
    };

    // ── New: approve or reject with optional note ─────────────────────────────
    const handleReviewProvider = async (providerId, approved) => {
        const note = reviewNote[providerId] || '';
        if (!approved && !note.trim()) {
            setMessage({ type: 'error', text: 'Please enter a rejection reason before rejecting.' });
            return;
        }
        try {
            await axios.put(
                `${GATEWAY}/providers/${providerId}/review`,
                { approved, note },
                { headers: getHeaders() }
            );
            setMessage({ type: 'success', text: `Provider ${approved ? 'approved ✓' : 'rejected ✗'} successfully.` });
            setReviewNote(prev => { const n = { ...prev }; delete n[providerId]; return n; });
            fetchAll();
        } catch (e) {
            setMessage({ type: 'error', text: `Review action failed. (${e?.response?.status})` });
        }
    };

    const totalUsers    = users.length;
    const totalPatients = users.filter(u => u.role === 'PATIENT').length;
    const totalProviders= users.filter(u => u.role === 'PROVIDER').length;
    const totalRevenue  = payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + (p.amount || 0), 0);

    const filteredUsers = users.filter(u =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredProviders = providers.filter(p =>
        p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        p.specialization?.toLowerCase().includes(search.toLowerCase())
    );

    const tabs = [
        { key: 'overview',     label: '📊 Overview'     },
        { key: 'verification', label: `🔍 Verify Providers${verificationQueue.length > 0 ? ` (${verificationQueue.length})` : ''}` },
        { key: 'users',        label: '👥 Users'         },
        { key: 'providers',    label: '🩺 Providers'     },
        { key: 'appointments', label: '📅 Appointments'  },
        { key: 'payments',     label: '💳 Payments'      },
    ];

    if (loading) return (
        <>
            <style>{styles}</style>
            <div className="ad-loading"><div className="ad-spinner" /><span>Loading admin dashboard...</span></div>
        </>
    );

    return (
        <>
            <style>{styles}</style>
            <div className="ad-root">

                {/* Header */}
                <div className="ad-header">
                    <div>
                        <h2>Admin Dashboard</h2>
                        <p>Welcome, {user?.fullName || 'Admin'} — full system overview</p>
                    </div>
                    <button onClick={fetchAll} style={{
                        padding: '10px 20px', background: '#1e40af', color: 'white',
                        border: 'none', borderRadius: '10px', fontWeight: 700,
                        fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
                    }}>⟳ Refresh</button>
                </div>

                {/* Toast */}
                {message && (
                    <div className={`ad-toast ${message.type}`}>
                        <span>{message.type === 'success' ? '✓ ' : '⚠ '}{message.text}</span>
                        <button onClick={() => setMessage(null)}>✕</button>
                    </div>
                )}

                {/* Stats */}
                <div className="ad-stats">
                    <div className="ad-stat ad-stat-total">
                        <div className="ad-stat-value">{totalUsers}</div>
                        <div className="ad-stat-label">Total Users</div>
                    </div>
                    <div className="ad-stat ad-stat-patients">
                        <div className="ad-stat-value">{totalPatients}</div>
                        <div className="ad-stat-label">Patients</div>
                    </div>
                    <div className="ad-stat ad-stat-providers">
                        <div className="ad-stat-value">{totalProviders}</div>
                        <div className="ad-stat-label">Providers</div>
                    </div>
                    <div className="ad-stat ad-stat-revenue">
                        <div className="ad-stat-value">₹{totalRevenue.toFixed(0)}</div>
                        <div className="ad-stat-label">Total Revenue</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="ad-tabs">
                    {tabs.map(t => (
                        <button key={t.key}
                            className={`ad-tab ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => { setActiveTab(t.key); setSearch(''); }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="ad-content">

                    {/* ── OVERVIEW ── */}
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                <div className="ad-card">
                                    <div className="ad-card-header"><h3>📅 Appointments Summary</h3></div>
                                    <div style={{ padding: '20px 24px' }}>
                                        {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(status => {
                                            const count = appointments.filter(a => a.status === status).length;
                                            const colors = { SCHEDULED: '#065f46', COMPLETED: '#4338ca', CANCELLED: '#b91c1c', NO_SHOW: '#a16207' };
                                            const bgs    = { SCHEDULED: '#dcfce7', COMPLETED: '#e0e7ff', CANCELLED: '#fee2e2', NO_SHOW: '#fef9c3' };
                                            return (
                                                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{status.replace('_', ' ')}</span>
                                                    <span style={{ background: bgs[status], color: colors[status], fontWeight: 800, fontSize: 14, padding: '2px 14px', borderRadius: 20 }}>{count}</span>
                                                </div>
                                            );
                                        })}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Total</span>
                                            <span style={{ fontWeight: 800, fontSize: 16, color: '#1e40af' }}>{appointments.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ad-card">
                                    <div className="ad-card-header"><h3>💳 Payment Summary</h3></div>
                                    <div style={{ padding: '20px 24px' }}>
                                        {['SUCCESS', 'REFUNDED', 'FAILED'].map(status => {
                                            const count = payments.filter(p => p.status === status).length;
                                            const amt   = payments.filter(p => p.status === status).reduce((s, p) => s + (p.amount || 0), 0);
                                            const colors = { SUCCESS: '#065f46', REFUNDED: '#1d4ed8', FAILED: '#b91c1c' };
                                            const bgs    = { SUCCESS: '#dcfce7', REFUNDED: '#dbeafe', FAILED: '#fee2e2' };
                                            return (
                                                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{status}</span>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                        <span style={{ fontSize: 13, color: '#64748b' }}>({count})</span>
                                                        <span style={{ background: bgs[status], color: colors[status], fontWeight: 800, fontSize: 13, padding: '2px 12px', borderRadius: 20 }}>₹{amt.toFixed(0)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Total Revenue</span>
                                            <span style={{ fontWeight: 800, fontSize: 16, color: '#b45309' }}>₹{totalRevenue.toFixed(0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ad-card">
                                <div className="ad-card-header"><h3>🩺 Provider Verification Status</h3></div>
                                <table className="ad-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th><th>Specialization</th><th>Clinic</th><th>Verification</th><th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {providers.length === 0 ? (
                                            <tr><td colSpan={5} className="ad-empty">No providers found</td></tr>
                                        ) : providers.map(p => (
                                            <tr key={p.providerId}>
                                                <td style={{ fontWeight: 600 }}>Dr. {p.fullName}</td>
                                                <td>{p.specialization}</td>
                                                <td>{p.clinicName}</td>
                                                <td>
                                                    <span className={`ad-badge ${p.isVerified ? 'ad-badge-verified' : 'ad-badge-unverified'}`}>
                                                        {p.isVerified ? '✓ Verified' : (p.verificationStatus === 'REJECTED' ? '✗ Rejected' : '⏳ Pending')}
                                                    </span>
                                                </td>
                                                <td>
                                                    {!p.isVerified && p.verificationStatus === 'PENDING'
                                                        ? <button className="ad-btn-verify" onClick={() => setActiveTab('verification')}>Review</button>
                                                        : <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* ── VERIFICATION QUEUE ── */}
                    {activeTab === 'verification' && (
                        <div className="ad-card">
                            <div className="ad-card-header">
                                <h3>🔍 Provider Verification Queue ({verificationQueue.length})</h3>
                                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                    Review submitted credential documents and approve or reject each provider.
                                </span>
                            </div>

                            {verificationQueue.length === 0 ? (
                                <div className="ad-empty">
                                    🎉 No pending verifications — all providers have been reviewed!
                                </div>
                            ) : verificationQueue.map(p => (
                                <div key={p.providerId} style={{
                                    borderBottom: '1px solid #f1f5f9', padding: '22px 24px',
                                    display: 'flex', gap: 24, flexWrap: 'wrap'
                                }}>
                                    {/* Left: Provider info */}
                                    <div style={{ flex: '1 1 300px' }}>
                                        <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
                                            Dr. {p.fullName}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#475569', marginBottom: 2 }}>
                                            🏥 <strong>{p.clinicName}</strong> · {p.clinicAddress}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#475569', marginBottom: 2 }}>
                                            🩺 {p.specialization} · {p.qualification}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                                            🕐 {p.experienceYears} years experience
                                        </div>

                                        {/* Document link */}
                                        {p.verificationDocumentUrl ? (
                                            <a
                                                href={p.verificationDocumentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '7px 14px', background: '#eff6ff',
                                                    color: '#1d4ed8', borderRadius: 8, fontSize: 13,
                                                    fontWeight: 600, textDecoration: 'none',
                                                    border: '1px solid #bfdbfe'
                                                }}>
                                                📄 View Credential Document
                                            </a>
                                        ) : (
                                            <span style={{
                                                display: 'inline-block', padding: '6px 12px',
                                                background: '#fef9c3', color: '#a16207',
                                                borderRadius: 8, fontSize: 12, fontWeight: 600
                                            }}>
                                                ⚠ No document uploaded
                                            </span>
                                        )}
                                    </div>

                                    {/* Right: Approve / Reject */}
                                    <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                                            Admin Note (required for rejection):
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="e.g. 'Document is blurry, please re-upload' or 'Credentials verified successfully'"
                                            value={reviewNote[p.providerId] || ''}
                                            onChange={e => setReviewNote(prev => ({
                                                ...prev, [p.providerId]: e.target.value
                                            }))}
                                            style={{
                                                padding: '8px 10px', borderRadius: 8, fontSize: 13,
                                                border: '1.5px solid #e2e8f0', resize: 'vertical',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button
                                                onClick={() => handleReviewProvider(p.providerId, true)}
                                                style={{
                                                    flex: 1, padding: '9px 0', background: '#dcfce7',
                                                    color: '#15803d', border: '1px solid #86efac',
                                                    borderRadius: 8, fontWeight: 700, fontSize: 13,
                                                    cursor: 'pointer', fontFamily: 'inherit'
                                                }}>
                                                ✅ Approve
                                            </button>
                                            <button
                                                onClick={() => handleReviewProvider(p.providerId, false)}
                                                style={{
                                                    flex: 1, padding: '9px 0', background: '#fee2e2',
                                                    color: '#b91c1c', border: '1px solid #fca5a5',
                                                    borderRadius: 8, fontWeight: 700, fontSize: 13,
                                                    cursor: 'pointer', fontFamily: 'inherit'
                                                }}>
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── USERS ── */}
                    {activeTab === 'users' && (
                        <div className="ad-card">
                            <div className="ad-card-header">
                                <h3>All Users ({filteredUsers.length})</h3>
                                <input className="ad-search" placeholder="Search by name or email..."
                                    value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <table className="ad-table">
                                <thead>
                                    <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan={6} className="ad-empty">No users found</td></tr>
                                    ) : filteredUsers.map(u => {
                                        const isActive = u.message === 'ACTIVE';
                                        const roleCls = u.role === 'PATIENT' ? 'ad-badge-patient' : u.role === 'PROVIDER' ? 'ad-badge-provider' : 'ad-badge-admin';
                                        return (
                                            <tr key={u.userId}>
                                                <td style={{ color: '#94a3b8', fontSize: 13 }}>#{u.userId}</td>
                                                <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                                                <td style={{ color: '#64748b' }}>{u.email}</td>
                                                <td><span className={`ad-badge ${roleCls}`}>{u.role}</span></td>
                                                <td>
                                                    <span className={`ad-badge ${isActive ? 'ad-badge-active' : 'ad-badge-inactive'}`}>
                                                        {isActive ? '● Active' : '● Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {u.role !== 'ADMIN' && (
                                                        isActive
                                                            ? <button className="ad-btn-deactivate" onClick={() => handleDeactivate(u.userId)}>Deactivate</button>
                                                            : <button className="ad-btn-activate"   onClick={() => handleActivate(u.userId)}>Activate</button>
                                                    )}
                                                    {u.role === 'ADMIN' && <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── PROVIDERS ── */}
                    {activeTab === 'providers' && (
                        <div className="ad-card">
                            <div className="ad-card-header">
                                <h3>All Providers ({filteredProviders.length})</h3>
                                <input className="ad-search" placeholder="Search by name or specialization..."
                                    value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <table className="ad-table">
                                <thead>
                                    <tr><th>ID</th><th>Name</th><th>Specialization</th><th>Clinic</th><th>Experience</th><th>Rating</th><th>Status</th><th>Document</th></tr>
                                </thead>
                                <tbody>
                                    {filteredProviders.length === 0 ? (
                                        <tr><td colSpan={8} className="ad-empty">No providers found</td></tr>
                                    ) : filteredProviders.map(p => {
                                        const vs = p.verificationStatus;
                                        const vsCls = vs === 'APPROVED' ? 'ad-badge-verified'
                                                    : vs === 'REJECTED'  ? 'ad-badge-rejected'
                                                    : 'ad-badge-unverified';
                                        const vsLabel = vs === 'APPROVED' ? '✓ Approved'
                                                      : vs === 'REJECTED'  ? '✗ Rejected'
                                                      : '⏳ Pending';
                                        return (
                                            <tr key={p.providerId}>
                                                <td style={{ color: '#94a3b8', fontSize: 13 }}>#{p.providerId}</td>
                                                <td style={{ fontWeight: 600 }}>Dr. {p.fullName}</td>
                                                <td>{p.specialization}</td>
                                                <td>{p.clinicName}</td>
                                                <td>{p.experienceYears} yrs</td>
                                                <td>⭐ {p.avgRating?.toFixed(1) || '0.0'}</td>
                                                <td>
                                                    <span className={`ad-badge ${vsCls}`}>{vsLabel}</span>
                                                    {p.verificationNote && (
                                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                                                            Note: {p.verificationNote}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {p.verificationDocumentUrl
                                                        ? <a href={p.verificationDocumentUrl} target="_blank" rel="noreferrer"
                                                             style={{ fontSize: 12, color: '#1d4ed8' }}>📄 View</a>
                                                        : <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── APPOINTMENTS ── */}
                    {activeTab === 'appointments' && (
                        <div className="ad-card">
                            <div className="ad-card-header">
                                <h3>All Appointments ({appointments.length})</h3>
                            </div>
                            <table className="ad-table">
                                <thead>
                                    <tr><th>ID</th><th>Patient ID</th><th>Provider ID</th><th>Date</th><th>Time</th><th>Service</th><th>Mode</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {appointments.length === 0 ? (
                                        <tr><td colSpan={8} className="ad-empty">No appointments found</td></tr>
                                    ) : appointments.map(a => {
                                        const statusCls = {
                                            SCHEDULED: 'ad-badge-scheduled', COMPLETED: 'ad-badge-completed',
                                            CANCELLED: 'ad-badge-cancelled', NO_SHOW: 'ad-badge-unverified'
                                        }[a.status] || 'ad-badge-scheduled';
                                        return (
                                            <tr key={a.appointmentId}>
                                                <td style={{ color: '#94a3b8', fontSize: 13 }}>#{a.appointmentId}</td>
                                                <td>#{a.patientId}</td>
                                                <td>#{a.providerId}</td>
                                                <td style={{ fontWeight: 600 }}>{a.appointmentDate}</td>
                                                <td style={{ color: '#64748b' }}>{a.startTime?.slice(0,5)} – {a.endTime?.slice(0,5)}</td>
                                                <td>{a.serviceType}</td>
                                                <td style={{ fontSize: 13 }}>{a.modeOfConsultation?.replace('_',' ')}</td>
                                                <td><span className={`ad-badge ${statusCls}`}>{a.status?.replace('_',' ')}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── PAYMENTS ── */}
                    {activeTab === 'payments' && (
                        <div className="ad-card">
                            <div className="ad-card-header">
                                <h3>All Payments ({payments.length})</h3>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#b45309' }}>
                                    Total Revenue: ₹{totalRevenue.toFixed(2)}
                                </div>
                            </div>
                            <table className="ad-table">
                                <thead>
                                    <tr><th>ID</th><th>Appointment</th><th>Patient ID</th><th>Amount</th><th>Mode</th><th>Status</th><th>Transaction ID</th><th>Paid At</th></tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr><td colSpan={8} className="ad-empty">No payments found</td></tr>
                                    ) : payments.map(p => {
                                        const statusCls = { SUCCESS: 'ad-badge-success', REFUNDED: 'ad-badge-refunded', FAILED: 'ad-badge-inactive' }[p.status] || 'ad-badge-inactive';
                                        return (
                                            <tr key={p.paymentId}>
                                                <td style={{ color: '#94a3b8', fontSize: 13 }}>#{p.paymentId}</td>
                                                <td>#{p.appointmentId}</td>
                                                <td>#{p.patientId}</td>
                                                <td style={{ fontWeight: 700, color: '#0f172a' }}>₹{p.amount}</td>
                                                <td>{p.mode}</td>
                                                <td><span className={`ad-badge ${statusCls}`}>{p.status}</span></td>
                                                <td style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{p.transactionId?.slice(0,20)}...</td>
                                                <td style={{ fontSize: 13, color: '#64748b' }}>{p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN') : '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
