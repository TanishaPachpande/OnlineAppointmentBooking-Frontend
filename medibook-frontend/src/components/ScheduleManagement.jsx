import React, { useEffect, useState } from 'react';
import providerService from '../services/api';
import authService from '../services/authService';

const SLOT_TYPES = { SINGLE: 'single', BULK: 'bulk', RECURRING: 'recurring' };

const ScheduleManagement = () => {
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

  const [singleSlot, setSingleSlot] = useState({
    date: '', startTime: '', endTime: '', durationMinutes: 30
  });

  const [bulkSlots, setBulkSlots] = useState([
    { date: '', startTime: '', endTime: '', durationMinutes: 30 }
  ]);

  const [recurringSlot, setRecurringSlot] = useState({
    startDate: '', endDate: '', startTime: '', endTime: '',
    durationMinutes: 30, recurrenceType: 'DAILY'
  });

  // Helper to ensure time format is HH:mm:ss for backend LocalTime
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
    e.preventDefault();
    setSubmitting(true);
    try {
      await providerService.addSingleSlot({
        providerId: providerData.providerId,
        date: singleSlot.date,
        startTime: formatTime(singleSlot.startTime),
        endTime: formatTime(singleSlot.endTime),
        durationMinutes: parseInt(singleSlot.durationMinutes)
      });

      setMessage({ type: 'success', text: 'Slot added successfully!' });
      const updated = await providerService.getSlotsByProvider(providerData.providerId);
      setSlots(updated);
      setShowSlotForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add slot' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await providerService.addBulkSlots({
        slots: bulkSlots.map(s => ({
          providerId: providerData.providerId,
          date: s.date,
          startTime: formatTime(s.startTime),
          endTime: formatTime(s.endTime),
          durationMinutes: parseInt(s.durationMinutes)
        }))
      });
      setMessage({ type: 'success', text: `${bulkSlots.length} slots added successfully!` });
      const updated = await providerService.getSlotsByProvider(providerData.providerId);
      setSlots(updated);
      setShowSlotForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add bulk slots' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecurringSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await providerService.addRecurringSlots({
        providerId: providerData.providerId,
        startDate: recurringSlot.startDate,
        endDate: recurringSlot.endDate,
        startTime: formatTime(recurringSlot.startTime),
        endTime: formatTime(recurringSlot.endTime),
        durationMinutes: parseInt(recurringSlot.durationMinutes),
        recurrenceType: recurringSlot.recurrenceType
      });
      setMessage({ type: 'success', text: 'Recurring slots generated successfully!' });
      const updated = await providerService.getSlotsByProvider(providerData.providerId);
      setSlots(updated);
      setShowSlotForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate recurring slots' });
    } finally {
      setSubmitting(false);
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
      await providerService.updateProvider(providerData.providerId, {
        ...providerData,
        isAvailable: newStatus
      });
      setProviderData({ ...providerData, isAvailable: newStatus });
      setMessage({ type: 'success', text: `You are now ${newStatus ? '🟢 Online' : '🔴 Offline'}` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update availability.' });
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);

    // Spread providerData first to include non-form mandatory fields (userId, avgRating, etc.)
    const updatedProfile = {
      ...providerData,
      specialization: editData.specialization,
      qualification: editData.qualification,
      experienceYears: parseInt(editData.experienceYears),
      clinicName: editData.clinicName,
      clinicAddress: editData.clinicAddress,
      bio: editData.bio,
      isAvailable: editData.isAvailable
    };

    try {
      // Use your service instead of direct axios to ensure headers/baseURLs are correct
      const response = await providerService.updateProvider(providerData.providerId, updatedProfile);

      setProviderData(response); // Assuming your service returns response.data
      setShowEditForm(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      // Better logging to catch why it is 'undefined'
      console.error("Full Error Object:", error);

      const errorMessage = error.response
        ? (error.response.data?.message || "Server Error")
        : "Network error or code exception";

      setMessage({ type: 'error', text: `Failed to update profile: ${errorMessage}` });
    } finally {
      setEditSubmitting(false);
    }
  };

  const addBulkRow = () => setBulkSlots([...bulkSlots, { date: '', startTime: '', endTime: '', durationMinutes: 30 }]);
  const removeBulkRow = (index) => setBulkSlots(bulkSlots.filter((_, i) => i !== index));
  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkSlots];
    updated[index][field] = value;
    setBulkSlots(updated);
  };

  const s = {
    card: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', marginTop: '4px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#555' },
    btn: { padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    btnGray: { padding: '10px 20px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    btnRed: { padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
    btnBlock: { padding: '5px 10px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '5px' },
    btnGreen: { padding: '6px 12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    tabActive: { padding: '8px 16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' },
    tabInactive: { padding: '8px 16px', backgroundColor: '#ecf0f1', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' },
    group: { marginBottom: '12px' },
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        Dashboard: Dr. {user?.fullName || 'Doctor'}
      </h2>

      {/* Message Alert */}
      {message && (
        <div style={{ padding: '12px', borderRadius: '6px', marginBottom: '20px', backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24' }}>
          {message.text}
          <button onClick={() => setMessage(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {providerData && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Enhanced Professional Info Card */}
            <div style={s.card}>
              <h3 style={{ marginTop: 0 }}>Professional Info</h3>
              <p><strong>Specialization:</strong> {providerData.specialization}</p>
              <p><strong>Qualification:</strong> {providerData.qualification}</p>
              <p><strong>Experience:</strong> {providerData.experienceYears} Years</p>
              <p><strong>Clinic:</strong> {providerData.clinicName}</p>
              <p><strong>Address:</strong> {providerData.clinicAddress}</p>
              <p><strong>Bio:</strong> {providerData.bio}</p>
            </div>

            <div style={s.card}>
              <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
              <button style={{ ...s.btn, width: '100%', marginBottom: '10px' }}
                onClick={() => { setShowSlotForm(!showSlotForm); setShowEditForm(false); }}>
                {showSlotForm ? 'Hide Slot Form' : '+ Add New Time Slot'}
              </button>
              <button style={{ ...s.btnGray, width: '100%', marginBottom: '10px' }}
                onClick={() => {
                  setShowEditForm(!showEditForm);
                  setShowSlotForm(false);
                  setEditData({ ...providerData });
                }}>
                {showEditForm ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              
            </div>
          </div>

          {/* Edit Profile Form - Now with Status Toggle */}
          {showEditForm && (
            <div style={{ ...s.card, marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Edit Profile Details</h3>
              <form onSubmit={handleEditProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input style={s.input} placeholder="Specialization" value={editData.specialization} onChange={e => setEditData({ ...editData, specialization: e.target.value })} />
                  <input style={s.input} placeholder="Qualification" value={editData.qualification} onChange={e => setEditData({ ...editData, qualification: e.target.value })} />
                  <input style={s.input} type="number" placeholder="Experience Years" value={editData.experienceYears} onChange={e => setEditData({ ...editData, experienceYears: e.target.value })} />
                  <input style={s.input} placeholder="Clinic Name" value={editData.clinicName} onChange={e => setEditData({ ...editData, clinicName: e.target.value })} />
                  <input style={{ ...s.input, gridColumn: 'span 2' }} placeholder="Clinic Address" value={editData.clinicAddress} onChange={e => setEditData({ ...editData, clinicAddress: e.target.value })} />
                  <textarea style={{ ...s.input, gridColumn: 'span 2', height: '80px' }} placeholder="Short Bio" value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} />


                </div>

                <button type="submit" style={{ ...s.btn, marginTop: '10px' }}>Save Changes</button>
              </form>
            </div>
          )}

          {/* Slot Forms */}
          {showSlotForm && (
            <div style={{ ...s.card, marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Add Time Slot</h3>
              <div style={{ marginBottom: '20px' }}>
                <button style={slotType === 'single' ? s.tabActive : s.tabInactive} onClick={() => setSlotType('single')}>Single Slot</button>
                <button style={slotType === 'bulk' ? s.tabActive : s.tabInactive} onClick={() => setSlotType('bulk')}>Bulk Slots</button>
                <button style={slotType === 'recurring' ? s.tabActive : s.tabInactive} onClick={() => setSlotType('recurring')}>Recurring Slots</button>
              </div>

              {/* SINGLE SLOT FORM */}
              {slotType === 'single' && (
                <form onSubmit={handleSingleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={s.group}>
                      <label style={s.label}>Date</label>
                      <input type="date" style={s.input} required value={singleSlot.date}
                        onChange={e => setSingleSlot({ ...singleSlot, date: e.target.value })} />
                    </div>
                    <div style={s.group}>
                      <label style={s.label}>Duration (minutes)</label>
                      <input type="number" style={s.input} min="5" required value={singleSlot.durationMinutes}
                        onChange={e => setSingleSlot({ ...singleSlot, durationMinutes: e.target.value })} />
                    </div>
                    <div style={s.group}>
                      <label style={s.label}>Start Time</label>
                      <input type="time" style={s.input} required value={singleSlot.startTime}
                        onChange={e => setSingleSlot({ ...singleSlot, startTime: e.target.value })} />
                    </div>
                    <div style={s.group}>
                      <label style={s.label}>End Time</label>
                      <input type="time" style={s.input} required value={singleSlot.endTime}
                        onChange={e => setSingleSlot({ ...singleSlot, endTime: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" style={{ ...s.btn, marginTop: '15px' }} disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Single Slot'}
                  </button>
                </form>
              )}

              {/* BULK SLOTS FORM */}
              {slotType === 'bulk' && (
                <form onSubmit={handleBulkSubmit}>
                  {bulkSlots.map((slot, index) => (
                    <div key={index} style={{ border: '1px solid #eee', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>Slot {index + 1}</strong>
                        {bulkSlots.length > 1 && <button type="button" style={s.btnRed} onClick={() => removeBulkRow(index)}>Remove</button>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                        <input type="date" style={s.input} required value={slot.date} onChange={e => updateBulkRow(index, 'date', e.target.value)} />
                        <input type="time" style={s.input} required value={slot.startTime} onChange={e => updateBulkRow(index, 'startTime', e.target.value)} />
                        <input type="time" style={s.input} required value={slot.endTime} onChange={e => updateBulkRow(index, 'endTime', e.target.value)} />
                        <input type="number" style={s.input} required value={slot.durationMinutes} onChange={e => updateBulkRow(index, 'durationMinutes', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button type="button" style={{ ...s.btnGreen, marginRight: '10px' }} onClick={addBulkRow}>+ Add Row</button>
                  <button type="submit" style={s.btn} disabled={submitting}>Submit Bulk</button>
                </form>
              )}

              {/* RECURRING SLOTS FORM */}
              {slotType === 'recurring' && (
                <form onSubmit={handleRecurringSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={s.group}><label style={s.label}>Start Date</label>
                      <input type="date" style={s.input} required value={recurringSlot.startDate}
                        onChange={e => setRecurringSlot({ ...recurringSlot, startDate: e.target.value })} />
                    </div>
                    <div style={s.group}><label style={s.label}>End Date</label>
                      <input type="date" style={s.input} required value={recurringSlot.endDate}
                        onChange={e => setRecurringSlot({ ...recurringSlot, endDate: e.target.value })} />
                    </div>
                    <div style={s.group}><label style={s.label}>Start Time</label>
                      <input type="time" style={s.input} required value={recurringSlot.startTime}
                        onChange={e => setRecurringSlot({ ...recurringSlot, startTime: e.target.value })} />
                    </div>
                    <div style={s.group}><label style={s.label}>Duration</label>
                      <input type="number" style={s.input} required value={recurringSlot.durationMinutes}
                        onChange={e => setRecurringSlot({ ...recurringSlot, durationMinutes: e.target.value })} />
                    </div>
                    <div style={{ ...s.group, gridColumn: 'span 2' }}>
                      <label style={s.label}>Recurrence Pattern</label>
                      <select style={s.input} value={recurringSlot.recurrenceType}
                        onChange={e => setRecurringSlot({ ...recurringSlot, recurrenceType: e.target.value })}>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" style={{ ...s.btn, marginTop: '15px' }} disabled={submitting}>Generate Recurring Slots</button>
                </form>
              )}
            </div>
          )}

          {/* My Slots Table */}
          <div style={s.card}>
            <h3 style={{ marginTop: 0 }}>My Slots ({slots.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                  <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Date & Time</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Status</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.slotId}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      {slot.date} | {slot.startTime} - {slot.endTime}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      {slot.isBooked ? '🔴 Booked' : '🟢 Available'}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      <button style={s.btnRed} onClick={() => handleDeleteSlot(slot.slotId)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ScheduleManagement;