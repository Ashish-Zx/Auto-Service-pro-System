import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RiCarLine,
  RiTeamLine,
  RiFileListLine,
  RiCalendarEventLine,
  RiToolsLine,
  RiArchiveLine,
  RiBarChartLine,
  RiMenuLine,
  RiCloseLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiFlashlightLine,
} from 'react-icons/ri';
import styles from './LandingPage.module.css';

/* ── Data ──────────────────────────────────────── */

const FEATURES = [
  {
    icon:  <RiTeamLine size={26} />,
    title: 'Customer Management',
    desc:  'Track every client, their vehicles, and complete service history in one place.',
    large: true,
    dark:  false,
  },
  {
    icon:  <RiFileListLine size={26} />,
    title: 'Service Orders',
    desc:  'Create, assign, and track orders from intake to delivery — zero paperwork.',
    large: false,
    dark:  true,
  },
  {
    icon:  <RiCalendarEventLine size={26} />,
    title: 'Appointment Scheduling',
    desc:  'Smart calendar with mechanic availability so you never double-book.',
    large: false,
    dark:  false,
  },
  {
    icon:  <RiArchiveLine size={26} />,
    title: 'Inventory Control',
    desc:  'Real-time parts tracking with low-stock alerts before you run out.',
    large: false,
    dark:  false,
  },
  {
    icon:  <RiToolsLine size={26} />,
    title: 'Mechanic Dashboard',
    desc:  "Assign jobs, track progress, and monitor your team's workload effortlessly.",
    large: false,
    dark:  true,
  },
  {
    icon:  <RiBarChartLine size={26} />,
    title: 'Revenue Analytics',
    desc:  "Live charts and reports to understand your shop's financial performance.",
    large: true,
    dark:  false,
  },
];

const STEPS = [
  {
    num:   '01',
    icon:  <RiFlashlightLine size={22} />,
    title: 'Set Up Your Center',
    desc:  'Add your team, services, and inventory in minutes. No IT required.',
  },
  {
    num:   '02',
    icon:  <RiToolsLine size={22} />,
    title: 'Manage Daily Operations',
    desc:  'Create orders, schedule appointments, and dispatch mechanics from one screen.',
  },
  {
    num:   '03',
    icon:  <RiBarChartLine size={22} />,
    title: 'Track & Grow',
    desc:  'Use built-in reports to monitor performance and make data-driven decisions.',
  },
];

const BAR_HEIGHTS = [38, 62, 48, 85, 58, 94, 72];

const MOCK_STATS = [
  { label: 'Orders',      val: '127',   color: '#4E7ED7' },
  { label: 'Revenue',     val: '₹2.4M', color: '#10B981' },
  { label: 'Satisfaction',val: '4.9 ★', color: '#F59E0B' },
];

const MOCK_ACTIVITY = [
  { label: 'Order #1042 Completed',  time: 'just now', color: '#10B981' },
  { label: 'Low stock: Brake Pads',  time: '5m ago',   color: '#F59E0B' },
  { label: '+3 new appointments',    time: '12m ago',   color: '#4E7ED7' },
];

/* ── Dashboard Mock ─────────────────────────────── */

function DashboardMock() {
  return (
    <div className={styles.mockWrapper}>
      <div className={styles.mockCard}>
        {/* Header row */}
        <div className={styles.mockHeader}>
          <div className={styles.mockDots}>
            <span /><span /><span />
          </div>
          <span className={styles.mockTitle}>Business Insight</span>
        </div>

        {/* Stat cells */}
        <div className={styles.mockStatRow}>
          {MOCK_STATS.map(s => (
            <div key={s.label} className={styles.mockStatCell}>
              <div className={styles.mockStatVal} style={{ color: s.color }}>{s.val}</div>
              <div className={styles.mockStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className={styles.mockChart}>
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className={styles.mockBar}
              style={{ height: `${h}%`, '--bar-delay': `${i * 0.09}s` }}
            />
          ))}
        </div>

        {/* Activity feed */}
        <div className={styles.mockActivity}>
          {MOCK_ACTIVITY.map((a, i) => (
            <div key={i} className={styles.mockActivityRow}>
              <span className={styles.mockDot} style={{ background: a.color }} />
              <span className={styles.mockActivityLabel}>{a.label}</span>
              <span className={styles.mockActivityTime}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating notification cards */}
      <div className={styles.mockFloatCard} style={{ top: '-16px', right: '-12px' }}>
        <RiCarLine size={16} style={{ color: '#4E7ED7' }} />
        <span>+3 vehicles today</span>
      </div>
      <div className={styles.mockFloatCard} style={{ bottom: '28px', left: '-20px' }}>
        <RiShieldCheckLine size={16} style={{ color: '#10B981' }} />
        <span>Order #1042 Completed</span>
      </div>
    </div>
  );
}

/* ── LandingPage ────────────────────────────────── */

function LandingPage() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileMenu,  setMobileMenu]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={styles.page}>

      {/* ── Navbar ── */}
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            <span className={styles.navBrandIcon}><RiCarLine size={20} /></span>
            AutoService Pro
          </div>

          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>

          <Link to="/login" className={styles.navCta}>Sign In →</Link>

          <button
            className={styles.navMobileToggle}
            onClick={() => setMobileMenu(prev => !prev)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
          </button>
        </div>

        {mobileMenu && (
          <div className={styles.mobileMenu}>
            <a href="#features"     onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How It Works</a>
            <Link to="/login"       onClick={() => setMobileMenu(false)}>Sign In →</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>

          {/* Left: Text */}
          <div className={styles.heroText}>
            <div className={styles.heroTag}>
              <RiShieldCheckLine size={13} />
              Trusted by 500+ service centers
            </div>

            <h1 className={styles.heroHeadline}>
              Complete Vehicle<br />
              <span className={styles.heroAccent}>Service Management</span>
            </h1>

            <p className={styles.heroSub}>
              From appointments to invoices — one platform built for modern auto service centers.
            </p>

            <div className={styles.heroCtas}>
              <Link to="/login" className={styles.ctaPrimary}>
                Get Started Free <RiArrowRightLine size={17} />
              </Link>
              <a href="#features" className={styles.ctaSecondary}>
                See Features
              </a>
            </div>

            <div className={styles.trustStrip}>
              <div className={styles.trustAvatars}>
                {[1,2,3,4].map(n => (
                  <img
                    key={n}
                    src={`https://i.pravatar.cc/32?u=asp${n}`}
                    alt={`Team member ${n}`}
                    className={styles.avatar}
                    width={30}
                    height={30}
                  />
                ))}
              </div>
              <span>Loved by 500+ service centers</span>
            </div>
          </div>

          {/* Right: Visual */}
          <div className={styles.heroVisual}>
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className={styles.statsStrip}>
        {[
          { num: '500+',  label: 'Customers Managed' },
          { num: '12K+',  label: 'Service Orders'    },
          { num: '₹50M+', label: 'Revenue Tracked'   },
          { num: '99.9%', label: 'Uptime'             },
        ].map((s, i) => (
          <div key={i} className={styles.statItem}>
            <span className={styles.statNum}>{s.num}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className={styles.features} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2>Everything you need to run your shop</h2>
            <p>One platform. Every tool. Zero compromise.</p>
          </div>

          <div className={styles.bentoGrid}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={[
                  styles.bentoCard,
                  f.dark  ? styles.bentoDark  : '',
                  f.large ? styles.bentoLarge : '',
                ].join(' ')}
              >
                <div className={`${styles.bentoIcon} ${f.dark ? styles.bentoIconDark : ''}`}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2>How AutoService Pro Works</h2>
            <p>Up and running in minutes, not months.</p>
          </div>

          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{s.num}</div>
                <div className={styles.stepIcon}>{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaBandInner}>
          <h2>Ready to modernize your auto service center?</h2>
          <p>Start managing smarter today.</p>
          <Link to="/login" className={styles.ctaPrimary}>
            Sign In to Dashboard <RiArrowRightLine size={17} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerBrandIcon}><RiCarLine size={18} /></span>
            AutoService Pro
          </div>
          <p className={styles.footerCopy}>© 2026 AutoService Pro. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;