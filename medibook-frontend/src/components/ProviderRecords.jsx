import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import providerService from '../services/api';
import appointmentService from '../services/appointmentService';
import recordService from '../services/recordService';

const ProviderRecords = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [providerData, setProviderData] = useState(null);
    const [completedAppointments, setCompletedAppointments] = useState([]);
    const [existingRecords, setExistingRecords] = useState({});  // appointmentId -> record
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    // Form state
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        diagnosis: '', prescription: '', labTests: '',
        followUpNotes: '', allergies: '', vitals: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'PROVIDER') { navigate('/login'); return; }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const pData = await providerService.getProviderByUserId(user.userId);
            setProviderData(pData);

            const allApts = await appointmentService.getByProvider(pData.providerId);
            const completed = allApts.filter(a => a.status === 'COMPLETED');
            setCompletedAppointments(completed);

            // For each completed appointment, try to fetch existing record
            const recordMap = {};
            await Promise.all(completed.map(async (apt) => {
                try {
                    const rec = await recordService.getRecordByAppointmentId(apt.appointmentId);
                    recordMap[apt.appointmentId] = rec;
                } catch {
                    // No record yet — that's fine
                }
            }));
            setExistingRecords(recordMap);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load data.' });
        } finally {
            setLoading(false);
        }
    };

    const openCreateForm = (apt) => {
        setSelectedAppointment(apt);
        setEditingRecordId(null);
        setFormData({ diagnosis: '', prescription: '', labTests: '', followUpNotes: '', allergies: '', vitals: '' });
    };

    const openEditForm = (apt, record) => {
        setSelectedAppointment(apt);
        setEditingRecordId(record.recordId);
        setFormData({
            diagnosis: record.diagnosis || '',
            prescription: record.prescription || '',
            labTests: record.labTests || '',
            followUpNotes: record.followUpNotes || '',
            allergies: record.allergies || '',
            vitals: record.vitals || ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.diagnosis.trim() || !formData.prescription.trim()) {
            setMessage({ type: 'error', text: 'Diagnosis and Prescription are required.' });
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                appointmentId: selectedAppointment.appointmentId,
                patientId: selectedAppointment.patientId,
                providerId: providerData.providerId,
                visitDate: selectedAppointment.appointmentDate,
                ...formData
            };

            if (editingRecordId) {
                await recordService.updateRecord(editingRecordId, payload);
                setMessage({ type: 'success', text: 'Medical record updated successfully!' });
            } else {
                await recordService.createRecord(payload);
                setMessage({ type: 'success', text: 'Medical record created successfully!' });
            }

            setSelectedAppointment(null);
            setEditingRecordId(null);
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save record.' });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const s = {
        page: { padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
        card: { background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px' },
        row: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderLeft: '4px solid #27ae60'
        },
        btn: (color) => ({
            padding: '6px 14px', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontWeight: '600', fontSize: '13px',
            backgroundColor: color, color: 'white'
        }),
        input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
        label: { display: 'block', fontWeight: '600', fontSize: '13px', color: '#34495e', marginBottom: '5px' },
        modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
        modalBox: { background: 'white', padding: '28px', borderRadius: '12px', width: '640px', maxWidth: '95vw', maxHeight: '88vh', overflowY: 'auto' }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>;

    return (
        <div style={s.page}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ color: '#2c3e50', margin: 0 }}>Patient Medical Records</h2>
                    <p style={{ color: '#7f8c8d', margin: '4px 0 0 0', fontSize: '14px' }}>
                        Dr. {user?.fullName} · {completedAppointments.length} completed appointment{completedAppointments.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={() => navigate('/provider-appointments')}
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

            {completedAppointments.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '10px', padding: '60px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <p>No completed appointments yet. Records can be added after appointments are marked complete.</p>
                </div>
            ) : (
                <>
                    <div style={{ background: 'white', borderRadius: '10px', padding: '14px 20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', gap: '24px', fontSize: '14px' }}>
                        <span>✅ <strong>{Object.keys(existingRecords).length}</strong> Records Added</span>
                        <span>⏳ <strong>{completedAppointments.length - Object.keys(existingRecords).length}</strong> Pending</span>
                    </div>

                    {completedAppointments.map(apt => {
                        const record = existingRecords[apt.appointmentId];
                        return (
                            <div key={apt.appointmentId} style={s.card}>
                                <div style={s.row}>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#2c3e50' }}>
                                            Appointment #{apt.appointmentId} &nbsp;·&nbsp;
                                            <span style={{ fontWeight: '400', color: '#555' }}>Patient ID: {apt.patientId}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '4px' }}>
                                            📅 {formatDate(apt.appointmentDate)} &nbsp;·&nbsp;
                                            ⏰ {apt.startTime?.slice(0, 5)} – {apt.endTime?.slice(0, 5)} &nbsp;·&nbsp;
                                            🩺 {apt.serviceType}
                                        </div>
                                        {record && (
                                            <div style={{ marginTop: '6px', fontSize: '13px', color: '#27ae60', fontWeight: '600' }}>
                                                ✓ Record #{record.recordId} saved
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {record ? (
                                            <button style={s.btn('#f39c12')} onClick={() => openEditForm(apt, record)}>
                                                Edit Record
                                            </button>
                                        ) : (
                                            <button style={s.btn('#27ae60')} onClick={() => openCreateForm(apt)}>
                                                + Add Record
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            {/* Create/Edit Modal */}
            {selectedAppointment && (
                <div style={s.modal}>
                    <div style={s.modalBox}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
                            {editingRecordId ? 'Edit' : 'Create'} Medical Record
                        </h3>
                        <p style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '-12px', marginBottom: '20px' }}>
                            Appointment #{selectedAppointment.appointmentId} &nbsp;·&nbsp; {formatDate(selectedAppointment.appointmentDate)}
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={s.label}>Diagnosis *</label>
                                    <textarea style={{ ...s.input, height: '80px', resize: 'vertical' }}
                                        placeholder="Primary diagnosis and findings..."
                                        value={formData.diagnosis}
                                        onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} required />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={s.label}>Prescription *</label>
                                    <textarea style={{ ...s.input, height: '80px', resize: 'vertical' }}
                                        placeholder="Medications, dosage, duration..."
                                        value={formData.prescription}
                                        onChange={e => setFormData({ ...formData, prescription: e.target.value })} required />
                                </div>

                                <div>
                                    <label style={s.label}>Vitals</label>
                                    <input style={s.input} placeholder="BP, Pulse, Temp, SpO2..."
                                        value={formData.vitals}
                                        onChange={e => setFormData({ ...formData, vitals: e.target.value })} />
                                </div>

                                <div>
                                    <label style={s.label}>Allergies</label>
                                    <input style={s.input} placeholder="Known allergies..."
                                        value={formData.allergies}
                                        onChange={e => setFormData({ ...formData, allergies: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={s.label}>Lab Tests</label>
                                    <textarea style={{ ...s.input, height: '60px', resize: 'vertical' }}
                                        placeholder="Tests ordered or results..."
                                        value={formData.labTests}
                                        onChange={e => setFormData({ ...formData, labTests: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={s.label}>Follow-up Notes</label>
                                    <textarea style={{ ...s.input, height: '60px', resize: 'vertical' }}
                                        placeholder="Next visit instructions, lifestyle advice..."
                                        value={formData.followUpNotes}
                                        onChange={e => setFormData({ ...formData, followUpNotes: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" disabled={submitting}
                                    style={{ padding: '10px 28px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                    {submitting ? 'Saving...' : editingRecordId ? 'Update Record' : 'Save Record'}
                                </button>
                                <button type="button" onClick={() => setSelectedAppointment(null)}
                                    style={{ padding: '10px 20px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderRecords;