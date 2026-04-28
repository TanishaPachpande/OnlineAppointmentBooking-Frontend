import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import providerService from '../services/api';
import authService from '../services/authService';

const ProviderSetup = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user || user.role !== 'PROVIDER') {
            navigate('/login');
        }
    }, [user, navigate]);

    const [formData, setFormData] = useState({
        userId: user?.userId,
        fullName: user?.fullName || '',   // ← pulled automatically from auth token
        specialization: '',
        qualification: '',
        experienceYears: 0,
        bio: '',
        clinicName: '',
        clinicAddress: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                experienceYears: parseInt(formData.experienceYears)
            };
            const response = await providerService.registerProvider(dataToSend);
            console.log("Success:", response);
            alert("Profile saved successfully!");
            navigate('/manage-slots');
        } catch (error) {
            console.error("Submission error:", error.response?.data || error.message);
            alert("Error: " + (error.response?.data?.message || "Something went wrong"));
        }
    };

    const styles = {
        container: { padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', justifyContent: 'center' },
        card: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '600px' },
        group: { marginBottom: '15px' },
        label: { display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' },
        input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' },
        readOnly: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', backgroundColor: '#f8f9fa', color: '#6c757d' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>Professional Details</h2>
                <form onSubmit={handleSubmit}>

                    {/* Full Name — pre-filled from auth, read-only */}
                    <div style={styles.group}>
                        <label style={styles.label}>Full Name</label>
                        <input type="text" style={styles.readOnly} value={formData.fullName} readOnly />
                        <small style={{ color: '#7f8c8d', fontSize: '12px' }}>Pulled from your account</small>
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Specialization</label>
                        <input type="text" style={styles.input} placeholder="e.g. Cardiologist" required
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Qualification</label>
                        <input type="text" style={styles.input} placeholder="e.g. MBBS, MD" required
                            onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Experience (Years)</label>
                            <input type="number" style={styles.input} required
                                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })} />
                        </div>
                        <div style={{ flex: 2 }}>
                            <label style={styles.label}>Clinic Name</label>
                            <input type="text" style={styles.input} required
                                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })} />
                        </div>
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Clinic Address</label>
                        <input type="text" style={styles.input} required
                            onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })} />
                    </div>

                    <div style={styles.group}>
                        <label style={styles.label}>Short Bio</label>
                        <textarea rows="4" style={{ ...styles.input, resize: 'none' }} required
                            placeholder="Tell patients about your expertise..."
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
                    </div>

                    <button type="submit" style={{
                        width: '100%', padding: '12px', backgroundColor: '#2c3e50',
                        color: 'white', border: 'none', borderRadius: '4px',
                        cursor: 'pointer', fontWeight: 'bold', marginTop: '10px'
                    }}>
                        Complete Setup
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProviderSetup;