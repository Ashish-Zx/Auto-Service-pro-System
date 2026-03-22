import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import {
  RiDashboardLine, RiTeamLine, RiCarLine, RiFileListLine,
  RiAddCircleLine, RiCalendarEventLine, RiArchiveLine,
  RiLogoutBoxLine, RiToolsLine, RiMenuLine, RiCloseLine
} from 'react-icons/ri';
import Dashboard     from './pages/Dashboard';
import Customers     from './pages/Customers';
import Vehicles      from './pages/Vehicles';
import ServiceOrders from './pages/ServiceOrders';
import OrderDetail   from './pages/OrderDetail';
import CreateOrder   from './pages/CreateOrder';
import Appointments  from './pages/Appointments';
import Mechanics     from './pages/Mechanics';
import Inventory     from './pages/Inventory';
import CustomerProfile from './pages/CustomerProfile';
import Login         from './pages/Login';
import LandingPage   from './pages/LandingPage';
import './index.css';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: <RiDashboardLine size={18} />, label: 'Dashboard' },
  { to: '/customers',     icon: <RiTeamLine      size={18} />, label: 'Customers' },
  { to: '/vehicles',      icon: <RiCarLine       size={18} />, label: 'Vehicles'  },
  { to: '/orders',        icon: <RiFileListLine  size={18} />, label: 'Orders'    },
  { to: '/orders/new',    icon: <RiAddCircleLine size={18} />, label: 'New Order' },
  { to: '/appointments',  icon: <RiCalendarEventLine size={18} />, label: 'Appointments' },
  { to: '/mechanics',     icon: <RiToolsLine     size={18} />, label: 'Mechanics' },
  { to: '/inventory',     icon: <RiArchiveLine   size={18} />, label: 'Inventory' },
];

function AppShell({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app">
      {/* ── Mobile Topbar ── */}
      <div className="mobile-topbar">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
        </button>
        <div className="mobile-topbar-brand">
          <RiCarLine size={16} />
          AutoService Pro
        </div>
        {/* spacer to centre brand */}
        <div style={{ width: 38 }} />
      </div>

      {/* ── Sidebar Backdrop (mobile) ── */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <nav className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <h2>
            <RiCarLine size={20} style={{ color: 'var(--primary-hover)' }} />
            <span>
              <span className="brand-accent">Auto</span>Service Pro
            </span>
          </h2>
          <p className="user-info">{user?.username} · {user?.role}</p>
        </div>

        <ul className="nav-links">
          {NAV_ITEMS.map(item => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={location.pathname === item.to ? 'active' : ''}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            <RiLogoutBoxLine size={16} /> Sign out
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Routes>
          <Route path="/dashboard"     element={<Dashboard />}    />
          <Route path="/customers"     element={<Customers />}    />
          <Route path="/customers/:id" element={<CustomerProfile />} />
          <Route path="/vehicles"      element={<Vehicles />}     />
          <Route path="/orders"        element={<ServiceOrders />}/>
          <Route path="/orders/new"    element={<CreateOrder />}  />
          <Route path="/orders/:id"    element={<OrderDetail />}  />
          <Route path="/appointments"  element={<Appointments />} />
          <Route path="/mechanics"     element={<Mechanics />}    />
          <Route path="/inventory"     element={<Inventory />}    />
          <Route path="*"              element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* ── Public routes ── */}
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
        />

        {/* ── Protected routes ── */}
        <Route
          path="/*"
          element={
            isLoggedIn
              ? <AppShell user={user} onLogout={handleLogout} />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
