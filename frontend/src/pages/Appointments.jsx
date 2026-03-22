import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  RiCalendarCheckLine, RiAddLine, RiTimeLine,
  RiUserLine, RiCarLine, RiCloseLine,
  RiCheckboxCircleLine, RiCloseCircleLine, RiInformationLine
} from 'react-icons/ri';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customer_id: '', vehicle_id: '',
    appointment_date: '', appointment_time: '', notes: ''
  });
  const [loading, setLoading] = useState(true);

  const emptyForm = { customer_id: '', vehicle_id: '', appointment_date: '', appointment_time: '', notes: '' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        API.get('/appointments'),
        API.get('/customers?limit=100')
      ]);
      setAppointments(aRes.data);
      setCustomers(cRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchVehiclesByCustomer = async (cid) => {
    if (!cid) return setVehicles([]);
    try {
      const { data } = await API.get(`/customers/${cid}`);
      setVehicles(data.vehicles || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/appointments', form);
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed — time slot conflict');
    }
  };

  const handleStatusUpdate = async (id, newStatus, existingNotes) => {
    try {
      await API.put(`/appointments/${id}`, { status: newStatus, notes: existingNotes });
      fetchData();
    } catch (err) {
      alert('Failed to update: ' + (err.response?.data?.error || err.message));
    }
  };

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const getStatusBadge = (status) => {
    const map = {
      confirmed:  'badge-completed',
      scheduled:  'badge-in_progress',
      completed:  'badge-completed',
      cancelled:  'badge-cancelled',
    };
    return map[status] || 'badge-pending';
  };

  const getStatusLabel = (status) => {
    if (status === 'confirmed') return 'scheduled';
    return status.replace('_', ' ');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Appointments</h1>
          <p className="page-subtitle">{appointments.length} scheduled slots</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true); }}>
            <RiAddLine size={18} /> Schedule Appointment
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">
                <div className="loading-state" style={{ padding: '60px 0' }}>
                  <div className="spinner" /><p>Syncing schedule…</p>
                </div>
              </td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan="5">
                <div className="empty-state">
                  <RiCalendarCheckLine size={44} className="empty-state-icon" />
                  <h3>No appointments scheduled</h3>
                  <p>Schedule your first appointment to get started</p>
                </div>
              </td></tr>
            ) : appointments.map(a => (
              <tr key={a.appointment_id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.9rem' }}>
                    <RiCalendarCheckLine size={15} color="var(--primary)" />
                    {new Date(a.appointment_date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 4, fontWeight: 600 }}>
                    <RiTimeLine size={12} /> {a.appointment_time}
                  </div>
                </td>
                <td>
                  <p style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.9rem' }}>{a.customer_name}</p>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-light)', marginTop: 2 }}>{a.phone}</p>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-body)' }}>
                    <RiCarLine size={14} color="var(--primary)" /> {a.vehicle}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, marginTop: 3 }}>{a.license_plate}</p>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(a.status)}`}>
                    {getStatusLabel(a.status)}
                  </span>
                  {a.notes && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 4, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.notes}
                    </p>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['scheduled', 'confirmed'].includes(a.status) ? (
                      <>
                        <button
                          className="btn"
                          style={{ background: '#D1FAE5', color: '#065F46', padding: '8px 10px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700 }}
                          onClick={() => handleStatusUpdate(a.appointment_id, 'completed', a.notes)}
                          title="Mark Completed"
                        >
                          <RiCheckboxCircleLine size={16} />
                        </button>
                        <button
                          className="btn"
                          style={{ background: '#FEE2E2', color: 'var(--danger)', padding: '8px 10px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700 }}
                          onClick={() => handleStatusUpdate(a.appointment_id, 'cancelled', a.notes)}
                          title="Cancel"
                        >
                          <RiCloseCircleLine size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-icon"
                        onClick={() => a.notes && alert(`Notes: ${a.notes}`)}
                        title="View notes"
                      >
                        <RiInformationLine size={17} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-title-icon"><RiCalendarCheckLine size={18} /></div>
                Schedule Appointment
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><RiCloseLine size={18} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer</label>
                <select
                  value={form.customer_id}
                  onChange={e => { update('customer_id', e.target.value); fetchVehiclesByCustomer(e.target.value); }}
                  required
                >
                  <option value="">Select customer…</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.first_name} {c.last_name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vehicle</label>
                <select
                  value={form.vehicle_id}
                  onChange={e => update('vehicle_id', e.target.value)}
                  required
                  disabled={!form.customer_id}
                >
                  <option value="">Select vehicle…</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.license_plate} — {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.appointment_date}
                    onChange={e => update('appointment_date', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time Slot</label>
                  <select value={form.appointment_time} onChange={e => update('appointment_time', e.target.value)} required>
                    <option value="">Select slot…</option>
                    <option value="09:00:00">09:00 AM</option>
                    <option value="10:00:00">10:00 AM</option>
                    <option value="11:00:00">11:00 AM</option>
                    <option value="12:00:00">12:00 PM</option>
                    <option value="14:00:00">02:00 PM</option>
                    <option value="15:00:00">03:00 PM</option>
                    <option value="16:00:00">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  placeholder="Describe the issue or service required…"
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Confirm Booking
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
