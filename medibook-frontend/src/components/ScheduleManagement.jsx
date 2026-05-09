import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import providerService from '../services/api';
import authService from '../services/authService';

const SLOT_TYPES = { SINGLE: 'single', BULK: 'bulk', RECURRING: 'recurring' };

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .sm-root * { box-sizing: border-box; }
  .sm-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f0f4f8;
    min-height: 100vh;
    padding: 32px 24px;
  }

  /* Page Header */
  .sm-header {
    max-width: 1100px;
    margin: 0 auto 28px;
  }
  .sm-header h2 {
    margin: 0 0 4px;
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .sm-header p {
    margin: 0;
    font-size: 14px;
    color: #64748b;
  }

  /* Toast */
  .sm-toast {
    max-width: 1100px;
    margin: 0 auto 20px;
    padding: 14px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sm-toast.success { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
  .sm-toast.error   { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }
  .sm-toast button  { background: none; border: none; cursor: pointer; font-size: 16px; color: inherit; }

  /* Grid Layout */
  .sm-grid {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 24px;
    align-items: start;
  }

  /* Card */
  .sm-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .sm-card-header {
    padding: 20px 24px 0;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .sm-card-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .sm-card-body { padding: 0 24px 24px; }

  /* Profile Info */
  .sm-info-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f8fafc;
    font-size: 14px;
  }
  .sm-info-row:last-child { border-bottom: none; }
  .sm-info-label {
    font-weight: 600;
    color: #64748b;
    min-width: 110px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding-top: 1px;
  }
  .sm-info-value { color: #1e293b; font-weight: 500; }

  /* Status Badge */
  .sm-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }
  .sm-badge-online  { background: #dcfce7; color: #16a34a; }
  .sm-badge-offline { background: #fee2e2; color: #dc2626; }
  .sm-badge-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .sm-badge-online  .sm-badge-dot  { background: #16a34a; }
  .sm-badge-offline .sm-badge-dot  { background: #dc2626; }

  /* Action Buttons */
  .sm-btn {
    width: 100%;
    padding: 11px 18px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 10px;
    letter-spacing: 0.2px;
  }
  .sm-btn:last-child { margin-bottom: 0; }
  .sm-btn-primary   { background: #1e40af; color: #fff; }
  .sm-btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
  .sm-btn-secondary { background: #f1f5f9; color: #475569; }
  .sm-btn-secondary:hover { background: #e2e8f0; }
  .sm-btn-danger    { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .sm-btn-danger:hover { background: #fee2e2; }
  .sm-btn:disabled  { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* Slot Tabs */
  .sm-tabs {
    display: flex;
    background: #f1f5f9;
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 22px;
    gap: 2px;
  }
  .sm-tab {
    flex: 1;
    padding: 9px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: #64748b;
    transition: all 0.15s;
  }
  .sm-tab.active {
    background: #fff;
    color: #1e40af;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }

  /* Form Fields */
  .sm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .sm-form-grid.cols-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .sm-field { display: flex; flex-direction: column; gap: 6px; }
  .sm-field.full { grid-column: span 2; }
  .sm-label {
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .sm-input {
    padding: 10px 13px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
    transition: border-color 0.15s;
    width: 100%;
    font-family: inherit;
  }
  .sm-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

  /* Slot Form Submit */
  .sm-submit {
    margin-top: 20px;
    padding: 12px 28px;
    background: #1e40af;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
    font-family: inherit;
  }
  .sm-submit:hover { background: #1d4ed8; }
  .sm-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Bulk Row */
  .sm-bulk-row {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
  }
  .sm-bulk-row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 700;
    color: #475569;
  }
  .sm-btn-remove {
    padding: 4px 12px;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
  }
  .sm-add-row {
    padding: 9px 18px;
    background: #ecfdf5;
    color: #16a34a;
    border: 1px solid #6ee7b7;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    margin-right: 10px;
    font-family: inherit;
  }

  /* Slots Table */
  .sm-slots-header {
    padding: 20px 24px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
  }
  .sm-slots-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }
  .sm-slots-count {
    background: #eff6ff;
    color: #1e40af;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    margin-left: 8px;
  }
  .sm-refresh {
    padding: 8px 16px;
    background: #f0fdf4;
    color: #16a34a;
    border: 1.5px solid #86efac;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    transition: all 0.15s;
  }
  .sm-refresh:hover { background: #dcfce7; }

  /* Table */
  .sm-table { width: 100%; border-collapse: collapse; }
  .sm-table th {
    padding: 12px 20px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #94a3b8;
    background: #f8fafc;
  }
  .sm-table td {
    padding: 14px 20px;
    border-top: 1px solid #f1f5f9;
    font-size: 14px;
    color: #1e293b;
  }
  .sm-table tr:hover td { background: #fafbfc; }

  .sm-slot-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }
  .sm-slot-available { background: #dcfce7; color: #15803d; }
  .sm-slot-blocked   { background: #fef9c3; color: #a16207; }
  .sm-slot-booked    { background: #fee2e2; color: #b91c1c; }
  .sm-slot-expired   { background: #f1f5f9; color: #64748b; }
  .sm-slot-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .sm-slot-available .sm-slot-dot { background: #15803d; }
  .sm-slot-blocked   .sm-slot-dot { background: #a16207; }
  .sm-slot-booked    .sm-slot-dot { background: #b91c1c; }
  .sm-slot-expired   .sm-slot-dot { background: #94a3b8; }

  .sm-action-block {
    padding: 5px 13px; background: #fffbeb; color: #d97706;
    border: 1px solid #fde68a; border-radius: 6px;
    cursor: pointer; font-size: 12px; font-weight: 700;
    margin-right: 6px; font-family: inherit;
  }
  .sm-action-delete {
    padding: 5px 13px; background: #fef2f2; color: #dc2626;
    border: 1px solid #fecaca; border-radius: 6px;
    cursor: pointer; font-size: 12px; font-weight: 700;
    font-family: inherit;
  }
  .sm-empty {
    padding: 48px;
    text-align: center;
    color: #94a3b8;
  }
  .sm-empty-icon { font-size: 40px; margin-bottom: 10px; }
  .sm-empty p { margin: 0; font-size: 14px; font-weight: 500; }

  /* Edit Form */
  .sm-edit-section {
    max-width: 1100px;
    margin: 0 auto 24px;
  }
  .sm-edit-form { padding: 24px; }

  /* Loading */
  .sm-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
    gap: 12px;
    color: #64748b;
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .sm-spinner {
    width: 24px; height: 24px;
    border: 3px solid #e2e8f0;
    border-top-color: #1e40af;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ScheduleManagement = () => {
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({
    specialization: '', qualification: '', experienceYears: 0,
    bio: '', clinicName: '', clinicAddress: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [providerData, setProviderData] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotType, setSlotType] = useState(SLOT_TYPES.SINGLE);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const user = authService.getCurrentUser();

  const [singleSlot, setSingleSlot] = useState({ date: '', startTime: '', endTime: '', durationMinutes: 30 });
  const [bulkSlots, setBulkSlots] = useState([{ date: '', startTime: '', endTime: '', durationMinutes: 30 }]);
  const [recurringSlot, setRecurringSlot] = useState({
    startDate: '', endDate: '', startTime: '', endTime: '', durationMinutes: 30, recurrenceType: 'DAILY'
  });

  const formatTime = (timeStr) => {
    if (!timeStr) return timeStr;
    return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) { setLoading(false); return; }
      try {
        const data = await providerService.getProviderByUserId(user.userId);
        setProviderData(data);
        try {
          const slotData = await providerService.getSlotsByProvider(data.providerId);
          setSlots(slotData);
        } catch (slotErr) {
          console.warn("Could not load slots:", slotErr.response?.status);
          setSlots([]);
        }
      } catch (err) {
        console.warn("No professional profile found:", err.response?.status);
        setProviderData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.userId]);

  const handleSingleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await providerService.addSingleSlot({
        providerId: providerData.providerId, date: singleSlot.date,
        startTime: formatTime(singleSlot.startTime), endTime: formatTime(singleSlot.endTime),
        durationMinutes: parseInt(singleSlot.durationMinutes)
      });
      setMessage({ type: 'success', text: 'Slot added successfully!' });
      const updated = await providerService.getSlotsByProvider(providerData.providerId);
      setSlots(updated); setShowSlotForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add slot' });
    } finally { setSubmitting(false); }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await providerService.addBulkSlots({
        slots: bulkSlots.map(s => ({
          providerId: providerData.providerId, date: s.date,
          startTime: formatTime(s.startTime), endTime: formatTime(s.endTime),
          durationMinutes: parseInt(s.durationMinutes)
        }))
      });
      setMessage({ type: 'success', text: `${bulkSlots.length} slots added successfully!` });
      const updated = await providerService.getSlotsByProvider(providerData.providerId);
      setSlots(updated); setShowSlotForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add bulk slots' });
    } finally { setSubmitting(false); }
  };

  const handleRecurringSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await providerService.addRecurringSlots({
        providerId: providerData.providerId, startDate: recurringSlot.startDate,
        endDate: recurringSlot.endDate, startTime: formatTime(recurringSlot.startTime),
        endTime: formatTime(recurringSlot.endTime), durationMinutes: parseInt(recurringSlot.durationMinutes),
        recurrenceType: recurringSlot.recurrenceType
      });
      setMessage({ type: 'success', text: 'Recurring slots generated successfully!' });
      const updated = await providerService.getSlotsByProvider(providerData.providerId);
      setSlots(updated); setShowSlotForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate recurring slots' });
    } finally { setSubmitting(false); }
  };

  const handleRefreshSlots = async () => {
    if (!providerData?.providerId) return;
    try {
      const updated = await providerService.getSlotsByProvider(providerData.providerId);
      setSlots(updated);
      setMessage({ type: 'success', text: 'Slots refreshed!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to refresh slots.' });
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    try {
      await providerService.deleteSlot(slotId);
      setSlots(slots.filter(s => s.slotId !== slotId));
      setMessage({ type: 'success', text: 'Slot deleted successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete slot' });
    }
  };

  const handleToggleBlock = async (slotId, currentBlockedStatus) => {
    try {
      await providerService.toggleBlockSlot(slotId, currentBlockedStatus);
      const updated = await providerService.getSlotsByProvider(providerData.providerId);
      setSlots(updated);
      setMessage({ type: 'success', text: `Slot ${currentBlockedStatus ? 'unblocked' : 'blocked'} successfully!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    }
  };

  const handleToggleAvailability = async () => {
    const newStatus = !providerData.isAvailable;
    if (!window.confirm(`Are you sure you want to go ${newStatus ? 'Online' : 'Offline'}?`)) return;
    try {
      await providerService.updateProvider(providerData.providerId, { ...providerData, isAvailable: newStatus });
      setProviderData({ ...providerData, isAvailable: newStatus });
      setMessage({ type: 'success', text: `You are now ${newStatus ? 'Online' : 'Offline'}` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update availability.' });
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault(); setEditSubmitting(true);
    const updatedProfile = {
      ...providerData,
      specialization: editData.specialization, qualification: editData.qualification,
      experienceYears: parseInt(editData.experienceYears), clinicName: editData.clinicName,
      clinicAddress: editData.clinicAddress, bio: editData.bio, isAvailable: editData.isAvailable
    };
    try {
      const response = await providerService.updateProvider(providerData.providerId, updatedProfile);
      setProviderData(response); setShowEditForm(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      const errorMessage = error.response ? (error.response.data?.message || "Server Error") : "Network error";
      setMessage({ type: 'error', text: `Failed to update profile: ${errorMessage}` });
    } finally { setEditSubmitting(false); }
  };

  const addBulkRow = () => setBulkSlots([...bulkSlots, { date: '', startTime: '', endTime: '', durationMinutes: 30 }]);
  const removeBulkRow = (index) => setBulkSlots(bulkSlots.filter((_, i) => i !== index));
  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkSlots]; updated[index][field] = value; setBulkSlots(updated);
  };

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="sm-loading"><div className="sm-spinner" /><span>Loading dashboard...</span></div>
    </>
  );

  // Profile doesn't exist or not yet approved — show friendly prompt
  if (!providerData || providerData.verificationStatus !== 'APPROVED') {
    const isPending  = providerData?.verificationStatus === 'PENDING';
    const isRejected = providerData?.verificationStatus === 'REJECTED';
    return (
      <>
        <style>{styles}</style>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh', padding:24 }}>
          <div style={{
            background:'white', borderRadius:16, padding:'48px 40px',
            boxShadow:'0 4px 20px rgba(0,0,0,0.08)', maxWidth:480, textAlign:'center'
          }}>
            <div style={{ fontSize:56, marginBottom:16 }}>
              {isPending ? '⏳' : isRejected ? '❌' : '📋'}
            </div>
            <h3 style={{ color:'#0f172a', marginBottom:10 }}>
              {isPending  ? 'Account Pending Approval'
               : isRejected ? 'Account Not Approved'
               : 'Complete Your Profile First'}
            </h3>
            <p style={{ color:'#64748b', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
              {isPending
                ? 'Your application is under admin review. You can manage your schedule once approved.'
                : isRejected
                ? 'Your application was rejected. Please re-submit with correct documents.'
                : 'Please complete your provider registration to start managing your schedule.'}
            </p>
            <button onClick={() => navigate('/provider-setup')} style={{
              padding:'10px 24px', background:'#1e40af', color:'white',
              border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:14
            }}>
              {isPending ? 'View Application Status' : 'Go to Profile Setup'}
            </button>
          </div>
        </div>
      </>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 8);

  // A slot is "expired" if its date is past, or it's today but startTime has elapsed
  const isPastSlot = (slot) => {
    if (slot.date < today) return true;
    if (slot.date === today && slot.startTime <= currentTime) return true;
    return false;
  };

  const expiredCount   = slots.filter(s => !s.isBooked && isPastSlot(s)).length;
  const availableCount = slots.filter(s => !s.isBooked && !s.isBlocked && !isPastSlot(s)).length;
  const blockedCount   = slots.filter(s => s.isBlocked && !isPastSlot(s)).length;
  const bookedCount    = slots.filter(s => s.isBooked).length;

  return (
    <>
      <style>{styles}</style>
      <div className="sm-root">

        {/* Header */}
        <div className="sm-header">
          <h2>Dr. {user?.fullName || 'Doctor'}</h2>
          <p>Manage your schedule, slots, and professional profile</p>
        </div>

        {/* Toast */}
        {message && (
          <div className={`sm-toast ${message.type}`}>
            <span>{message.type === 'success' ? '✓ ' : '⚠ '}{message.text}</span>
            <button onClick={() => setMessage(null)}>✕</button>
          </div>
        )}

        {providerData && (
          <>
            <div className="sm-grid">
              {/* Left: Profile Card */}
              <div>
                <div className="sm-card" style={{ marginBottom: 24 }}>
                  <div className="sm-card-header">
                    <h3>Professional Profile</h3>
                  </div>
                  <div className="sm-card-body">
                    
                    <div className="sm-info-row">
                      <span className="sm-info-label">Specialization</span>
                      <span className="sm-info-value">{providerData.specialization}</span>
                    </div>
                    <div className="sm-info-row">
                      <span className="sm-info-label">Qualification</span>
                      <span className="sm-info-value">{providerData.qualification}</span>
                    </div>
                    <div className="sm-info-row">
                      <span className="sm-info-label">Experience</span>
                      <span className="sm-info-value">{providerData.experienceYears} Years</span>
                    </div>
                    <div className="sm-info-row">
                      <span className="sm-info-label">Clinic</span>
                      <span className="sm-info-value">{providerData.clinicName}</span>
                    </div>
                    <div className="sm-info-row">
                      <span className="sm-info-label">Address</span>
                      <span className="sm-info-value">{providerData.clinicAddress}</span>
                    </div>
                    {providerData.bio && (
                      <div className="sm-info-row">
                        <span className="sm-info-label">Bio</span>
                        <span className="sm-info-value" style={{ fontStyle: 'italic', color: '#64748b' }}>{providerData.bio}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slot Stats */}
                <div className="sm-card" style={{ marginBottom: 24 }}>
                  <div className="sm-card-header"><h3>Slot Summary</h3></div>
                  <div className="sm-card-body">
                    {[
                      { label: 'Total Slots', value: slots.length, color: '#1e40af', bg: '#eff6ff' },
                      { label: 'Expired', value: expiredCount, color: '#64748b', bg: '#f1f5f9' },
                      { label: 'Available', value: availableCount, color: '#15803d', bg: '#dcfce7' },
                      { label: 'Blocked', value: blockedCount, color: '#a16207', bg: '#fef9c3' },
                      { label: 'Booked', value: bookedCount, color: '#b91c1c', bg: '#fee2e2' },
                    ].map(stat => (
                      <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{stat.label}</span>
                        <span style={{ background: stat.bg, color: stat.color, fontWeight: 800, fontSize: 15, padding: '2px 14px', borderRadius: 20 }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="sm-card">
                  <div className="sm-card-header"><h3>Quick Actions</h3></div>
                  <div className="sm-card-body">
                    <button className="sm-btn sm-btn-primary"
                      onClick={() => { setShowSlotForm(!showSlotForm); setShowEditForm(false); }}>
                      {showSlotForm ? '✕ Hide Slot Form' : '+ Add New Time Slot'}
                    </button>
                    <button className="sm-btn sm-btn-secondary"
                      onClick={() => { setShowEditForm(!showEditForm); setShowSlotForm(false); setEditData({ ...providerData }); }}>
                      {showEditForm ? '✕ Cancel Edit' : '✏ Edit Profile'}
                    </button>
                    
                  </div>
                </div>
              </div>

              {/* Right: Slots Table + Forms */}
              <div>
                {/* Edit Profile Form */}
                {showEditForm && (
                  <div className="sm-card" style={{ marginBottom: 24 }}>
                    <div className="sm-card-header"><h3>Edit Profile</h3></div>
                    <div className="sm-edit-form">
                      <form onSubmit={handleEditProfile}>
                        <div className="sm-form-grid">
                          <div className="sm-field">
                            <label className="sm-label">Specialization</label>
                            <input className="sm-input" placeholder="e.g. Cardiologist" value={editData.specialization}
                              onChange={e => setEditData({ ...editData, specialization: e.target.value })} />
                          </div>
                          <div className="sm-field">
                            <label className="sm-label">Qualification</label>
                            <input className="sm-input" placeholder="e.g. MBBS" value={editData.qualification}
                              onChange={e => setEditData({ ...editData, qualification: e.target.value })} />
                          </div>
                          <div className="sm-field">
                            <label className="sm-label">Experience (Years)</label>
                            <input className="sm-input" type="number" value={editData.experienceYears}
                              onChange={e => setEditData({ ...editData, experienceYears: e.target.value })} />
                          </div>
                          <div className="sm-field">
                            <label className="sm-label">Clinic Name</label>
                            <input className="sm-input" placeholder="Clinic name" value={editData.clinicName}
                              onChange={e => setEditData({ ...editData, clinicName: e.target.value })} />
                          </div>
                          <div className="sm-field full">
                            <label className="sm-label">Clinic Address</label>
                            <input className="sm-input" placeholder="Full address" value={editData.clinicAddress}
                              onChange={e => setEditData({ ...editData, clinicAddress: e.target.value })} />
                          </div>
                          <div className="sm-field full">
                            <label className="sm-label">Bio</label>
                            <textarea className="sm-input" style={{ height: 80, resize: 'vertical' }} placeholder="Short bio"
                              value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} />
                          </div>
                        </div>
                        <button type="submit" className="sm-submit" disabled={editSubmitting}>
                          {editSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Add Slot Form */}
                {showSlotForm && (
                  <div className="sm-card" style={{ marginBottom: 24 }}>
                    <div className="sm-card-header"><h3>Add Time Slot</h3></div>
                    <div style={{ padding: '0 24px 24px' }}>
                      <div className="sm-tabs">
                        {['single', 'bulk', 'recurring'].map(t => (
                          <button key={t} className={`sm-tab ${slotType === t ? 'active' : ''}`} onClick={() => setSlotType(t)}>
                            {t === 'single' ? '📅 Single' : t === 'bulk' ? '📋 Bulk' : '🔁 Recurring'}
                          </button>
                        ))}
                      </div>

                      {slotType === 'single' && (
                        <form onSubmit={handleSingleSubmit}>
                          <div className="sm-form-grid">
                            <div className="sm-field">
                              <label className="sm-label">Date</label>
                              <input type="date" className="sm-input" required value={singleSlot.date}
                                onChange={e => setSingleSlot({ ...singleSlot, date: e.target.value })} />
                            </div>
                            <div className="sm-field">
                              <label className="sm-label">Duration (minutes)</label>
                              <input type="number" className="sm-input" min="5" required value={singleSlot.durationMinutes}
                                onChange={e => setSingleSlot({ ...singleSlot, durationMinutes: e.target.value })} />
                            </div>
                            <div className="sm-field">
                              <label className="sm-label">Start Time</label>
                              <input type="time" className="sm-input" required value={singleSlot.startTime}
                                onChange={e => setSingleSlot({ ...singleSlot, startTime: e.target.value })} />
                            </div>
                            <div className="sm-field">
                              <label className="sm-label">End Time</label>
                              <input type="time" className="sm-input" required value={singleSlot.endTime}
                                onChange={e => setSingleSlot({ ...singleSlot, endTime: e.target.value })} />
                            </div>
                          </div>
                          <button type="submit" className="sm-submit" disabled={submitting}>
                            {submitting ? 'Adding...' : '+ Add Single Slot'}
                          </button>
                        </form>
                      )}

                      {slotType === 'bulk' && (
                        <form onSubmit={handleBulkSubmit}>
                          {bulkSlots.map((slot, index) => (
                            <div key={index} className="sm-bulk-row">
                              <div className="sm-bulk-row-header">
                                <span>Slot {index + 1}</span>
                                {bulkSlots.length > 1 && (
                                  <button type="button" className="sm-btn-remove" onClick={() => removeBulkRow(index)}>Remove</button>
                                )}
                              </div>
                              <div className="sm-form-grid cols-4">
                                <div className="sm-field">
                                  <label className="sm-label">Date</label>
                                  <input type="date" className="sm-input" required value={slot.date} onChange={e => updateBulkRow(index, 'date', e.target.value)} />
                                </div>
                                <div className="sm-field">
                                  <label className="sm-label">Start</label>
                                  <input type="time" className="sm-input" required value={slot.startTime} onChange={e => updateBulkRow(index, 'startTime', e.target.value)} />
                                </div>
                                <div className="sm-field">
                                  <label className="sm-label">End</label>
                                  <input type="time" className="sm-input" required value={slot.endTime} onChange={e => updateBulkRow(index, 'endTime', e.target.value)} />
                                </div>
                                <div className="sm-field">
                                  <label className="sm-label">Duration (min)</label>
                                  <input type="number" className="sm-input" required value={slot.durationMinutes} onChange={e => updateBulkRow(index, 'durationMinutes', e.target.value)} />
                                </div>
                              </div>
                            </div>
                          ))}
                          <button type="button" className="sm-add-row" onClick={addBulkRow}>+ Add Row</button>
                          <button type="submit" className="sm-submit" disabled={submitting}>
                            {submitting ? 'Submitting...' : `Submit ${bulkSlots.length} Slot${bulkSlots.length > 1 ? 's' : ''}`}
                          </button>
                        </form>
                      )}

                      {slotType === 'recurring' && (
                        <form onSubmit={handleRecurringSubmit}>
                          <div className="sm-form-grid">
                            <div className="sm-field">
                              <label className="sm-label">Start Date</label>
                              <input type="date" className="sm-input" required value={recurringSlot.startDate}
                                onChange={e => setRecurringSlot({ ...recurringSlot, startDate: e.target.value })} />
                            </div>
                            <div className="sm-field">
                              <label className="sm-label">End Date</label>
                              <input type="date" className="sm-input" required value={recurringSlot.endDate}
                                onChange={e => setRecurringSlot({ ...recurringSlot, endDate: e.target.value })} />
                            </div>
                            <div className="sm-field">
                              <label className="sm-label">Start Time</label>
                              <input type="time" className="sm-input" required value={recurringSlot.startTime}
                                onChange={e => setRecurringSlot({ ...recurringSlot, startTime: e.target.value })} />
                            </div>
                            <div className="sm-field">
                              <label className="sm-label">Duration (minutes)</label>
                              <input type="number" className="sm-input" required value={recurringSlot.durationMinutes}
                                onChange={e => setRecurringSlot({ ...recurringSlot, durationMinutes: e.target.value })} />
                            </div>
                            <div className="sm-field full">
                              <label className="sm-label">Recurrence Pattern</label>
                              <select className="sm-input" value={recurringSlot.recurrenceType}
                                onChange={e => setRecurringSlot({ ...recurringSlot, recurrenceType: e.target.value })}>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                              </select>
                            </div>
                          </div>
                          <button type="submit" className="sm-submit" disabled={submitting}>
                            {submitting ? 'Generating...' : '🔁 Generate Recurring Slots'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Slots Table */}
                <div className="sm-card">
                  <div className="sm-slots-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <h3>My Slots</h3>
                      <span className="sm-slots-count">{slots.length}</span>
                    </div>
                    <button className="sm-refresh" onClick={handleRefreshSlots}>⟳ Refresh</button>
                  </div>

                  {slots.length === 0 ? (
                    <div className="sm-empty">
                      <div className="sm-empty-icon">🗓️</div>
                      <p>No slots added yet. Click "+ Add New Time Slot" to get started.</p>
                    </div>
                  ) : (
                    <table className="sm-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slots.map(slot => {
                          const slotIsPast = isPastSlot(slot);
                          const statusClass = slot.isBooked
                            ? 'sm-slot-booked'
                            : slot.isBlocked
                              ? (slotIsPast ? 'sm-slot-expired' : 'sm-slot-blocked')
                              : slotIsPast
                                ? 'sm-slot-expired'
                                : 'sm-slot-available';
                          const statusLabel = slot.isBooked
                            ? 'Booked'
                            : slot.isBlocked
                              ? (slotIsPast ? 'Expired' : 'Blocked')
                              : slotIsPast
                                ? 'Expired'
                                : 'Available';
                          return (
                            <tr key={slot.slotId}>
                              <td>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{slot.date}</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                  {slot.startTime} – {slot.endTime}
                                </div>
                              </td>
                              <td style={{ color: '#64748b', fontSize: 13 }}>{slot.durationMinutes || '—'} min</td>
                              <td>
                                <span className={`sm-slot-badge ${statusClass}`}>
                                  <span className="sm-slot-dot" />{statusLabel}
                                </span>
                              </td>
                              <td>
                                {slot.isBooked ? (
                                  <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Cannot modify</span>
                                ) : slotIsPast ? (
                                  <>
                                    <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginRight: 8 }}>Expired</span>
                                    <button className="sm-action-delete" onClick={() => handleDeleteSlot(slot.slotId)}>Delete</button>
                                  </>
                                ) : (
                                  <>
                                    <button className="sm-action-block" onClick={() => handleToggleBlock(slot.slotId, slot.isBlocked)}>
                                      {slot.isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                    <button className="sm-action-delete" onClick={() => handleDeleteSlot(slot.slotId)}>Delete</button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {!providerData && !loading && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="sm-card" style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍⚕️</div>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>No Professional Profile Found</h3>
              <p style={{ color: '#64748b', margin: 0 }}>Please set up your provider profile first.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ScheduleManagement;
