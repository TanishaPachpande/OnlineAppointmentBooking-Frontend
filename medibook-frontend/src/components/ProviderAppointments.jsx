import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import providerService from '../services/api';
import appointmentService from '../services/appointmentService';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .pa-root * { box-sizing: border-box; }
  .pa-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f0f4f8;
    min-height: 100vh;
    padding: 32px 24px;
  }

  /* Header */
  .pa-header {
    max-width: 1100px;
    margin: 0 auto 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .pa-header-left h2 {
    margin: 0 0 4px;
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .pa-header-left p {
    margin: 0;
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
  .pa-back-btn {
    padding: 10px 20px;
    background: #1e40af;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pa-back-btn:hover { background: #1d4ed8; }

  /* Toast */
  .pa-toast {
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
  .pa-toast.success { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
  .pa-toast.error   { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }
  .pa-toast button  { background: none; border: none; cursor: pointer; font-size: 16px; color: inherit; }

  /* Stat Cards */
  .pa-stats {
    max-width: 1100px;
    margin: 0 auto 24px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
  }
  .pa-stat {
    background: white;
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-top: 3px solid transparent;
    transition: transform 0.15s;
  }
  .pa-stat:hover { transform: translateY(-2px); }
  .pa-stat-value {
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
  }
  .pa-stat-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
  }
  .pa-stat-total  { border-top-color: #3b82f6; }
  .pa-stat-total .pa-stat-value  { color: #1d4ed8; }
  .pa-stat-scheduled  { border-top-color: #10b981; }
  .pa-stat-scheduled .pa-stat-value  { color: #065f46; }
  .pa-stat-completed  { border-top-color: #6366f1; }
  .pa-stat-completed .pa-stat-value  { color: #4338ca; }
  .pa-stat-cancelled  { border-top-color: #f43f5e; }
  .pa-stat-cancelled .pa-stat-value  { color: #be123c; }
  .pa-stat-noshow  { border-top-color: #f59e0b; }
  .pa-stat-noshow .pa-stat-value  { color: #b45309; }

  /* Controls Bar */
  .pa-controls {
    max-width: 1100px;
    margin: 0 auto 20px;
    background: white;
    border-radius: 14px;
    padding: 16px 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .pa-date-label {
    font-size: 13px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    white-space: nowrap;
  }
  .pa-date-input {
    padding: 9px 13px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #0f172a;
    font-family: inherit;
    transition: border-color 0.15s;
  }
  .pa-date-input:focus { outline: none; border-color: #3b82f6; }
  .pa-date-apply {
    padding: 9px 18px;
    background: #1e40af;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }
  .pa-date-clear {
    padding: 9px 18px;
    background: #f1f5f9;
    color: #64748b;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }
  .pa-date-note {
    font-size: 12px;
    color: #b45309;
    background: #fef9c3;
    padding: 5px 12px;
    border-radius: 6px;
    font-weight: 600;
  }

  /* ── Hide-past toggle ── */
  .pa-toggle-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    white-space: nowrap;
  }
  .pa-toggle-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    user-select: none;
  }
  .pa-toggle-track {
    position: relative;
    width: 36px;
    height: 20px;
    background: #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .pa-toggle-track.on { background: #1e40af; }
  .pa-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .pa-toggle-track.on .pa-toggle-thumb { transform: translateX(16px); }

  /* Filter Tabs */
  .pa-filters {
    max-width: 1100px;
    margin: 0 auto 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pa-filter-btn {
    padding: 8px 18px;
    border-radius: 24px;
    border: 1.5px solid #e2e8f0;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    background: white;
    color: #475569;
    transition: all 0.15s;
    font-family: inherit;
  }
  .pa-filter-btn.active-all        { background: #1e40af; color: white; border-color: #1e40af; }
  .pa-filter-btn.active-SCHEDULED  { background: #065f46; color: white; border-color: #065f46; }
  .pa-filter-btn.active-COMPLETED  { background: #4338ca; color: white; border-color: #4338ca; }
  .pa-filter-btn.active-CANCELLED  { background: #be123c; color: white; border-color: #be123c; }
  .pa-filter-btn.active-NO_SHOW    { background: #b45309; color: white; border-color: #b45309; }
  .pa-filter-btn:not([class*='active']):hover { background: #f8fafc; border-color: #94a3b8; }

  /* Appointment Cards */
  .pa-list { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
  .pa-apt-card {
    background: white;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05);
    overflow: hidden;
    transition: box-shadow 0.15s;
    border-left: 4px solid transparent;
  }
  .pa-apt-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .pa-apt-card.status-SCHEDULED  { border-left-color: #10b981; }
  .pa-apt-card.status-COMPLETED  { border-left-color: #6366f1; }
  .pa-apt-card.status-CANCELLED  { border-left-color: #f43f5e; }
  .pa-apt-card.status-NO_SHOW    { border-left-color: #f59e0b; }

  .pa-apt-body { padding: 20px 24px; }
  .pa-apt-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .pa-apt-id {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .pa-apt-patient {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  /* Status Badge */
  .pa-status-badge {
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .pa-badge-SCHEDULED { background: #d1fae5; color: #065f46; }
  .pa-badge-COMPLETED { background: #e0e7ff; color: #4338ca; }
  .pa-badge-CANCELLED { background: #ffe4e6; color: #be123c; }
  .pa-badge-NO_SHOW   { background: #fef9c3; color: #a16207; }

  /* Apt Details Grid */
  .pa-apt-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 10px;
    margin-bottom: 16px;
  }
  .pa-detail-item { display: flex; flex-direction: column; gap: 3px; }
  .pa-detail-key  { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
  .pa-detail-val  { font-size: 14px; font-weight: 600; color: #1e293b; }
  .pa-detail-item.span2 { grid-column: span 2; }

  /* Action Buttons */
  .pa-actions { display: flex; gap: 10px; }
  .pa-action-complete {
    padding: 8px 18px;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }
  .pa-action-complete:hover { background: #059669; }
  .pa-action-noshow {
    padding: 8px 18px;
    background: #fffbeb;
    color: #b45309;
    border: 1.5px solid #fde68a;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }
  .pa-action-noshow:hover { background: #fef9c3; }

  /* Empty State */
  .pa-empty {
    max-width: 1100px;
    margin: 0 auto;
    background: white;
    border-radius: 14px;
    padding: 80px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .pa-empty-icon { font-size: 56px; margin-bottom: 16px; }
  .pa-empty h3   { margin: 0 0 8px; color: #0f172a; font-size: 18px; font-weight: 700; }
  .pa-empty p    { margin: 0; color: #64748b; font-size: 14px; }

  /* Loading */
  .pa-loading {
    display: flex; align-items: center; justify-content: center;
    height: 300px; gap: 12px; color: #64748b; font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .pa-spinner {
    width: 24px; height: 24px;
    border: 3px solid #e2e8f0;
    border-top-color: #1e40af;
    border-radius: 50%;
    animation: pa-spin 0.8s linear infinite;
  }
  @keyframes pa-spin { to { transform: rotate(360deg); } }
`;

const statusConfig = {
  SCHEDULED: { label: 'Scheduled', icon: '🟢' },
  COMPLETED:  { label: 'Completed',  icon: '✓'  },
  CANCELLED:  { label: 'Cancelled',  icon: '✕'  },
  NO_SHOW:    { label: 'No Show',    icon: '⚠'  },
};

const ProviderAppointments = () => {
  const navigate  = useNavigate();
  const user      = authService.getCurrentUser();

  const [providerData,     setProviderData]     = useState(null);
  const [allAppointments,  setAllAppointments]  = useState([]);
  const [appointments,     setAppointments]     = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [message,          setMessage]          = useState(null);
  const [activeFilter,     setActiveFilter]     = useState('ALL');
  const [selectedDate,     setSelectedDate]     = useState('');
  // ── NEW: hide past appointments toggle (default ON so past is hidden) ──
  const [hidePast,         setHidePast]         = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'PROVIDER') { navigate('/login'); return; }
    fetchData();
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const fetchData = async () => {
    try {
      const pData = await providerService.getProviderByUserId(user.userId);
      setProviderData(pData);

      if (pData.verificationStatus !== 'APPROVED') {
        setLoading(false);
        return;
      }

      const apts = await appointmentService.getByProvider(pData.providerId);
      setAllAppointments(apts);
      setAppointments(apts);
      setSelectedDate('');
    } catch (err) {
      if (err?.response?.status === 404 || !err?.response) {
        setProviderData(null);
      } else {
        setMessage({ type: 'error', text: 'Failed to load appointments.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByDate = async () => {
    if (!selectedDate || !providerData) return;
    try {
      const data = await appointmentService.getByProviderAndDate(providerData.providerId, selectedDate);
      setAppointments(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to filter appointments.' });
    }
  };

  const handleClearDate = () => {
    setSelectedDate('');
    setAppointments(allAppointments);
  };

  const handleComplete = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    try {
      await appointmentService.completeAppointment(appointmentId);
      setMessage({ type: 'success', text: 'Appointment marked as completed.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const handleNoShow = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as No Show?')) return;
    try {
      await appointmentService.updateStatus(appointmentId, 'NO_SHOW');
      setMessage({ type: 'success', text: 'Marked as No Show.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const filters  = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  // ── NEW: today string for past-date comparison ──
  const today = new Date().toISOString().split('T')[0];

  // ── NEW: apply hidePast filter on top of status filter ──
  const visibleAppointments = hidePast
    ? appointments.filter(a => a.appointmentDate >= today)
    : appointments;

  const filtered = activeFilter === 'ALL'
    ? visibleAppointments
    : visibleAppointments.filter(a => a.status === activeFilter);

  // Stats always reflect ALL appointments (all-time totals), unaffected by toggle
  const totalCount = allAppointments.length;
  const scheduled  = allAppointments.filter(a => a.status === 'SCHEDULED').length;
  const completed  = allAppointments.filter(a => a.status === 'COMPLETED').length;
  const cancelled  = allAppointments.filter(a => a.status === 'CANCELLED').length;
  const noShow     = allAppointments.filter(a => a.status === 'NO_SHOW').length;

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="pa-loading"><div className="pa-spinner" /><span>Loading appointments...</span></div>
    </>
  );

  if (!providerData || providerData.verificationStatus !== 'APPROVED') {
    const isPending  = providerData?.verificationStatus === 'PENDING';
    const isRejected = providerData?.verificationStatus === 'REJECTED';
    return (
      <>
        <style>{styles}</style>
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          minHeight: '80vh', padding: 24
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '48px 40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: 480, textAlign: 'center'
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {isPending ? '⏳' : isRejected ? '❌' : '📋'}
            </div>
            <h3 style={{ color: '#0f172a', marginBottom: 10 }}>
              {isPending  ? 'Account Pending Approval'
               : isRejected ? 'Account Not Approved'
               : 'Complete Your Profile First'}
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {isPending
                ? 'Your application is under review by the admin. You will be able to see appointments once approved.'
                : isRejected
                ? 'Your application was rejected. Please re-submit your profile with the correct documents.'
                : 'You need to complete your provider registration before you can manage appointments.'}
            </p>
            <button onClick={() => navigate('/provider-setup')} style={{
              padding: '10px 24px', background: '#1e40af', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14
            }}>
              {isPending ? 'View Application Status' : 'Go to Profile Setup'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="pa-root">

        {/* Header */}
        <div className="pa-header">
          <div className="pa-header-left">
            <h2>Patient Appointments</h2>
            <p>Dr. {user?.fullName}</p>
          </div>
          <button className="pa-back-btn" onClick={() => navigate('/manage-slots')}>
            ← Dashboard
          </button>
        </div>

        {/* Toast */}
        {message && (
          <div className={`pa-toast ${message.type}`}>
            <span>{message.type === 'success' ? '✓ ' : '⚠ '}{message.text}</span>
            <button onClick={() => setMessage(null)}>✕</button>
          </div>
        )}

        {/* Stats — always all-time totals */}
        <div className="pa-stats">
          {[
            { label: 'Total',     value: totalCount, cls: 'pa-stat-total'     },
            { label: 'Scheduled', value: scheduled,  cls: 'pa-stat-scheduled' },
            { label: 'Completed', value: completed,  cls: 'pa-stat-completed' },
            { label: 'Cancelled', value: cancelled,  cls: 'pa-stat-cancelled' },
            { label: 'No Show',   value: noShow,     cls: 'pa-stat-noshow'    },
          ].map(s => (
            <div key={s.label} className={`pa-stat ${s.cls}`}>
              <span className="pa-stat-value">{s.value}</span>
              <span className="pa-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Date Filter + Hide Past toggle */}
        <div className="pa-controls">
          <span className="pa-date-label">Filter by date</span>
          <input type="date" className="pa-date-input" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
          <button className="pa-date-apply" onClick={handleFilterByDate}>Apply</button>
          {selectedDate && (
            <button className="pa-date-clear" onClick={handleClearDate}>✕ Clear</button>
          )}
          {selectedDate && (
            <span className="pa-date-note">⚠ Showing {selectedDate} only — stats show all-time totals</span>
          )}

          {/* ── NEW: Hide past toggle ── */}
          <div className="pa-toggle-wrap" onClick={() => setHidePast(p => !p)} style={{ cursor: 'pointer' }}>
            <span className="pa-toggle-label">Hide past</span>
            <div className={`pa-toggle-track ${hidePast ? 'on' : ''}`}>
              <div className="pa-toggle-thumb" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="pa-filters">
          {filters.map(f => {
            const count = f === 'ALL'
              ? visibleAppointments.length
              : visibleAppointments.filter(a => a.status === f).length;
            const isActive = activeFilter === f;
            const activeClass = isActive ? `active-${f === 'ALL' ? 'all' : f}` : '';
            return (
              <button key={f} className={`pa-filter-btn ${activeClass}`} onClick={() => setActiveFilter(f)}>
                {f === 'ALL' ? `All (${count})` : `${f.replace('_', ' ')} (${count})`}
              </button>
            );
          })}
        </div>

        {/* Appointments List */}
        {filtered.length === 0 ? (
          <div className="pa-empty">
            <div className="pa-empty-icon">📋</div>
            <h3>No appointments found</h3>
            <p>
              {hidePast
                ? 'No upcoming appointments. Toggle "Hide past" off to see historical records.'
                : 'Try adjusting your filters or check back later.'}
            </p>
          </div>
        ) : (
          <div className="pa-list">
            {filtered.map(apt => {
              const sc = statusConfig[apt.status] || statusConfig.SCHEDULED;
              return (
                <div key={apt.appointmentId} className={`pa-apt-card status-${apt.status}`}>
                  <div className="pa-apt-body">
                    <div className="pa-apt-top">
                      <div>
                        <div className="pa-apt-id">Appointment #{apt.appointmentId}</div>
                        <div className="pa-apt-patient">Patient ID: {apt.patientId}</div>
                      </div>
                      <span className={`pa-status-badge pa-badge-${apt.status}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>

                    <div className="pa-apt-details">
                      <div className="pa-detail-item">
                        <span className="pa-detail-key">Date</span>
                        <span className="pa-detail-val">📅 {apt.appointmentDate}</span>
                      </div>
                      <div className="pa-detail-item">
                        <span className="pa-detail-key">Time</span>
                        <span className="pa-detail-val">⏰ {apt.startTime?.slice(0, 5)} – {apt.endTime?.slice(0, 5)}</span>
                      </div>
                      <div className="pa-detail-item">
                        <span className="pa-detail-key">Service</span>
                        <span className="pa-detail-val">🩺 {apt.serviceType}</span>
                      </div>
                      <div className="pa-detail-item">
                        <span className="pa-detail-key">Mode</span>
                        <span className="pa-detail-val">💊 {apt.modeOfConsultation?.replace('_', ' ')}</span>
                      </div>
                      {apt.notes && (
                        <div className="pa-detail-item span2">
                          <span className="pa-detail-key">Notes</span>
                          <span className="pa-detail-val">📝 {apt.notes}</span>
                        </div>
                      )}
                    </div>

                    {apt.status === 'SCHEDULED' && (
                      <div className="pa-actions">
                        <button className="pa-action-complete" onClick={() => handleComplete(apt.appointmentId)}>
                          ✓ Mark Complete
                        </button>
                        <button className="pa-action-noshow" onClick={() => handleNoShow(apt.appointmentId)}>
                          ⚠ No Show
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default ProviderAppointments;