import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import providerService from '../services/api';
import authService from '../services/authService';

const CLOUDINARY_UPLOAD_PRESET = 'documents_upload';
const CLOUDINARY_CLOUD_NAME    = 'dvgffcdwp';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ProviderSetup = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // 'loading' | 'NONE' | 'PENDING' | 'REJECTED' | 'APPROVED'
    const [profileStatus, setProfileStatus] = useState('loading');
    const [rejectedNote,  setRejectedNote]  = useState('');

    useEffect(() => {
        if (!user || user.role !== 'PROVIDER') { navigate('/login'); return; }
        checkExistingProfile();
    }, []);

    const checkExistingProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/providers/user/${user.userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const status = res.data?.verificationStatus;
            if (status === 'APPROVED') {
                navigate('/manage-slots');
            } else if (status === 'PENDING') {
                setProfileStatus('PENDING');
            } else if (status === 'REJECTED') {
                setRejectedNote(res.data?.verificationNote || '');
                setProfileStatus('REJECTED');
            } else {
                setProfileStatus('NONE');
            }
        } catch {
            setProfileStatus('NONE');
        }
    };

    const [formData, setFormData] = useState({
        userId: user?.userId,
        fullName: user?.fullName || '',
        specialization: '',
        qualification: '',
        experienceYears: 0,
        bio: '',
        clinicName: '',
        clinicAddress: '',
        verificationDocumentUrl: '',
        profilePhotoUrl: '',          // ── NEW ──
    });

    const [uploading,      setUploading]      = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false); // ── NEW ──
    const [photoPreview,   setPhotoPreview]   = useState(null);  // ── NEW ──
    const [submitted,      setSubmitted]      = useState(false);
    const [error,          setError]          = useState('');

    // ── Upload verification document to Cloudinary ────────────────────────────
    const handleDocChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp','image/gif'];
        if (!allowed.includes(file.type)) {
            setError(`File type "${file.type}" not accepted. Use PDF, JPG, PNG, or WEBP.`); return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File must be under 5 MB.'); return;
        }
        setError('');
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            const res  = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
                { method: 'POST', body: data }
            );
            const json = await res.json();
            if (json.secure_url) {
                setFormData(prev => ({ ...prev, verificationDocumentUrl: json.secure_url }));
            } else {
                setError(`Upload failed: ${json.error?.message || JSON.stringify(json)}`);
            }
        } catch (err) {
            setError(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // ── NEW: Upload profile photo to Cloudinary ───────────────────────────────
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedPhoto = ['image/jpeg','image/jpg','image/png','image/webp'];
        if (!allowedPhoto.includes(file.type)) {
            setError('Profile photo must be JPG, PNG, or WEBP.'); return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setError('Profile photo must be under 3 MB.'); return;
        }
        setError('');

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = ev => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);

        setUploadingPhoto(true);
        try {
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            const res  = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: data }
            );
            const json = await res.json();
            if (json.secure_url) {
                setFormData(prev => ({ ...prev, profilePhotoUrl: json.secure_url }));
            } else {
                setError(`Photo upload failed: ${json.error?.message || JSON.stringify(json)}`);
                setPhotoPreview(null);
            }
        } catch (err) {
            setError(`Photo upload failed: ${err.message}`);
            setPhotoPreview(null);
        } finally {
            setUploadingPhoto(false);
        }
    };
    // ─────────────────────────────────────────────────────────────────────────

    // ── Submit registration ───────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.verificationDocumentUrl) {
            setError('Please upload your verification document before submitting.'); return;
        }
        setError('');
        try {
            await providerService.registerProvider({
                ...formData,
                experienceYears: parseInt(formData.experienceYears),
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SCREENS
    // ─────────────────────────────────────────────────────────────────────────

    if (profileStatus === 'loading') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                    <p>Checking your profile status…</p>
                </div>
            </div>
        );
    }

    if (submitted || profileStatus === 'PENDING') {
        return (
            <div style={s.container}>
                <div style={{ ...s.card, textAlign: 'center', padding: '50px 40px' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
                    <h2 style={{ color: '#1e40af', marginBottom: 12 }}>
                        {submitted ? 'Application Submitted!' : 'Verification Pending'}
                    </h2>
                    <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
                        Your provider profile and credential document have been submitted.
                        An admin will review them and approve your account shortly.
                        <br /><br />
                        You will be able to manage your schedule and see patients
                        <strong> only after approval</strong>.
                    </p>
                    <div style={{
                        background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10,
                        padding: '14px 20px', color: '#854d0e', fontSize: 14, fontWeight: 600,
                        maxWidth: 400, margin: '0 auto'
                    }}>
                        🔒 Account is <strong>inactive</strong> until the admin approves your documents.
                    </div>
                </div>
            </div>
        );
    }

    if (profileStatus === 'REJECTED') {
        return (
            <div style={s.container}>
                <div style={{ ...s.card, textAlign: 'center', padding: '50px 40px' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
                    <h2 style={{ color: '#dc2626', marginBottom: 12 }}>Application Rejected</h2>
                    <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 16px' }}>
                        Unfortunately your provider application was not approved by the admin.
                    </p>
                    {rejectedNote && (
                        <div style={{
                            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10,
                            padding: '14px 20px', color: '#7f1d1d', fontSize: 14,
                            maxWidth: 420, margin: '0 auto 24px', textAlign: 'left'
                        }}>
                            <strong>Admin note:</strong><br />
                            {rejectedNote}
                        </div>
                    )}
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                        Please fix the issue mentioned above and re-register with a correct document.
                    </p>
                    <button
                        onClick={() => setProfileStatus('NONE')}
                        style={{
                            padding: '11px 28px', background: '#1e40af', color: 'white',
                            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
                            cursor: 'pointer'
                        }}>
                        🔄 Re-submit Application
                    </button>
                </div>
            </div>
        );
    }

    // ── Registration form (profileStatus === 'NONE') ──────────────────────────
    return (
        <div style={s.container}>
            <div style={s.card}>
                <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: 4 }}>
                    Provider Registration
                </h2>
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 24 }}>
                    Fill in your professional details and upload a credential document.
                    Your account will be reviewed by an admin before activation.
                </p>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
                        padding: '10px 16px', color: '#b91c1c', fontSize: 14, marginBottom: 16 }}>
                        ⚠ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* ── NEW: Profile Photo Upload ── */}
                    <div style={{
                        ...s.group,
                        background: '#f8fafc',
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: 12,
                        padding: '20px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                    }}>
                        {/* Avatar preview */}
                        <div style={{
                            width: 90, height: 90, borderRadius: '50%',
                            background: photoPreview ? 'transparent' : '#e2e8f0',
                            border: '3px solid #cbd5e1',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, color: '#94a3b8',
                        }}>
                            {photoPreview
                                ? <img src={photoPreview} alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : '👤'
                            }
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ ...s.label, color: '#334155', marginBottom: 6 }}>
                                📸 Profile Photo <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 12 }}>(optional)</span>
                            </label>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
                                JPG, PNG, or WEBP — max 3 MB. Shown to patients when browsing doctors.
                            </p>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handlePhotoChange}
                                style={{ fontSize: 13 }}
                            />
                            {uploadingPhoto && (
                                <p style={{ color: '#0369a1', fontSize: 13, marginTop: 6 }}>
                                    ⏳ Uploading photo…
                                </p>
                            )}
                            {formData.profilePhotoUrl && !uploadingPhoto && (
                                <p style={{ color: '#16a34a', fontSize: 13, marginTop: 6 }}>
                                    ✅ Photo uploaded successfully.
                                </p>
                            )}
                        </div>
                    </div>
                    {/* ── END: Profile Photo ── */}

                    <div style={s.group}>
                        <label style={s.label}>Full Name</label>
                        <input type="text" style={s.readOnly} value={formData.fullName} readOnly />
                        <small style={{ color: '#7f8c8d', fontSize: 12 }}>Pulled from your account</small>
                    </div>

                    <div style={s.group}>
                        <label style={s.label}>Specialization</label>
                        <input type="text" style={s.input} placeholder="e.g. Cardiologist" required
                            onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                    </div>

                    <div style={s.group}>
                        <label style={s.label}>Qualification</label>
                        <input type="text" style={s.input} placeholder="e.g. MBBS, MD" required
                            onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
                        <div style={{ flex: 1 }}>
                            <label style={s.label}>Experience (Years)</label>
                            <input type="number" style={s.input} min="0" required
                                onChange={e => setFormData({ ...formData, experienceYears: e.target.value })} />
                        </div>
                        <div style={{ flex: 2 }}>
                            <label style={s.label}>Clinic Name</label>
                            <input type="text" style={s.input} required
                                onChange={e => setFormData({ ...formData, clinicName: e.target.value })} />
                        </div>
                    </div>

                    <div style={s.group}>
                        <label style={s.label}>Clinic Address</label>
                        <input type="text" style={s.input} required
                            onChange={e => setFormData({ ...formData, clinicAddress: e.target.value })} />
                    </div>

                    <div style={s.group}>
                        <label style={s.label}>Short Bio</label>
                        <textarea rows="4" style={{ ...s.input, resize: 'none' }} required
                            placeholder="Tell patients about your expertise..."
                            onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                    </div>

                    {/* ── Verification Document ── */}
                    <div style={{
                        ...s.group, background: '#f0f9ff',
                        border: '1.5px dashed #38bdf8', borderRadius: 10, padding: '18px 16px'
                    }}>
                        <label style={{ ...s.label, color: '#0369a1' }}>
                            📄 Verification Document <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 10px' }}>
                            Upload your <strong>medical registration certificate, degree certificate,
                            or government-issued professional licence</strong>. Accepted: PDF, JPG, PNG, WEBP (max 5 MB).
                        </p>

                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={handleDocChange} style={{ fontSize: 13 }} />

                        {uploading && (
                            <p style={{ color: '#0369a1', fontSize: 13, marginTop: 8 }}>
                                ⏳ Uploading document…
                            </p>
                        )}
                        {formData.verificationDocumentUrl && !uploading && (
                            <p style={{ color: '#16a34a', fontSize: 13, marginTop: 8 }}>
                                ✅ Document uploaded.{' '}
                                <a href={formData.verificationDocumentUrl} target="_blank"
                                    rel="noreferrer" style={{ color: '#0369a1' }}>Preview</a>
                            </p>
                        )}
                    </div>

                    <button type="submit" disabled={uploading || uploadingPhoto} style={{
                        width: '100%', padding: 12,
                        backgroundColor: (uploading || uploadingPhoto) ? '#94a3b8' : '#1e40af',
                        color: 'white', border: 'none', borderRadius: 6,
                        cursor: (uploading || uploadingPhoto) ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold', marginTop: 10, fontSize: 15
                    }}>
                        {uploading || uploadingPhoto ? 'Uploading…' : '🚀 Submit for Admin Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const s = {
    container: {
        padding: '40px 20px', backgroundColor: '#f4f7f6',
        minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
    },
    card: {
        background: 'white', padding: 30, borderRadius: 12,
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: 620
    },
    group: { marginBottom: 15 },
    label: { display: 'block', fontWeight: 'bold', marginBottom: 5, color: '#333' },
    input: {
        width: '100%', padding: 10, borderRadius: 6,
        border: '1px solid #ddd', boxSizing: 'border-box', fontSize: 14
    },
    readOnly: {
        width: '100%', padding: 10, borderRadius: 6,
        border: '1px solid #ddd', boxSizing: 'border-box',
        backgroundColor: '#f8f9fa', color: '#6c757d', fontSize: 14
    }
};

export default ProviderSetup;