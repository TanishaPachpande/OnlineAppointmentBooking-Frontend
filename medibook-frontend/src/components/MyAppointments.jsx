// REPLACE: src/components/MyAppointments.jsx
// Changes vs original:
//  - Appointment cards now display in a horizontal auto-fill grid (not a vertical list)
//  - Each card has a dark header, 2x2 info grid, and colour-coded action buttons
//  - Reschedule modal has a polished dark header + blurred backdrop
//  - ALL logic (fetchAppointments, handleCancel, reschedule, payment check) is UNCHANGED

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import appointmentService from '../services/appointmentService';
import providerService from '../services/api';
import paymentService from '../services/paymentService';

const MyAppointments = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [providers, setProviders]         = useState([]);
    const [appointments, setAppointments]   = useState([]);
    const [loading, setLoading]             = useState(true);
    const [message, setMessage]             = useState(null);
    const [activeFilter, setActiveFilter]   = useState('ALL');

    const [rescheduleModal, setRescheduleModal]     = useState(null);
    const [rescheduleDate, setRescheduleDate]       = useState('');
    const [rescheduleSlots, setRescheduleSlots]     = useState([]);
    const [selectedNewSlot, setSelectedNewSlot]     = useState(null);
    const [rescheduling, setRescheduling]           = useState(false);
    const [paidAppointmentIds, setPaidAppointmentIds] = useState(new Set());

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') { navigate('/login'); return; }
        fetchAppointments();
    }, []);

    // ── unchanged ──
    const fetchAppointments = async () => {
        try {
            const [data, providerData] = await Promise.all([
                appointmentService.getByPatient(user.userId),
                providerService.getAllProviders()
            ]);
            setAppointments(data);
            setProviders(providerData);

            const paidIds = new Set();
            await Promise.all(
                data.filter(a => a.status === 'SCHEDULED').map(async (a) => {
                    try {
                        await paymentService.getPaymentByAppointmentId(a.appointmentId);
                        paidIds.add(a.appointmentId);
                    } catch { }
                })
            );
            setPaidAppointmentIds(paidIds);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load appointments.' });
        } finally {
            setLoading(false);
        }
    };

    // ── unchanged ──
    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment? If you have paid, a refund will be processed.')) return;
        try {
            await appointmentService.cancelAppointment(appointmentId);
            try {
                const payment = await paymentService.getPaymentByAppointmentId(appointmentId);
                if (payment && payment.status === 'SUCCESS') {
                    await paymentService.refundPayment(payment.paymentId, 'Appointment cancelled by patient');
                    setMessage({ type: 'success', text: 'Appointment cancelled and payment refunded successfully.' });
                } else {
                    setMessage({ type: 'success', text: 'Appointment cancelled successfully.' });
                }
            } catch {
                setMessage({ type: 'success', text: 'Appointment cancelled successfully.' });
            }
            fetchAppointments();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Cancellation failed.' });
        }
    };

    const openRescheduleModal = (appointment) => {
        setRescheduleModal(appointment);
        setRescheduleDate('');
        setRescheduleSlots([]);
        setSelectedNewSlot(null);
    };

    // ── unchanged ──
    const fetchRescheduleSlots = async (date) => {
        setRescheduleDate(date);
        setSelectedNewSlot(null);
        if (!date) return;
        try {
            const response = await fetch(
                `http://localhost:8080/slots/available/${rescheduleModal.providerId}/${date}`,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            const data = await response.json();
            setRescheduleSlots(Array.isArray(data) ? data : []);
        } catch {
            setRescheduleSlots([]);
        }
    };

    // ── unchanged ──
    const handleReschedule = async () => {
        if (!selectedNewSlot) { setMessage({ type: 'error', text: 'Please select a new slot.' }); return; }
        setRescheduling(true);
        try {
            await appointmentService.rescheduleAppointment(rescheduleModal.appointmentId, selectedNewSlot.slotId);
            setMessage({ type: 'success', text: 'Appointment rescheduled successfully!' });
            setRescheduleModal(null);
            fetchAppointments();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Reschedule failed.' });
        } finally {
            setRescheduling(false);
        }
    };

    // ── status colours ──
    const statusConfig = {
        SCHEDULED: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6', label: 'Scheduled', cardBorder: '#3b82f6' },
        COMPLETED: { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e', label: 'Completed', cardBorder: '#22c55e' },
        CANCELLED: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', label: 'Cancelled', cardBorder: '#ef4444' },
        NO_SHOW:   { color: '#92400e', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', label: 'No Show',   cardBorder: '#f59e0b' },
    };

    const filters = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
    const filtered = activeFilter === 'ALL'
        ? appointments
        : appointments.filter(a => a.status === activeFilter);
    const today = new Date().toISOString().split('T')[0];

    if (loading) return (
        <div className="page-content">
            <div className="loading-container"><div className="spinner" /></div>
        </div>
    );

    return (
        <div className="page-content">

            {/* ── Page header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0a1628' }}>My Appointments</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                        Track and manage all your healthcare visits
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg,#0a66c2,#0088ff)',
                        color: 'white', border: 'none', borderRadius: '10px',
                        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(10,102,194,0.3)',
                    }}
                >
                    + Book New Appointment
                </button>
            </div>

            {/* ── Alert banner ── */}
            {message && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    className={message.type === 'error' ? 'error-message' : 'success-message'}>
                    {message.text}
                    <button onClick={() => setMessage(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                </div>
            )}

            {/* ── Filter pills ── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {filters.map(f => {
                    const count = f === 'ALL' ? appointments.length : appointments.filter(a => a.status === f).length;
                    const active = activeFilter === f;
                    return (
                        <button key={f} onClick={() => setActiveFilter(f)}
                            style={{
                                padding: '8px 18px', borderRadius: '25px',
                                border: active ? 'none' : '1.5px solid #e2e8f0',
                                background: active ? 'linear-gradient(135deg,#0a66c2,#0088ff)' : 'white',
                                color: active ? 'white' : '#64748b',
                                fontWeight: active ? 700 : 500,
                                fontSize: '0.85rem', cursor: 'pointer',
                                boxShadow: active ? '0 4px 12px rgba(10,102,194,0.3)' : 'none',
                                transition: 'all 0.18s',
                            }}>
                            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()} ({count})
                        </button>
                    );
                })}
            </div>

            {/* ── Empty state ── */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <div className="empty-title">No {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} appointments</div>
                    <p className="empty-text">You don't have any {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} appointments yet.</p>
                    <button onClick={() => navigate('/dashboard')} className="empty-action">
                        Browse Healthcare Providers
                    </button>
                </div>
            ) : (
                /* ── Horizontal card grid ── */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                }}>
                    {filtered.map(apt => {
                        const sc = statusConfig[apt.status] || statusConfig.SCHEDULED;
                        const isPaid = paidAppointmentIds.has(apt.appointmentId);
                        const providerName = providers.find(p => p.providerId === apt.providerId)?.fullName
                            || `Provider #${apt.providerId}`;

                        return (
                            <div key={apt.appointmentId} style={{
                                background: 'white', borderRadius: '16px',
                                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                border: `1px solid #f1f5f9`,
                                borderTop: `3px solid ${sc.cardBorder}`,
                                transition: 'transform 0.18s, box-shadow 0.18s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.11)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
                            >
                                {/* card header */}
                                <div style={{
                                    background: 'linear-gradient(135deg,#0a1628 0%,#0f2044 100%)',
                                    padding: '14px 18px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                }}>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: '3px' }}>
                                            #{apt.appointmentId}
                                        </div>
                                        <div style={{ color: 'white', fontWeight: 700, fontSize: '0.97rem' }}>
                                            Dr. {providerName}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px',
                                        fontSize: '0.7rem', fontWeight: 700,
                                        background: sc.bg, color: sc.color,
                                        border: `1px solid ${sc.border}`, whiteSpace: 'nowrap',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                                        {sc.label}
                                    </span>
                                </div>

                                {/* card body — 2×2 info chips */}
                                <div style={{ padding: '14px 18px', flex: 1 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                        {[
                                            { label: 'Date',    val: `📅 ${apt.appointmentDate}` },
                                            { label: 'Time',    val: `⏰ ${apt.startTime?.slice(0,5)} – ${apt.endTime?.slice(0,5)}` },
                                            { label: 'Service', val: `🩺 ${apt.serviceType}` },
                                            { label: 'Mode',    val: `💬 ${apt.modeOfConsultation?.replace('_',' ')}` },
                                        ].map(item => (
                                            <div key={item.label} style={{
                                                background: '#f8fafc', borderRadius: '8px', padding: '9px 11px',
                                            }}>
                                                <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                                                    {item.label}
                                                </div>
                                                <div style={{ color: '#0a1628', fontWeight: 600, fontSize: '0.82rem' }}>
                                                    {item.val}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {apt.notes && (
                                        <div style={{ padding: '8px 11px', background: '#fffbeb', borderRadius: '8px', fontSize: '0.79rem', color: '#78350f', border: '1px solid #fde68a' }}>
                                            📝 {apt.notes.substring(0, 80)}…
                                        </div>
                                    )}
                                </div>

                                {/* card footer — action buttons */}
                                <div style={{
                                    padding: '12px 18px', borderTop: '1px solid #f1f5f9',
                                    background: '#fafbfd', display: 'flex', gap: '8px',
                                }}>
                                    {apt.status === 'SCHEDULED' && (<>
                                        {!isPaid ? (
                                            <button onClick={() => navigate(`/payment/${apt.appointmentId}`)}
                                                style={{
                                                    flex: 1, padding: '9px 0',
                                                    background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                                                    color: 'white', border: 'none', borderRadius: '8px',
                                                    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                                                    boxShadow: '0 3px 8px rgba(29,78,216,0.28)',
                                                }}>
                                                💳 Pay Now
                                            </button>
                                        ) : (
                                            <div style={{
                                                flex: 1, padding: '9px 0',
                                                background: '#f0fdf4', color: '#15803d',
                                                borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '1px solid #bbf7d0',
                                            }}>✓ Paid</div>
                                        )}
                                        <button onClick={() => openRescheduleModal(apt)}
                                            style={{
                                                flex: 1, padding: '9px 0',
                                                background: 'white', color: '#0a66c2',
                                                border: '1.5px solid #bfdbfe', borderRadius: '8px',
                                                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                                            }}>
                                            🔄 Reschedule
                                        </button>
                                        <button onClick={() => handleCancel(apt.appointmentId)}
                                            style={{
                                                flex: 1, padding: '9px 0',
                                                background: 'white', color: '#b91c1c',
                                                border: '1.5px solid #fecaca', borderRadius: '8px',
                                                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                                            }}>
                                            ✕ Cancel
                                        </button>
                                    </>)}

                                    {apt.status === 'COMPLETED' && (
                                        <button onClick={() => navigate(`/review/${apt.appointmentId}/${apt.providerId}`)}
                                            style={{
                                                flex: 1, padding: '10px 0',
                                                background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                                                color: 'white', border: 'none', borderRadius: '8px',
                                                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                                                boxShadow: '0 3px 8px rgba(245,158,11,0.32)',
                                            }}>
                                            ⭐ Rate &amp; Review
                                        </button>
                                    )}

                                    {apt.status === 'CANCELLED' && (
                                        <button onClick={() => navigate(`/book/${apt.providerId}`)}
                                            style={{
                                                flex: 1, padding: '10px 0',
                                                background: 'linear-gradient(135deg,#0a66c2,#0088ff)',
                                                color: 'white', border: 'none', borderRadius: '8px',
                                                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                                                boxShadow: '0 3px 8px rgba(10,102,194,0.28)',
                                            }}>
                                            🔄 Book Again
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Reschedule Modal ── */}
            {rescheduleModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: 'white', borderRadius: '20px',
                        width: '480px', maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}>
                        {/* modal header */}
                        <div style={{
                            padding: '18px 24px',
                            background: 'linear-gradient(135deg,#0a1628,#0f2044)',
                            borderRadius: '20px 20px 0 0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <h3 style={{ color: 'white', margin: 0, fontWeight: 700, fontSize: '1rem' }}>
                                🔄 Reschedule Appointment
                            </h3>
                            <button onClick={() => setRescheduleModal(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.12)', border: 'none',
                                    color: 'white', borderRadius: '6px',
                                    padding: '4px 9px', cursor: 'pointer', fontSize: '16px',
                                }}>✕</button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div className="form-group">
                                <label className="form-label">Select New Date</label>
                                <input type="date" min={today} className="form-input"
                                    value={rescheduleDate}
                                    onChange={e => fetchRescheduleSlots(e.target.value)} />
                            </div>

                            {rescheduleDate && (
                                <div className="form-group">
                                    <label className="form-label">Available Time Slots</label>
                                    {rescheduleSlots.length === 0 ? (
                                        <p style={{ color: '#b91c1c', fontSize: '0.9rem', padding: '12px', background: '#fef2f2', borderRadius: '8px' }}>
                                            No slots available on this date.
                                        </p>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {rescheduleSlots.map(slot => (
                                                <button type="button" key={slot.slotId}
                                                    className={`slot-button ${selectedNewSlot?.slotId === slot.slotId ? 'selected' : ''}`}
                                                    onClick={() => setSelectedNewSlot(slot)}>
                                                    {slot.startTime?.slice(0, 5)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button onClick={handleReschedule}
                                    disabled={rescheduling || !selectedNewSlot}
                                    style={{
                                        flex: 1, padding: '12px',
                                        background: (rescheduling || !selectedNewSlot) ? '#93c5fd' : 'linear-gradient(135deg,#0a66c2,#0088ff)',
                                        color: 'white', border: 'none', borderRadius: '10px',
                                        fontWeight: 700, fontSize: '0.95rem',
                                        cursor: (rescheduling || !selectedNewSlot) ? 'not-allowed' : 'pointer',
                                    }}>
                                    {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                                </button>
                                <button onClick={() => setRescheduleModal(null)}
                                    style={{
                                        flex: 1, padding: '12px',
                                        background: 'white', color: '#64748b',
                                        border: '1.5px solid #e2e8f0', borderRadius: '10px',
                                        fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                                    }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAppointments;
