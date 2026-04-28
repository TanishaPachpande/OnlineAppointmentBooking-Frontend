import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

const Notifications = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotificationsByUser(user.userId);
            // Newest first
            const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(sorted);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load notifications.' });
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '—';
        return new Date(dateTimeStr).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const statusConfig = {
        SENT:    { bg: '#d4edda', color: '#155724', icon: '✅' },
        PENDING: { bg: '#fff3cd', color: '#856404', icon: '⏳' },
        FAILED:  { bg: '#f8d7da', color: '#721c24', icon: '❌' }
    };

    const s = {
        page: { padding: '30px', maxWidth: '860px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
        card: {
            background: 'white', borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '12px',
            padding: '18px 20px', borderLeft: '4px solid #2c3e50'
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>;

    return (
        <div style={s.page}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ color: '#2c3e50', margin: 0 }}>🔔 Notifications</h2>
                    <p style={{ color: '#7f8c8d', margin: '4px 0 0 0', fontSize: '14px' }}>
                        {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '12px 16px', borderRadius: '6px', marginBottom: '20px',
                    backgroundColor: '#f8d7da', color: '#721c24',
                    display: 'flex', justifyContent: 'space-between'
                }}>
                    {message.text}
                    <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {notifications.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '10px', padding: '60px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                    <p style={{ margin: 0, fontWeight: '600' }}>No notifications yet.</p>
                    <p style={{ fontSize: '14px', margin: '6px 0 0 0' }}>
                        You'll receive email notifications when you book, cancel or reschedule appointments.
                    </p>
                </div>
            ) : (
                notifications.map(n => {
                    const sc = statusConfig[n.status] || statusConfig.PENDING;
                    return (
                        <div key={n.notificationId} style={s.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#2c3e50' }}>
                                            {n.subject}
                                        </span>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: '20px', fontSize: '11px',
                                            fontWeight: '700', backgroundColor: sc.bg, color: sc.color
                                        }}>
                                            {sc.icon} {n.status}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555', lineHeight: '1.5' }}>
                                        {n.message}
                                    </p>
                                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                        📧 Sent to: <strong>{n.recipient}</strong>
                                        &nbsp;&nbsp;·&nbsp;&nbsp;
                                        🕐 {formatDateTime(n.createdAt)}
                                        {n.sentAt && (
                                            <span>&nbsp;&nbsp;·&nbsp;&nbsp;Delivered: {formatDateTime(n.sentAt)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default Notifications;