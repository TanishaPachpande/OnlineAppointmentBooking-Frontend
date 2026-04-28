import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import recordService from '../services/recordService';

const MyMedicalRecords = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') { navigate('/login'); return; }
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const data = await recordService.getRecordsByPatient(user.userId);
            // Sort newest first
            const sorted = [...data].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
            setRecords(sorted);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load medical records.' });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const s = {
        page: { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
        card: {
            background: 'white', borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px', overflow: 'hidden'
        },
        header: {
            padding: '18px 20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #2c3e50'
        },
        expandBtn: {
            background: 'none', border: '1px solid #ddd', borderRadius: '6px',
            padding: '4px 12px', cursor: 'pointer', fontSize: '13px', color: '#555'
        },
        detailGrid: {
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
            padding: '20px', borderTop: '1px solid #eee', backgroundColor: '#fafafa'
        },
        detailBlock: { display: 'flex', flexDirection: 'column', gap: '4px' },
        detailLabel: { fontSize: '12px', fontWeight: '700', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px' },
        detailValue: { fontSize: '14px', color: '#2c3e50', lineHeight: '1.5' },
        badge: (color) => ({
            display: 'inline-block', padding: '3px 12px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '600', backgroundColor: color + '22', color: color
        })
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>;

    return (
        <div style={s.page}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ color: '#2c3e50', margin: 0 }}>My Medical Records</h2>
                    <p style={{ color: '#7f8c8d', margin: '4px 0 0 0', fontSize: '14px' }}>
                        {records.length} record{records.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                <button onClick={() => navigate('/appointments')}
                    style={{ padding: '8px 18px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                    ← Appointments
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

            {records.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '10px', padding: '60px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <p style={{ margin: 0, fontWeight: '600' }}>No medical records yet.</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Records will appear here after your doctor adds them post-appointment.</p>
                </div>
            ) : (
                records.map(record => {
                    const isOpen = expandedId === record.recordId;
                    return (
                        <div key={record.recordId} style={s.card}>
                            <div style={s.header} onClick={() => setExpandedId(isOpen ? null : record.recordId)}>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#2c3e50', fontSize: '15px' }}>
                                        📅 {formatDate(record.visitDate)}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '4px' }}>
                                        Record #{record.recordId} &nbsp;·&nbsp; Appointment #{record.appointmentId}
                                    </div>
                                    <div style={{ marginTop: '6px' }}>
                                        <span style={s.badge('#2980b9')}>🩺 {record.diagnosis?.slice(0, 60)}{record.diagnosis?.length > 60 ? '...' : ''}</span>
                                    </div>
                                </div>
                                <button style={s.expandBtn}>{isOpen ? '▲ Hide' : '▼ View Details'}</button>
                            </div>

                            {isOpen && (
                                <div style={s.detailGrid}>
                                    <div style={{ ...s.detailBlock, gridColumn: 'span 2' }}>
                                        <span style={s.detailLabel}>Diagnosis</span>
                                        <span style={s.detailValue}>{record.diagnosis}</span>
                                    </div>
                                    <div style={{ ...s.detailBlock, gridColumn: 'span 2' }}>
                                        <span style={s.detailLabel}>Prescription</span>
                                        <span style={{ ...s.detailValue, whiteSpace: 'pre-wrap' }}>{record.prescription}</span>
                                    </div>
                                    {record.vitals && (
                                        <div style={s.detailBlock}>
                                            <span style={s.detailLabel}>Vitals</span>
                                            <span style={s.detailValue}>{record.vitals}</span>
                                        </div>
                                    )}
                                    {record.allergies && (
                                        <div style={s.detailBlock}>
                                            <span style={s.detailLabel}>Allergies</span>
                                            <span style={{ ...s.detailValue, color: '#e74c3c' }}>{record.allergies}</span>
                                        </div>
                                    )}
                                    {record.labTests && (
                                        <div style={{ ...s.detailBlock, gridColumn: 'span 2' }}>
                                            <span style={s.detailLabel}>Lab Tests</span>
                                            <span style={s.detailValue}>{record.labTests}</span>
                                        </div>
                                    )}
                                    {record.followUpNotes && (
                                        <div style={{ ...s.detailBlock, gridColumn: 'span 2' }}>
                                            <span style={s.detailLabel}>Follow-up Notes</span>
                                            <span style={{ ...s.detailValue, color: '#27ae60' }}>{record.followUpNotes}</span>
                                        </div>
                                    )}
                                    <div style={s.detailBlock}>
                                        <span style={s.detailLabel}>Visit Date</span>
                                        <span style={s.detailValue}>{formatDate(record.visitDate)}</span>
                                    </div>
                                    <div style={s.detailBlock}>
                                        <span style={s.detailLabel}>Provider ID</span>
                                        <span style={s.detailValue}>#{record.providerId}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default MyMedicalRecords;