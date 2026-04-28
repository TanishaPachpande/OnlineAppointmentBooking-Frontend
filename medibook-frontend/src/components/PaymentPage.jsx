import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import appointmentService from '../services/appointmentService';
import paymentService from '../services/paymentService';

const PaymentPage = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [appointment, setAppointment] = useState(null);
    const [existingPayment, setExistingPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        amount: '',
        mode: 'UPI',
        notes: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') { navigate('/login'); return; }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const apt = await appointmentService.getById(appointmentId);
            setAppointment(apt);
            try {
                const payment = await paymentService.getPaymentByAppointmentId(appointmentId);
                setExistingPayment(payment);
            } catch {
                // No payment yet
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to load appointment.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid amount.' });
            return;
        }
        setSubmitting(true);
        try {
            await paymentService.processPayment({
                appointmentId: parseInt(appointmentId),
                patientId: user.userId,
                amount: parseFloat(formData.amount),
                mode: formData.mode,
                notes: formData.notes
            });
            setMessage({ type: 'success', text: 'Payment successful! Redirecting...' });
            setTimeout(() => navigate('/appointments'), 1800);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Payment failed.' });
            setSubmitting(false);
        }
    };

    const statusConfig = {
        SUCCESS:  { bg: '#d4edda', color: '#155724', icon: '✅' },
        PENDING:  { bg: '#fff3cd', color: '#856404', icon: '⏳' },
        FAILED:   { bg: '#f8d7da', color: '#721c24', icon: '❌' },
        REFUNDED: { bg: '#cce5ff', color: '#004085', icon: '↩️' }
    };

    const s = {
        page: { padding: '30px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
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
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>💳 Payment</h2>

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

            {/* Appointment Summary */}
            {appointment && (
                <div style={s.card}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Appointment Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                        <div><strong>Appointment #:</strong> {appointment.appointmentId}</div>
                        <div><strong>Date:</strong> {appointment.appointmentDate}</div>
                        <div><strong>Time:</strong> {appointment.startTime?.slice(0, 5)} – {appointment.endTime?.slice(0, 5)}</div>
                        <div><strong>Service:</strong> {appointment.serviceType}</div>
                        <div><strong>Mode:</strong> {appointment.modeOfConsultation?.replace('_', ' ')}</div>
                    </div>
                </div>
            )}

            {/* Already paid */}
            {existingPayment ? (
                <div style={s.card}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Payment Status</h3>
                    {(() => {
                        const sc = statusConfig[existingPayment.status] || statusConfig.PENDING;
                        return (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '24px' }}>{sc.icon}</span>
                                    <span style={{
                                        padding: '6px 18px', borderRadius: '20px', fontWeight: '700',
                                        backgroundColor: sc.bg, color: sc.color, fontSize: '15px'
                                    }}>{existingPayment.status}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                                    <div><strong>Amount:</strong> ₹{existingPayment.amount}</div>
                                    <div><strong>Mode:</strong> {existingPayment.mode}</div>
                                    <div><strong>Transaction ID:</strong> {existingPayment.transactionId}</div>
                                    <div><strong>Currency:</strong> {existingPayment.currency}</div>
                                    {existingPayment.paidAt && <div><strong>Paid At:</strong> {new Date(existingPayment.paidAt).toLocaleString('en-IN')}</div>}
                                    {existingPayment.notes && <div style={{ gridColumn: 'span 2' }}><strong>Notes:</strong> {existingPayment.notes}</div>}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                /* Payment Form */
                <div style={s.card}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Make Payment</h3>
                    <form onSubmit={handlePayment}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={s.label}>Amount (₹) *</label>
                            <input style={s.input} type="number" min="1" step="0.01"
                                placeholder="Enter consultation fee"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={s.label}>Payment Mode *</label>
                            <select style={s.input} value={formData.mode}
                                onChange={e => setFormData({ ...formData, mode: e.target.value })}>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                                <option value="NET_BANKING">Net Banking</option>
                                <option value="WALLET">Wallet</option>
                                <option value="CASH">Cash</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={s.label}>Notes (Optional)</label>
                            <input style={s.input} placeholder="Any payment notes..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                        <button type="submit" style={s.btn} disabled={submitting}>
                            {submitting ? 'Processing...' : '✓ Pay Now'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PaymentPage;