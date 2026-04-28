import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import providerService from '../services/api';
import reviewService from '../services/reviewService';

const ReviewPage = () => {
    const { appointmentId, providerId } = useParams();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [provider, setProvider] = useState(null);
    const [existingReview, setExistingReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [hoveredStar, setHoveredStar] = useState(0);

    const [formData, setFormData] = useState({ starRating: 0, comment: '' });

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') { navigate('/login'); return; }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const pData = await providerService.getProviderById(providerId);
            setProvider(pData);
            try {
                const review = await reviewService.getReviewByAppointmentId(appointmentId);
                setExistingReview(review);
                setFormData({ starRating: review.starRating, comment: review.comment });
            } catch {
                // No review yet
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to load provider.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.starRating === 0) { setMessage({ type: 'error', text: 'Please select a star rating.' }); return; }
        if (!formData.comment.trim()) { setMessage({ type: 'error', text: 'Please write a comment.' }); return; }
        setSubmitting(true);
        try {
            await reviewService.addReview({
                appointmentId: parseInt(appointmentId),
                providerId: parseInt(providerId),
                patientId: user.userId,
                starRating: formData.starRating,
                comment: formData.comment
            });
            setMessage({ type: 'success', text: 'Review submitted successfully! Redirecting...' });
            setTimeout(() => navigate('/appointments'), 1800);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit review.' });
            setSubmitting(false);
        }
    };

    const s = {
        page: { padding: '30px', maxWidth: '560px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
        card: { background: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
        label: { display: 'block', fontWeight: '600', fontSize: '14px', color: '#34495e', marginBottom: '6px' },
        input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' },
        btn: { padding: '12px 32px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', width: '100%' }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>;

    return (
        <div style={s.page}>
            <button onClick={() => navigate('/appointments')}
                style={{ background: 'none', border: 'none', color: '#2c3e50', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginBottom: '16px', padding: 0 }}>
                ← Back to Appointments
            </button>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>⭐ Rate Your Doctor</h2>

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

            {/* Provider Info */}
            {provider && (
                <div style={s.card}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
                        {provider.fullName ? `Dr. ${provider.fullName}` : `Provider #${provider.providerId}`}
                    </h3>
                    <span style={{ display: 'inline-block', padding: '3px 12px', backgroundColor: '#eaf0fb', color: '#2c3e50', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {provider.specialization}
                    </span>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '10px' }}>
                        <div>🏥 {provider.clinicName}</div>
                        <div>📍 {provider.clinicAddress}</div>
                    </div>
                </div>
            )}

            {/* Already reviewed */}
            {existingReview ? (
                <div style={s.card}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Your Review</h3>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} style={{ fontSize: '28px', color: star <= existingReview.starRating ? '#f39c12' : '#ddd' }}>★</span>
                        ))}
                        <span style={{ marginLeft: '8px', fontSize: '16px', color: '#555', alignSelf: 'center' }}>
                            {existingReview.starRating}/5
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', color: '#333', lineHeight: '1.6' }}>{existingReview.comment}</p>
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                        Submitted on {new Date(existingReview.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            ) : (
                /* Review Form */
                <div style={s.card}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Write a Review</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={s.label}>Star Rating *</label>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star}
                                        style={{ fontSize: '36px', cursor: 'pointer', color: star <= (hoveredStar || formData.starRating) ? '#f39c12' : '#ddd', transition: 'color 0.1s' }}
                                        onMouseEnter={() => setHoveredStar(star)}
                                        onMouseLeave={() => setHoveredStar(0)}
                                        onClick={() => setFormData({ ...formData, starRating: star })}>
                                        ★
                                    </span>
                                ))}
                                {formData.starRating > 0 && (
                                    <span style={{ marginLeft: '8px', fontSize: '14px', color: '#555', alignSelf: 'center' }}>
                                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][formData.starRating]}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={s.label}>Your Comment *</label>
                            <textarea style={{ ...s.input, height: '100px', resize: 'vertical' }}
                                placeholder="Share your experience with this doctor..."
                                value={formData.comment}
                                onChange={e => setFormData({ ...formData, comment: e.target.value })} required />
                        </div>
                        <button type="submit" style={s.btn} disabled={submitting || formData.starRating === 0}>
                            {submitting ? 'Submitting...' : '✓ Submit Review'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ReviewPage;