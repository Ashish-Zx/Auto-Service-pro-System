import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { RiCarLine, RiUserLine, RiLockLine, RiArrowLeftLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/auth/login', { username, password });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#0B1120',
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        width: '600px',
        height: '500px',
        background: 'radial-gradient(ellipse, rgba(34,76,152,0.25) 0%, transparent 65%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* Back link */}
      <Link
        to="/"
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'rgba(255,255,255,0.45)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 600,
          padding: '8px 14px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.07)',
          transition: 'color 0.2s, background 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      >
        <RiArrowLeftLine size={15} /> Back to Home
      </Link>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '48px 44px',
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.08)',
        width: '100%',
        maxWidth: '430px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            background: 'var(--primary)',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            boxShadow: '0 8px 28px rgba(34,76,152,0.55)',
          }}>
            <RiCarLine size={30} color="white" />
          </div>
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            color: 'white',
            fontSize: '1.65rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '6px',
          }}>Welcome back</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
            Sign in to AutoService Pro
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '12px',
            color: '#F87171',
            fontSize: '0.875rem',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '7px',
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: "'Manrope', sans-serif",
            }}>Username</label>
            <div style={{ position: 'relative' }}>
              <RiUserLine style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)',
                pointerEvents: 'none',
              }} size={17} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontFamily: "'Source Sans 3', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(78,126,215,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,76,152,0.18)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '7px',
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: "'Manrope', sans-serif",
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <RiLockLine style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)',
                pointerEvents: 'none',
              }} size={17} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 42px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontFamily: "'Source Sans 3', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(78,126,215,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,76,152,0.18)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
                  padding: 0,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                {showPass ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'rgba(34,76,152,0.45)' : '#224C98',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(34,76,152,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4E7ED7'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#224C98'; }}
          >
            {loading ? <><div className="spinner-sm" /> Authenticating…</> : 'Sign In'}
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.28)',
          fontSize: '0.8rem',
          fontFamily: "'Manrope', sans-serif",
        }}>
          Demo: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>admin / admin123</strong>
        </p>
      </div>
    </div>
  );
}

export default Login;
