import React from 'react';
import { ic, I } from './Icons';
import { Crest } from './Crest';

export interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: { n: string; e: string } | null;
  currentRoute: string; // '', 'live', 'picks', 'analysis', 'membership', 'profile', 'notifications'
  isLandingPage: boolean;
  onNavigateLanding: () => void;
  onNavigateApp: (route: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenLegal: (key: 'privacy' | 'terms' | 'responsible') => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  user,
  currentRoute,
  isLandingPage,
  onNavigateLanding,
  onNavigateApp,
  onSignIn,
  onSignOut,
  onOpenLegal,
}) => {
  if (!isOpen) return null;

  const handleNav = (action: () => void) => {
    onClose();
    action();
  };

  const navItems = [
    {
      label: 'Home & Features',
      icon: ic.h,
      active: isLandingPage,
      onClick: () => handleNav(onNavigateLanding),
    },
    {
      label: 'Daily Picks',
      icon: ic.p,
      active: !isLandingPage && currentRoute === 'picks',
      onClick: () => handleNav(() => onNavigateApp('picks')),
    },
    {
      label: 'Live Scores',
      icon: ic.l,
      active: !isLandingPage && currentRoute === 'live',
      onClick: () => handleNav(() => onNavigateApp('live')),
    },
    {
      label: 'News Feed',
      icon: ic.f,
      active: !isLandingPage && currentRoute === '',
      onClick: () => handleNav(() => onNavigateApp('')),
    },
    {
      label: 'Match Analysis',
      icon: ic.a,
      active: !isLandingPage && currentRoute === 'analysis',
      onClick: () => handleNav(() => onNavigateApp('analysis')),
    },
    {
      label: 'VIP Membership',
      icon: ic.star,
      active: !isLandingPage && currentRoute === 'membership',
      onClick: () => handleNav(() => onNavigateApp('membership')),
    },
    ...(user
      ? [
          {
            label: 'My Profile',
            icon: ic.u,
            active: !isLandingPage && currentRoute === 'profile',
            onClick: () => handleNav(() => onNavigateApp('profile')),
          },
          {
            label: 'Notifications',
            icon: I.b,
            active: !isLandingPage && currentRoute === 'notifications',
            onClick: () => handleNav(() => onNavigateApp('notifications')),
          },
        ]
      : []),
  ];

  return (
    <div className="mobile-menu-overlay" onClick={onClose}>
      <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header with Brand Logo and Close Button */}
        <div className="mobile-menu-header">
          <div
            className="navbar-brand-lockup"
            onClick={() => handleNav(onNavigateLanding)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <img
              src="/assets/icon.png"
              alt="SpiderPicks Logo"
              style={{ width: '30px', height: '30px', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Spider<span style={{ color: '#0a7d37' }}>Picks</span>
            </span>
          </div>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        {/* User / Authentication Status */}
        <div className="side-menu-auth-card">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crest name={user.n} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{user.n}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{user.e}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNav(onSignOut)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px', lineHeight: 1.4, fontWeight: 500 }}>
                Access verified picks, live score tracker, and community slips.
              </div>
              <button
                type="button"
                className="side-menu-primary-btn"
                onClick={() => handleNav(onSignIn)}
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>

        {/* Section Title */}
        <div className="side-menu-section-title">Navigation</div>

        {/* Navigation Links */}
        <div className="side-menu-list">
          {navItems.map((item, index) => (
            <button
              key={index}
              type="button"
              className={`side-menu-item ${item.active ? 'active' : ''}`}
              onClick={item.onClick}
            >
              <span className="side-menu-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d={item.icon} />
                </svg>
              </span>
              <span className="side-menu-item-label">{item.label}</span>
              <span className="side-menu-item-chevron">›</span>
            </button>
          ))}
        </div>

        {/* Footer section with legal links */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#64748b' }}>
            <a
              onClick={() => handleNav(() => onOpenLegal('terms'))}
              style={{ color: '#475569', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
            >
              Terms of Service
            </a>
            <span>&bull;</span>
            <a
              onClick={() => handleNav(() => onOpenLegal('privacy'))}
              style={{ color: '#475569', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
            >
              Privacy Policy
            </a>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
            SpiderPicks &copy; 2026. Smarter football intelligence.
          </div>
        </div>
      </div>
    </div>
  );
};
