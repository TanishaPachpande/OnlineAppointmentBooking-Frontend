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
                <div>
                    <h2 style={{ margin: 0 }}>Medical Records</h2>
                    <p style={{ color: '#666', margin: '8px 0 0', fontSize: '0.95rem' }}>
                        {records.length} record{records.length !== 1 ? 's' : ''} on file
                    </p>
                </div>
                <button onClick={() => navigate('/appointments')}
                    className="btn btn-outline">
                    ← Back to Appointments
                </button>
            </div>

            {message && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}
                     className={message.type === 'error' ? 'error-message' : 'success-message'}>
                    {message.text}
                    <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {records.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-title">No Medical Records</div>
                    <p className="empty-text">Your medical records will appear here after your doctor uploads them following an appointment.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {records.map(record => {
                        const isOpen = expandedId === record.recordId;
                        return (
                            <div key={record.recordId} className="card" style={{ cursor: 'pointer' }}>
                                <div onClick={() => setExpandedId(isOpen ? null : record.recordId)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <h4 className="card-title" style={{ margin: '0 0 6px' }}>
                                                📅 {formatDate(record.visitDate)}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#999' }}>
                                                Record #{record.recordId} • Appointment #{record.appointmentId}
                                            </p>
                                        </div>
                                        <span style={{ color: '#0066cc', fontWeight: '600', fontSize: '0.9rem' }}>
                                            {isOpen ? '▲ Hide' : '▼ Show'} Details
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        backgroundColor: '#e6f0ff',
                                        color: '#0066cc',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600'
                                    }}>
                                        🩺 {record.diagnosis?.slice(0, 60)}{record.diagnosis?.length > 60 ? '...' : ''}
                                    </div>
                                </div>

                                {isOpen && (
                                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '600', color: '#0066cc', textTransform: 'uppercase' }}>Diagnosis</p>
                                                <p style={{ margin: 0, color: '#2c2c2c', lineHeight: '1.6' }}>{record.diagnosis}</p>
                                            </div>

                                            <div style={{ gridColumn: 'span 2' }}>
                                                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '600', color: '#0066cc', textTransform: 'uppercase' }}>Prescription</p>
                                                <p style={{ margin: 0, color: '#2c2c2c', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{record.prescription}</p>
                                            </div>

                                            {record.vitals && (
                                                <div>
                                                    <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '600', color: '#00c853', textTransform: 'uppercase' }}>Vitals</p>
                                                    <p style={{ margin: 0, color: '#2c2c2c', lineHeight: '1.6' }}>{record.vitals}</p>
                                                </div>
                                            )}

                                            {record.allergies && (
                                                <div>
                                                    <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '600', color: '#d32f2f', textTransform: 'uppercase' }}>Allergies</p>
                                                    <p style={{ margin: 0, color: '#2c2c2c', lineHeight: '1.6' }}>{record.allergies}</p>
                                                </div>
                                            )}

                                            {record.labTests && (
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '600', color: '#0066cc', textTransform: 'uppercase' }}>Lab Tests</p>
                                                    <p style={{ margin: 0, color: '#2c2c2c', lineHeight: '1.6' }}>{record.labTests}</p>
                                                </div>
                                            )}

                                            {record.followUpNotes && (
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '600', color: '#00c853', textTransform: 'uppercase' }}>Follow-up Notes</p>
                                                    <p style={{ margin: 0, color: '#2c2c2c', lineHeight: '1.6' }}>{record.followUpNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyMedicalRecords;