import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import providerService from '../services/api';
import appointmentService from '../services/appointmentService';

const BookAppointment = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [provider, setProvider] = useState(null);
    const [allSlots, setAllSlots] = useState([]);       // all slots from backend
    const [groupedSlots, setGroupedSlots] = useState({}); // grouped by date
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        serviceType: '',
        modeOfConsultation: 'IN_PERSON',
        notes: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') { navigate('/login'); return; }
        fetchProviderAndSlots();
    }, []);

    const fetchProviderAndSlots = async () => {
        try {
            const providerData = await providerService.getProviderById(providerId);
            setProvider(providerData);

            // Fetch ALL slots for this provider, then filter available ones on frontend
            const response = await fetch(
                `http://localhost:8080/slots/provider/${providerId}`,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            const slots = await response.json();

            // Filter: only available (not booked, not blocked) and future dates
            const today = new Date().toISOString().split('T')[0];
            const available = Array.isArray(slots)
                ? slots.filter(s =>
                    s.isBooked === false &&
                    s.isBlocked === false &&
                    s.date >= today
                )
                : [];

            // Sort by date then startTime
            available.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.startTime.localeCompare(b.startTime);
            });

            setAllSlots(available);

            // Group by date
            const grouped = available.reduce((acc, slot) => {
                if (!acc[slot.date]) acc[slot.date] = [];
                acc[slot.date].push(slot);
                return acc;
            }, {});
            setGroupedSlots(grouped);

        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load provider or slots.' });
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        if (!selectedSlot) { setMessage({ type: 'error', text: 'Please select a time slot.' }); return; }
        if (!formData.serviceType.trim()) { setMessage({ type: 'error', text: 'Please enter a service type.' }); return; }

        setSubmitting(true);
        try {
            await appointmentService.bookAppointment({
                patientId: user.userId,
                providerId: parseInt(providerId),
                slotId: selectedSlot.slotId,
                serviceType: formData.serviceType,
                modeOfConsultation: formData.modeOfConsultation,
                notes: formData.notes
            });
            setMessage({ type: 'success', text: 'Appointment booked successfully! Redirecting...' });
            setTimeout(() => navigate('/appointments'), 1800);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Booking failed. Please try again.' });
            setSubmitting(false);
        }
    };

    // Format date nicely: "2026-05-05" → "Monday, 5 May 2026"
    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (timeStr) => timeStr?.slice(0, 5);

    const s = {
        page: { padding: '30px', maxWidth: '960px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
        card: { background: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
        label: { display: 'block', fontWeight: '600', marginBottom: '6px', color: '#34495e', fontSize: '14px' },
        input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' },
        submitBtn: {
            padding: '12px 32px', backgroundColor: '#2c3e50', color: 'white',
            border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '16px',
            cursor: 'pointer', width: '100%'
        },
        backBtn: { background: 'none', border: 'none', color: '#2c3e50', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginBottom: '16px', padding: 0 },
        dateHeader: { fontSize: '14px', fontWeight: '700', color: '#2c3e50', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #eee' },
        slotBtn: (selected) => ({
            padding: '9px 15px', borderRadius: '8px',
            border: `2px solid ${selected ? '#2c3e50' : '#ddd'}`,
            backgroundColor: selected ? '#2c3e50' : '#f8f9fa',
            color: selected ? 'white' : '#333',
            cursor: 'pointer', fontWeight: '600', fontSize: '13px',
            transition: 'all 0.15s'
        })
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>;

    return (
        <div style={s.page}>
            <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Book an Appointment</h2>

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

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>

                {/* ── Left: Provider Info ── */}
                {provider && (
                    <div>
                        <div style={s.card}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '4px' }}>Provider Info</h3>
                            {provider.fullName && (
                                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '16px', color: '#2c3e50' }}>
                                    Dr. {provider.fullName}
                                </p>
                            )}
                            <span style={{
                                display: 'inline-block', padding: '3px 12px',
                                backgroundColor: '#eaf0fb', color: '#2c3e50', borderRadius: '20px',
                                fontSize: '12px', fontWeight: '600', marginBottom: '12px'
                            }}>{provider.specialization}</span>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#555' }}>
                                <div><strong>Qualification:</strong> {provider.qualification}</div>
                                <div><strong>Experience:</strong> {provider.experienceYears} years</div>
                                <div><strong>Clinic:</strong> {provider.clinicName}</div>
                                <div><strong>Address:</strong> {provider.clinicAddress}</div>
                                <div style={{ color: '#f39c12' }}>★ {provider.avgRating?.toFixed(1) || '0.0'}</div>
                                {provider.isVerified && <div style={{ color: '#27ae60', fontWeight: '600' }}>✓ Verified Provider</div>}
                            </div>
                        </div>

                        {/* Selected Slot Summary */}
                        {selectedSlot && (
                            <div style={{ ...s.card, backgroundColor: '#eafaf1', border: '1px solid #a9dfbf' }}>
                                <h4 style={{ margin: '0 0 8px 0', color: '#1e8449' }}>✅ Selected Slot</h4>
                                <p style={{ margin: 0, fontWeight: '700', color: '#2c3e50', fontSize: '15px' }}>
                                    {formatDate(selectedSlot.date)}
                                </p>
                                <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '14px' }}>
                                    {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                                    &nbsp;({selectedSlot.durationMinutes} min)
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Right: Slots + Form ── */}
                <form onSubmit={handleBook}>

                    {/* Available Slots grouped by date */}
                    <div style={s.card}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
                            Available Slots
                            {allSlots.length > 0 && (
                                <span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: 'normal', color: '#7f8c8d' }}>
                                    ({allSlots.length} slot{allSlots.length !== 1 ? 's' : ''} available)
                                </span>
                            )}
                        </h3>

                        {allSlots.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#e74c3c' }}>
                                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📅</div>
                                <p style={{ margin: 0, fontWeight: '600' }}>No available slots at the moment.</p>
                                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#7f8c8d' }}>
                                    The provider hasn't added any upcoming slots yet.
                                </p>
                            </div>
                        ) : (
                            Object.entries(groupedSlots).map(([date, slots]) => (
                                <div key={date} style={{ marginBottom: '20px' }}>
                                    <p style={s.dateHeader}>📅 {formatDate(date)}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {slots.map(slot => (
                                            <button
                                                type="button"
                                                key={slot.slotId}
                                                style={s.slotBtn(selectedSlot?.slotId === slot.slotId)}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Appointment Details */}
                    <div style={s.card}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Appointment Details</h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={s.label}>Service Type *</label>
                            <input style={s.input} placeholder="e.g. General Checkup, Consultation"
                                value={formData.serviceType}
                                onChange={e => setFormData({ ...formData, serviceType: e.target.value })} required />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={s.label}>Mode of Consultation *</label>
                            <select style={s.input} value={formData.modeOfConsultation}
                                onChange={e => setFormData({ ...formData, modeOfConsultation: e.target.value })}>
                                <option value="IN_PERSON">In Person</option>
                                <option value="TELECONSULTATION">Teleconsultation</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={s.label}>Notes (Optional)</label>
                            <textarea style={{ ...s.input, height: '80px', resize: 'none' }}
                                placeholder="Any symptoms or additional info for the doctor..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>

                        <button
                            type="submit"
                            style={{
                                ...s.submitBtn,
                                backgroundColor: (!selectedSlot || submitting) ? '#bdc3c7' : '#2c3e50',
                                cursor: (!selectedSlot || submitting) ? 'not-allowed' : 'pointer'
                            }}
                            disabled={submitting || !selectedSlot}
                        >
                            {submitting ? 'Booking...' : selectedSlot ? '✓ Confirm Appointment' : 'Select a Slot to Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookAppointment;