import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import appointmentService from '../services/appointmentService';
import providerService from '../services/api';

const MyAppointments = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [providers, setProviders] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [activeFilter, setActiveFilter] = useState('ALL');

    const [rescheduleModal, setRescheduleModal] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleSlots, setRescheduleSlots] = useState([]);
    const [selectedNewSlot, setSelectedNewSlot] = useState(null);
    const [rescheduling, setRescheduling] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') { navigate('/login'); return; }
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const [data, providerData] = await Promise.all([
                appointmentService.getByPatient(user.userId),
                providerService.getAllProviders()
            ]);
            setAppointments(data);
            setProviders(providerData);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load appointments.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await appointmentService.cancelAppointment(appointmentId);
            setMessage({ type: 'success', text: 'Appointment cancelled successfully.' });
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

    const statusConfig = {
        SCHEDULED: { class: 'scheduled', label: 'Scheduled' },
        COMPLETED: { class: 'completed', label: 'Completed' },
        CANCELLED: { class: 'cancelled', label: 'Cancelled' },
        NO_SHOW: { class: 'pending', label: 'No Show' }
    };

    const filters = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
    const filtered = activeFilter === 'ALL'
        ? appointments
        : appointments.filter(a => a.status === activeFilter);
    const today = new Date().toISOString().split('T')[0];

    if (loading) return (
        <div className="page-content">
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        </div>
    );

    return (
        <div className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2>My Appointments</h2>
                <button onClick={() => navigate('/dashboard')}
                    className="btn btn-primary">
                    + Book New Appointment
                </button>
            </div>

            {message && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}
                     className={message.type === 'error' ? 'error-message' : 'success-message'}>
                    {message.text}
                    <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="filter-tags" style={{ marginBottom: '24px' }}>
                {filters.map(f => (
                    <button key={f} className={`filter-tag ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
                        {f === 'ALL' ? `All (${appointments.length})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${appointments.filter(a => a.status === f).length})`}
                    </button>
                ))}
            </div>

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
                <div className="appointment-grid">
                    {filtered.map(apt => {
                        const sc = statusConfig[apt.status] || statusConfig.SCHEDULED;
                        const isScheduled = apt.status === 'SCHEDULED';
                        return (
                            <div key={apt.appointmentId} className={`appointment-card ${sc.class}`}>
                                <div style={{ marginBottom: '12px' }}>
                                    <p className="appointment-date">Appointment #{apt.appointmentId}</p>
                                    <p className="appointment-provider">
                                        Dr. {providers.find(p => p.providerId === apt.providerId)?.fullName || `Provider #${apt.providerId}`}
                                    </p>
                                    <span className={`appointment-status ${sc.class}`}>{sc.label}</span>
                                </div>

                                <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                                    <div style={{ marginBottom: '8px' }}><strong>📅 Date:</strong> {apt.appointmentDate}</div>
                                    <div style={{ marginBottom: '8px' }}><strong>⏰ Time:</strong> {apt.startTime?.slice(0, 5)} – {apt.endTime?.slice(0, 5)}</div>
                                    <div style={{ marginBottom: '8px' }}><strong>🩺 Service:</strong> {apt.serviceType}</div>
                                    <div><strong>💬 Mode:</strong> {apt.modeOfConsultation?.replace('_', ' ')}</div>
                                    {apt.notes && <div style={{ marginTop: '8px', color: '#666' }}><strong>📝 Notes:</strong> {apt.notes?.substring(0, 100)}...</div>}
                                </div>

                                <div className="appointment-actions">
                                    {apt.status === 'SCHEDULED' && (
                                        <>
                                            <button className="appointment-action-btn" onClick={() => openRescheduleModal(apt)}>
                                                Reschedule
                                            </button>
                                            <button className="appointment-action-btn danger" onClick={() => handleCancel(apt.appointmentId)}>
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {apt.status === 'COMPLETED' && (
                                        <>
                                            <button className="appointment-action-btn" onClick={() => navigate(`/payment/${apt.appointmentId}`)}>
                                                💳 Pay Now
                                            </button>
                                            <button className="appointment-action-btn" onClick={() => navigate(`/review/${apt.appointmentId}/${apt.providerId}`)}>
                                                ⭐ Rate
                                            </button>
                                        </>
                                    )}
                                    {apt.status === 'CANCELLED' && (
                                        <button className="appointment-action-btn" onClick={() => navigate(`/book/${apt.providerId}`)}>
                                            🔄 Book Again
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{
                        width: '500px', maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto'
                    }}>
                        <h3 className="card-title">Reschedule Appointment</h3>
                        
                        <div className="form-group">
                            <label className="form-label">Select New Date</label>
                            <input type="date" min={today}
                                className="form-input"
                                value={rescheduleDate} onChange={e => fetchRescheduleSlots(e.target.value)} />
                        </div>

                        {rescheduleDate && (
                            <div className="form-group">
                                <label className="form-label">Available Slots</label>
                                {rescheduleSlots.length === 0 ? (
                                    <p style={{ color: '#d32f2f', fontSize: '0.9rem' }}>No slots available on this date.</p>
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

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button onClick={handleReschedule} disabled={rescheduling || !selectedNewSlot}
                                className="btn btn-primary" style={{ flex: 1 }}>
                                {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                            </button>
                            <button onClick={() => setRescheduleModal(null)}
                                className="btn btn-outline" style={{ flex: 1 }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAppointments;