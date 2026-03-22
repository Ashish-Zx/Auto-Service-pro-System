import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  RiCarLine, RiAddLine, RiCloseLine,
  RiRoadMapLine, RiUserLine, RiHashtag
} from 'react-icons/ri';

const FUEL_COLORS = {
  petrol:   { cls: 'chip-petrol' },
  diesel:   { cls: 'chip-diesel' },
  electric: { cls: 'chip-electric' },
  hybrid:   { cls: 'chip-hybrid' },
};

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customer_id: '', license_plate: '', make: '', model: '',
    year: 2024, color: '', vin: '', mileage: 0, fuel_type: 'petrol'
  });
  const [loading, setLoading] = useState(true);

  const emptyForm = { customer_id: '', license_plate: '', make: '', model: '', year: 2024, color: '', vin: '', mileage: 0, fuel_type: 'petrol' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.all([
        API.get('/vehicles'),
        API.get('/customers?limit=100')
      ]);
      setVehicles(vRes.data);
      setCustomers(cRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/vehicles', form);
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving vehicle');
    }
  };

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Vehicle Fleet</h1>
          <p className="page-subtitle">{vehicles.length} registered vehicles</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true); }}>
            <RiAddLine size={18} /> Register Vehicle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading fleet…</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 20, border: '1px dashed var(--border)', padding: '80px 20px' }}>
          <RiCarLine size={48} className="empty-state-icon" />
          <h3>No vehicles registered</h3>
          <p>Register your first vehicle to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {vehicles.map(v => (
            <div key={v.vehicle_id} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              {/* Top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #224C98, #4E7ED7)' }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)' }}>{v.make} {v.model}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 2 }}>{v.year}</p>
                </div>
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RiCarLine size={13} color="var(--primary)" />
                  <span style={{ fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '1px', fontSize: '0.78rem' }}>{v.license_plate}</span>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '16px' }}>
                <span className={`chip ${FUEL_COLORS[v.fuel_type]?.cls || 'chip-neutral'}`}>
                  {v.fuel_type}
                </span>
                {v.color && (
                  <span className="chip chip-neutral">{v.color}</span>
                )}
              </div>

              {/* Info grid */}
              <div className="info-grid">
                <div className="info-cell">
                  <div className="info-cell-label">Owner</div>
                  <div className="info-cell-value"><RiUserLine size={14} /> {v.owner_name}</div>
                </div>
                <div className="info-cell">
                  <div className="info-cell-label">Mileage</div>
                  <div className="info-cell-value"><RiRoadMapLine size={14} /> {v.mileage?.toLocaleString()} km</div>
                </div>
              </div>

              {/* VIN */}
              {v.vin && (
                <p style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RiHashtag size={12} /> VIN: {v.vin.substring(0, 12)}…
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-title-icon"><RiCarLine size={18} /></div>
                Register Vehicle
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><RiCloseLine size={18} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Registered Owner</label>
                <select value={form.customer_id} onChange={e => update('customer_id', e.target.value)} required>
                  <option value="">Select owner…</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>{c.first_name} {c.last_name} — {c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>License Plate</label>
                  <input value={form.license_plate} onChange={e => update('license_plate', e.target.value)} placeholder="MH01AB1234" required />
                </div>
                <div className="form-group">
                  <label>VIN / Chassis</label>
                  <input value={form.vin} onChange={e => update('vin', e.target.value)} placeholder="17-digit VIN" />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Make</label>
                  <input value={form.make} onChange={e => update('make', e.target.value)} placeholder="e.g. Honda" required />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input value={form.model} onChange={e => update('model', e.target.value)} placeholder="e.g. City" required />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input type="number" value={form.year} onChange={e => update('year', e.target.value)} required />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Color</label>
                  <input value={form.color} onChange={e => update('color', e.target.value)} placeholder="Pearl White" />
                </div>
                <div className="form-group">
                  <label>Fuel Type</label>
                  <select value={form.fuel_type} onChange={e => update('fuel_type', e.target.value)}>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Odometer Reading (km)</label>
                <input type="number" value={form.mileage} onChange={e => update('mileage', e.target.value)} />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Register</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicles;
