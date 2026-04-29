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
    const [allSlots, setAllSlots] = useState([]);
    const [groupedSlots, setGroupedSlots] = useState({});
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

            const response = await fetch(
                `http://localhost:8080/slots/provider/${providerId}?t=${Date.now()}`,
                { headers: { Authorization: `Bearer ${user.token}`, 'Cache-Control': 'no-cache' } }
            );
            const slots = await response.json();

            const today = new Date().toISOString().split('T')[0];
            const available = Array.isArray(slots)
                ? slots.filter(s =>
                    s.isBooked === false &&
                    s.isBlocked === false &&
                    s.date >= today
                )
                : [];

            available.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.startTime.localeCompare(b.startTime);
            });

            setAllSlots(available);

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

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (timeStr) => timeStr?.slice(0, 5);

    if (loading) return (
        <div className="page-content">
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        </div>
    );

    return (
        <div className="page-content">
            <button className="back-button" onClick={() => navigate('/dashboard')}>← Back</button>
            <h2 style={{ marginBottom: '20px' }}>Book an Appointment</h2>

            {message && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }} 
                     className={message.type === 'error' ? 'error-message' : 'success-message'}>
                    {message.text}
                    <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>

                {/* Left: Provider Info */}
                {provider && (
                    <div>
                        <div className="card">
                            <h4 className="card-title" style={{ marginTop: 0 }}>Healthcare Provider</h4>
                            {provider.fullName && (
                                <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0066cc', margin: '0 0 12px' }}>
                                    Dr. {provider.fullName}
                                </p>
                            )}
                            <span style={{
                                display: 'inline-block', padding: '6px 12px',
                                backgroundColor: '#e6f0ff', color: '#0066cc', borderRadius: '20px',
                                fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px'
                            }}>{provider.specialization}</span>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: '#666' }}>
                                <div><strong>Qualification:</strong> {provider.qualification}</div>
                                <div><strong>Experience:</strong> {provider.experienceYears} years</div>
                                <div><strong>Clinic:</strong> {provider.clinicName}</div>
                                <div><strong>Address:</strong> {provider.clinicAddress?.substring(0, 50)}...</div>
                                <div style={{ color: '#ffa500', fontSize: '0.95rem' }}>⭐ {provider.avgRating?.toFixed(1) || '0.0'}</div>
                                {provider.isVerified && <div style={{ color: '#00c853', fontWeight: '600', fontSize: '0.95rem' }}>✓ Verified</div>}
                            </div>
                        </div>

                        {/* Selected Slot Summary */}
                        {selectedSlot && (
                            <div className="card" style={{ backgroundColor: '#f0f9ff', border: '2px solid #0066cc' }}>
                                <h4 style={{ margin: '0 0 12px', color: '#0066cc' }}>✓ Selected Slot</h4>
                                <p style={{ margin: 0, fontWeight: '700', color: '#2c2c2c', fontSize: '1rem' }}>
                                    {formatDate(selectedSlot.date)}
                                </p>
                                <p style={{ margin: '6px 0 0', color: '#666', fontSize: '0.95rem' }}>
                                    {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                                    &nbsp;({selectedSlot.durationMinutes} min)
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Right: Slots + Form */}
                <form onSubmit={handleBook}>

                    {/* Available Slots */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 className="card-title" style={{ margin: 0 }}>
                                Available Slots
                                {allSlots.length > 0 && (
                                    <span style={{ marginLeft: '10px', fontSize: '0.85rem', fontWeight: 'normal', color: '#666' }}>
                                        ({allSlots.length} available)
                                    </span>
                                )}
                            </h4>
                            <button
                                type="button"
                                onClick={() => { setLoading(true); fetchProviderAndSlots(); }}
                                style={{ fontSize: '0.9rem', padding: '6px 12px', backgroundColor: '#00c853', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {allSlots.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📅</div>
                                <div className="empty-title">No Available Slots</div>
                                <p style={{ color: '#999' }}>The provider hasn't added upcoming slots yet. Please check back later.</p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {Object.entries(groupedSlots).map(([date, slots]) => (
                                    <div key={date} style={{ marginBottom: '20px' }}>
                                        <p className="slots-date-header">📅 {formatDate(date)}</p>
                                        <div className="slots-grid">
                                            {slots.map(slot => (
                                                <button
                                                    type="button"
                                                    key={slot.slotId}
                                                    className={`slot-button ${selectedSlot?.slotId === slot.slotId ? 'selected' : ''}`}
                                                    onClick={() => setSelectedSlot(slot)}
                                                >
                                                    {formatTime(slot.startTime)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Appointment Details Form */}
                    <div className="card">
                        <h4 className="card-title" style={{ marginTop: 0 }}>Appointment Details</h4>

                        <div className="form-group">
                            <label className="form-label">Service Type *</label>
                            <input
                                className="form-input"
                                placeholder="e.g. General Checkup, Consultation"
                                value={formData.serviceType}
                                onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mode of Consultation *</label>
                            <select
                                className="form-select"
                                value={formData.modeOfConsultation}
                                onChange={e => setFormData({ ...formData, modeOfConsultation: e.target.value })}
                            >
                                <option value="IN_PERSON">In Person</option>
                                <option value="TELECONSULTATION">Teleconsultation</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes (Optional)</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Describe your symptoms or health concerns..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                style={{ minHeight: '100px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="form-submit"
                            disabled={submitting || !selectedSlot}
                            style={{ opacity: (!selectedSlot || submitting) ? 0.6 : 1 }}
                        >
                            {submitting ? 'Booking...' : selectedSlot ? '✓ Confirm Appointment' : 'Select a Time Slot'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookAppointment;