import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import providerService from '../services/api';
import appointmentService from '../services/appointmentService';

const ProviderAppointments = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [providerData, setProviderData] = useState(null);
    const [allAppointments, setAllAppointments] = useState([]); // FIX: keep full list for stats
    const [appointments, setAppointments] = useState([]);       // FIX: filtered display list
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'PROVIDER') { navigate('/login'); return; }
        fetchData();
    }, []);

    // FIX: auto-dismiss messages after 4 seconds
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const fetchData = async () => {
        try {
            const pData = await providerService.getProviderByUserId(user.userId);
            setProviderData(pData);
            // FIX: removed separate getAppointmentCount API call — derive from array instead
            const apts = await appointmentService.getByProvider(pData.providerId);
            setAllAppointments(apts);
            setAppointments(apts);
            setSelectedDate(''); // reset date filter on full refresh
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load appointments.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterByDate = async () => {
        if (!selectedDate || !providerData) return;
        try {
            const data = await appointmentService.getByProviderAndDate(providerData.providerId, selectedDate);
            setAppointments(data);
            // FIX: do NOT update allAppointments — stats must stay based on full list
        } catch {
            setMessage({ type: 'error', text: 'Failed to filter appointments.' });
        }
    };

    const handleClearDate = async () => {
        setSelectedDate('');
        setAppointments(allAppointments); // FIX: restore from cached full list, no extra API call
    };

    const handleComplete = async (appointmentId) => {
        if (!window.confirm('Mark this appointment as completed?')) return;
        try {
            await appointmentService.completeAppointment(appointmentId);
            setMessage({ type: 'success', text: 'Appointment marked as completed.' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
        }
    };

    const handleNoShow = async (appointmentId) => {
        if (!window.confirm('Mark this appointment as No Show?')) return;
        try {
            await appointmentService.updateStatus(appointmentId, 'NO_SHOW');
            setMessage({ type: 'success', text: 'Marked as No Show.' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
        }
    };

    const statusConfig = {
        SCHEDULED: { bg: '#d4edda', color: '#155724', label: 'Scheduled' },
        COMPLETED: { bg: '#cce5ff', color: '#004085', label: 'Completed' },
        CANCELLED: { bg: '#f8d7da', color: '#721c24', label: 'Cancelled' },
        NO_SHOW:   { bg: '#fff3cd', color: '#856404', label: 'No Show'  }
    };

    const filters = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

    const filtered = activeFilter === 'ALL'
        ? appointments
        : appointments.filter(a => a.status === activeFilter);

    // FIX: stats always computed from allAppointments (unaffected by date filter)
    const totalCount   = allAppointments.length;
    const scheduled    = allAppointments.filter(a => a.status === 'SCHEDULED').length;
    const completed    = allAppointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled    = allAppointments.filter(a => a.status === 'CANCELLED').length;
    const noShow       = allAppointments.filter(a => a.status === 'NO_SHOW').length;

    const s = {
        page: { padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
        card: { background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px', overflow: 'hidden' },
        filterBtn: (active) => ({
            padding: '7px 16px', borderRadius: '20px', border: '1px solid #2c3e50',
            cursor: 'pointer', fontWeight: '600', fontSize: '13px',
            backgroundColor: active ? '#2c3e50' : 'white',
            color: active ? 'white' : '#2c3e50'
        }),
        statCard: (color) => ({
            background: color, borderRadius: '10px', padding: '18px',
            display: 'flex', flexDirection: 'column', gap: '4px'
        }),
        actionBtn: (color) => ({
            padding: '5px 12px', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontWeight: '600', fontSize: '12px',
            backgroundColor: color, color: 'white'
        })
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>;

    return (
        <div style={s.page}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ color: '#2c3e50', margin: 0 }}>Patient Appointments</h2>
                    <p style={{ color: '#7f8c8d', margin: '4px 0 0 0', fontSize: '14px' }}>Dr. {user?.fullName}</p>
                </div>
                <button onClick={() => navigate('/manage-slots')}
                    style={{ padding: '8px 18px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                    ← Dashboard
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '12px 16px', borderRadius: '6px', marginBottom: '20px',
                    backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    display: 'flex', justifyContent: 'space-between'
                }}>
                    {message.text}
                    <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Stats — FIX: 5 cards, all derived from allAppointments, NO_SHOW added */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={s.statCard('#eaf4fb')}>
                    <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#2980b9' }}>{totalCount}</span>
                    <span style={{ color: '#555', fontSize: '13px' }}>Total</span>
                </div>
                <div style={s.statCard('#eafaf1')}>
                    <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#27ae60' }}>{scheduled}</span>
                    <span style={{ color: '#555', fontSize: '13px' }}>Scheduled</span>
                </div>
                <div style={s.statCard('#cce5ff')}>
                    <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#004085' }}>{completed}</span>
                    <span style={{ color: '#555', fontSize: '13px' }}>Completed</span>
                </div>
                <div style={s.statCard('#f8d7da')}>
                    <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#721c24' }}>{cancelled}</span>
                    <span style={{ color: '#555', fontSize: '13px' }}>Cancelled</span>
                </div>
                {/* FIX: No Show stat card was completely missing */}
                <div style={s.statCard('#fff3cd')}>
                    <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#856404' }}>{noShow}</span>
                    <span style={{ color: '#555', fontSize: '13px' }}>No Show</span>
                </div>
            </div>

            {/* Date Filter */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>Filter by date:</span>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
                <button onClick={handleFilterByDate}
                    style={{ padding: '8px 16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                    Apply
                </button>
                {selectedDate && (
                    <button onClick={handleClearDate}
                        style={{ padding: '8px 16px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                        Clear
                    </button>
                )}
                {/* FIX: show indicator when date filter is active */}
                {selectedDate && (
                    <span style={{ fontSize: '13px', color: '#856404', fontStyle: 'italic' }}>
                        ⚠ Showing results for {selectedDate} only. Stats reflect all-time totals.
                    </span>
                )}
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {filters.map(f => (
                    <button key={f} style={s.filterBtn(activeFilter === f)} onClick={() => setActiveFilter(f)}>
                        {f === 'ALL'
                            ? `All (${appointments.length})`
                            : `${f.replace('_', ' ')} (${appointments.filter(a => a.status === f).length})`}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {filtered.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '10px', padding: '60px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <p>No appointments found.</p>
                </div>
            ) : (
                filtered.map(apt => {
                    const sc = statusConfig[apt.status] || statusConfig.SCHEDULED;
                    return (
                        <div key={apt.appointmentId} style={s.card}>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', color: '#2c3e50' }}>
                                            Appointment #{apt.appointmentId}
                                        </h4>
                                        <span style={{ fontSize: '13px', color: '#7f8c8d' }}>Patient ID: {apt.patientId}</span>
                                    </div>
                                    <span style={{
                                        padding: '5px 14px', borderRadius: '20px', fontSize: '12px',
                                        fontWeight: '700', backgroundColor: sc.bg, color: sc.color
                                    }}>{sc.label}</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '14px', marginBottom: '14px' }}>
                                    <div><strong>📅 Date:</strong> {apt.appointmentDate}</div>
                                    <div><strong>⏰ Time:</strong> {apt.startTime?.slice(0, 5)} – {apt.endTime?.slice(0, 5)}</div>
                                    <div><strong>🩺 Service:</strong> {apt.serviceType}</div>
                                    <div><strong>💊 Mode:</strong> {apt.modeOfConsultation?.replace('_', ' ')}</div>
                                    {apt.notes && <div style={{ gridColumn: 'span 2' }}><strong>📝 Notes:</strong> {apt.notes}</div>}
                                </div>

                                {apt.status === 'SCHEDULED' && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={s.actionBtn('#27ae60')} onClick={() => handleComplete(apt.appointmentId)}>
                                            ✓ Mark Complete
                                        </button>
                                        <button style={s.actionBtn('#e67e22')} onClick={() => handleNoShow(apt.appointmentId)}>
                                            No Show
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ProviderAppointments;