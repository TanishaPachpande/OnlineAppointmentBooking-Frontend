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

    // Reschedule modal state
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
        SCHEDULED: { bg: '#d4edda', color: '#155724', label: 'Scheduled' },
        COMPLETED: { bg: '#cce5ff', color: '#004085', label: 'Completed' },
        CANCELLED: { bg: '#f8d7da', color: '#721c24', label: 'Cancelled' },
        NO_SHOW: { bg: '#fff3cd', color: '#856404', label: 'No Show' }
    };

    const filters = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

    const filtered = activeFilter === 'ALL'
        ? appointments
        : appointments.filter(a => a.status === activeFilter);

    const today = new Date().toISOString().split('T')[0];

    const s = {
        page: { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
        card: { background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '16px' },
        filterBtn: (active) => ({
            padding: '8px 20px', borderRadius: '20px', border: '1px solid #2c3e50',
            cursor: 'pointer', fontWeight: '600', fontSize: '14px',
            backgroundColor: active ? '#2c3e50' : 'white',
            color: active ? 'white' : '#2c3e50'
        }),
        actionBtn: (color) => ({
            padding: '6px 14px', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontWeight: '600', fontSize: '13px',
            backgroundColor: color, color: 'white'
        }),
        modal: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        },
        modalBox: {
            background: 'white', padding: '28px', borderRadius: '12px',
            width: '500px', maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto'
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>;

    return (
        <div style={s.page}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>My Appointments</h2>
                <button onClick={() => navigate('/dashboard')}
                    style={{ padding: '8px 18px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                    + Book New
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

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {filters.map(f => (
                    <button key={f} style={s.filterBtn(activeFilter === f)} onClick={() => setActiveFilter(f)}>
                        {f === 'ALL' ? `All (${appointments.length})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${appointments.filter(a => a.status === f).length})`}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '10px', padding: '60px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                    <p>No {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} appointments found.</p>
                    <button onClick={() => navigate('/dashboard')}
                        style={{ marginTop: '12px', padding: '10px 24px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                        Browse Doctors
                    </button>
                </div>
            ) : (
                filtered.map(apt => {
                    const sc = statusConfig[apt.status] || statusConfig.SCHEDULED;
                    const isScheduled = apt.status === 'SCHEDULED';
                    return (
                        <div key={apt.appointmentId} style={s.card}>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', color: '#2c3e50' }}>
                                            Appointment #{apt.appointmentId}
                                        </h4>
                                        <span style={{ fontSize: '13px', color: '#7f8c8d' }}>
                                            Dr. {providers.find(p => p.providerId === apt.providerId)?.fullName || `Provider #${apt.providerId}`}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '5px 14px', borderRadius: '20px', fontSize: '12px',
                                        fontWeight: '700', backgroundColor: sc.bg, color: sc.color
                                    }}>{sc.label}</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px', marginBottom: '16px' }}>
                                    <div><strong>📅 Date:</strong> {apt.appointmentDate}</div>
                                    <div><strong>⏰ Time:</strong> {apt.startTime?.slice(0, 5)} – {apt.endTime?.slice(0, 5)}</div>
                                    <div><strong>🩺 Service:</strong> {apt.serviceType}</div>
                                    <div><strong>💊 Mode:</strong> {apt.modeOfConsultation?.replace('_', ' ')}</div>
                                    {apt.notes && <div style={{ gridColumn: 'span 2' }}><strong>📝 Notes:</strong> {apt.notes}</div>}
                                </div>

                                {apt.status === 'SCHEDULED' && (
    <div style={{ display: 'flex', gap: '10px' }}>
        <button style={s.actionBtn('#f39c12')} onClick={() => openRescheduleModal(apt)}>
            Reschedule
        </button>
        <button style={s.actionBtn('#e74c3c')} onClick={() => handleCancel(apt.appointmentId)}>
            Cancel
        </button>
    </div>
)}
{apt.status === 'COMPLETED' && (
    <div style={{ display: 'flex', gap: '10px' }}>
        <button style={s.actionBtn('#2980b9')}
            onClick={() => navigate(`/payment/${apt.appointmentId}`)}>
            💳 Pay Now
        </button>
        <button style={s.actionBtn('#8e44ad')}
            onClick={() => navigate(`/review/${apt.appointmentId}/${apt.providerId}`)}>
            ⭐ Rate Doctor
        </button>
    </div>
)}
{apt.status === 'CANCELLED' && (
    <div style={{ display: 'flex', gap: '10px' }}>
        <button style={s.actionBtn('#27ae60')}
            onClick={() => navigate(`/book/${apt.providerId}`)}>
            🔄 Book Again
        </button>
    </div>
)}
                            </div>
                        </div>
                    );
                })
            )}

            {/* Reschedule Modal */}
            {rescheduleModal && (
                <div style={s.modal}>
                    <div style={s.modalBox}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Reschedule Appointment #{rescheduleModal.appointmentId}</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Select New Date</label>
                            <input type="date" min={today}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                                value={rescheduleDate} onChange={e => fetchRescheduleSlots(e.target.value)} />
                        </div>

                        {rescheduleDate && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Available Slots</label>
                                {rescheduleSlots.length === 0 ? (
                                    <p style={{ color: '#e74c3c', fontSize: '14px' }}>No slots available on this date.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {rescheduleSlots.map(slot => (
                                            <button type="button" key={slot.slotId}
                                                onClick={() => setSelectedNewSlot(slot)}
                                                style={{
                                                    padding: '8px 14px', borderRadius: '6px',
                                                    border: `2px solid ${selectedNewSlot?.slotId === slot.slotId ? '#2c3e50' : '#ddd'}`,
                                                    backgroundColor: selectedNewSlot?.slotId === slot.slotId ? '#2c3e50' : 'white',
                                                    color: selectedNewSlot?.slotId === slot.slotId ? 'white' : '#333',
                                                    cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                                                }}>
                                                {slot.startTime?.slice(0, 5)} – {slot.endTime?.slice(0, 5)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleReschedule} disabled={rescheduling || !selectedNewSlot}
                                style={{ padding: '10px 24px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                            </button>
                            <button onClick={() => setRescheduleModal(null)}
                                style={{ padding: '10px 24px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
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