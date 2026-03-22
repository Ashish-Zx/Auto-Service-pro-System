import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import {
  RiTeamLine, RiFileListLine, RiMoneyDollarCircleLine,
  RiToolsLine, RiArchiveLine, RiStarLine, RiTimeLine,
  RiArrowRightLine, RiHistoryLine, RiAwardLine
} from 'react-icons/ri';

const STAT_CONFIGS = [
  { key: 'totalCustomers',    label: 'Total Clients',   icon: <RiTeamLine />,      color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'activeOrders',      label: 'Active Jobs',     icon: <RiFileListLine />,  color: '#0891B2', bg: '#ECFEFF' },
  { key: 'todayRevenue',      label: "Today's Revenue", icon: <RiMoneyDollarCircleLine />, color: '#059669', bg: '#ECFDF5' },
  { key: 'availableMechanics',label: 'Team On-Duty',    icon: <RiToolsLine />,     color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'lowStockItems',     label: 'Stock Alerts',    icon: <RiArchiveLine />,   color: '#DC2626', bg: '#FEF2F2' },
  { key: 'avgRating',         label: 'Cust. Rating',    icon: <RiStarLine />,      color: '#D97706', bg: '#FFFBEB' },
];

const StatCard = ({ config, value }) => (
  <div className="stat-card">
    <div className="stat-card-icon" style={{ backgroundColor: config.bg, color: config.color }}>
      {config.icon}
    </div>
    <div className="stat-card-info">
      <p className="stat-card-label">{config.label}</p>
      <h3 className="stat-card-value">
        {config.key === 'todayRevenue' ? `Rs.${value?.toLocaleString()}` : value}
      </h3>
    </div>
  </div>
);

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes, revenueRes, stockRes, auditRes, servicesRes] = await Promise.all([
          API.get('/reports/dashboard'),
          API.get('/orders?limit=6'),
          API.get('/reports/revenue'),
          API.get('/inventory/low-stock'),
          API.get('/reports/audit-log'),
          API.get('/reports/service-popularity')
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data || []);
        
        // Revenue Chart Formatting: Only 7 days as requested for clean look
        const rawRevenue = revenueRes.data || [];
        const sortedRevenue = [...rawRevenue].sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
        const formatted = sortedRevenue.slice(-7).map(item => ({
          ...item,
          total_revenue: parseFloat(item.total_revenue)
        }));
        setRevenueData(formatted);
        
        setLowStock(stockRes.data || []);
        setAuditLog(auditRes.data || []);
        
        // Final Top Services Sort: Force Revenue DESC for perfect BI
        const sortedServices = (servicesRes.data || [])
          .sort((a, b) => parseFloat(b.total_revenue) - parseFloat(a.total_revenue))
          .slice(0, 5);
        setTopServices(sortedServices);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Command Center</h1>
          <p className="page-subtitle">Real-time workshop performance metrics</p>
        </div>
        <div className="page-header-actions">
           <span className="badge-active">SYSTEM LIVE</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        {STAT_CONFIGS.map(config => (
          <StatCard key={config.key} config={config} value={stats?.[config.key]} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginTop: 24 }}>
        {/* Revenue Performance */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title"><RiMoneyDollarCircleLine /> Revenue Performance (Daily)</span>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="payment_date" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  tickFormatter={d => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `Rs.${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`Rs.${value.toLocaleString()}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="var(--primary)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title"><RiArchiveLine /> Critical Inventory</span>
            <Link to="/inventory" className="btn-link">Restock <RiArrowRightLine /></Link>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            {lowStock.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>Stock levels healthy</p>
            ) : lowStock.slice(0, 4).map(p => (
              <div key={p.part_id} className="lite-item">
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.part_name}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>PN: {p.part_number} · {p.supplier}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.9rem' }}>{p.quantity_in_stock}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>LEFT</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginTop: 24 }}>
        {/* Recent Orders Table */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title"><RiFileListLine /> Recent Orders</span>
            <Link to="/orders" className="btn-link">View all <RiArrowRightLine /></Link>
          </div>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 6).map(o => (
                  <tr key={o.order_id} onClick={() => navigate(`/orders/${o.order_id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 800 }}>#{o.order_id}</td>
                    <td style={{ fontSize: '0.82rem' }}>{o.customer_name}</td>
                    <td><div className={`badge badge-${o.status}`} style={{ fontSize: '0.65rem' }}>{o.status.replace('_', ' ')}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Services BI Card */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title"><RiAwardLine color="#D97706" /> Top Services (By Revenue)</span>
            <span className="badge-pending" style={{ fontSize: '0.7rem' }}>DBMS ANALYSIS VIEW</span>
          </div>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th>Service</th>
                  <th>Orders</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map(s => (
                  <tr key={s.service_id}>
                    <td>
                      <p style={{ fontWeight: 700, fontSize: '0.82rem' }}>{s.service_name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{s.category_name}</p>
                    </td>
                    <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.times_ordered}x</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '0.82rem' }}>Rs.{(parseFloat(s.total_revenue) || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Row */}
      <div className="section-card" style={{ marginTop: 24 }}>
        <div className="section-card-header">
          <span className="section-card-title"><RiHistoryLine /> System Activity (Audit Log)</span>
          <span className="badge-completed" style={{ fontSize: '0.7rem' }}>DBMS AUDIT FEATURE</span>
        </div>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr style={{ background: 'transparent' }}>
                <th>Operation</th>
                <th>Target Table</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>No activity recorded yet</td></tr>
              ) : auditLog.slice(0, 10).map(log => (
                <tr key={log.log_id}>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800,
                      background: log.operation === 'INSERT' ? '#DBEAFE' : '#F1F5F9',
                      color: log.operation === 'INSERT' ? '#1E40AF' : '#475569'
                    }}>
                      {log.operation}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>{log.table_name}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-body)', fontFamily: 'monospace' }}>
                    {log.new_values ? (
                      typeof log.new_values === 'string' 
                        ? log.new_values.substring(0, 60) 
                        : JSON.stringify(log.new_values).substring(0, 60)
                    ) : '---'}...
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {new Date(log.changed_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
