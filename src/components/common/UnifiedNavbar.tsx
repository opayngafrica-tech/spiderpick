import React from 'react';
import { Ico } from './Icons';
import { Crest } from './Crest';

export interface UnifiedNavbarProps {
  currentRoute: string; // '', 'live', 'picks', 'analysis', 'membership', 'profile', etc.
  isLandingPage?: boolean;
  user: { n: string; e: string; role?: string } | null;
  onNavigateLanding: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onNavigateApp: (route: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenMenu?: () => void;
}

export const UnifiedNavbar: React.FC<UnifiedNavbarProps> = ({
  currentRoute,
  isLandingPage = false,
  user,
  onNavigateLanding,
  onNavigateSection,
  onNavigateApp,
  onSignIn,
  onSignOut,
  onOpenMenu,
}) => {
  const handleBrandClick = () => {
    if (isLandingPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigateLanding();
    }
  };

  const handleSectionClick = (sectionId: string) => {
    if (isLandingPage) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      onNavigateLanding();
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  return (
    <nav className="ln-separated">
      <div className="ln-inner">
        {/* Left: Mobile Hamburger Button + Brand Lockup */}
        <div className="navbar-left-cluster" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenMenu && (
            <button
              type="button"
              className="mb mobile-menu-btn"
              onClick={onOpenMenu}
              aria-label="Navigation Menu"
            >
              <Ico path="M4 7h16M4 12h16M4 17h16" />
            </button>
          )}

          <div
            className="navbar-brand-lockup"
            onClick={handleBrandClick}
            style={{ cursor: 'pointer' }}
          >
            <img
              src="/assets/icon.png"
              alt="SpiderPicks Logo"
              className="navbar-brand-logo-img"
            />
            <span className="navbar-brand-title">
              Spider<span className="text-emerald">Picks</span>
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <div className="lk2">
          <a
            className={isLandingPage ? 'active' : ''}
            onClick={() => handleSectionClick('features')}
          >
            Features
          </a>
          {typeof window !== 'undefined' && localStorage.getItem('sa_live_mode') !== 'hidden' && (
            <a
              className={!isLandingPage && currentRoute === 'live' ? 'active' : ''}
              onClick={() => onNavigateApp('live')}
            >
              Live Scores
            </a>
          )}
          <a
            className={!isLandingPage && currentRoute === 'picks' ? 'active' : ''}
            onClick={() => onNavigateApp('picks')}
          >
            Daily Picks
          </a>
          <a
            className={!isLandingPage && currentRoute === 'analysis' ? 'active' : ''}
            onClick={() => onNavigateApp('analysis')}
          >
            Analysis
          </a>
          <a
            className={!isLandingPage && currentRoute === 'membership' ? 'active' : ''}
            onClick={() => onNavigateApp('membership')}
          >
            Membership
          </a>
          <a
            onClick={() => handleSectionClick('faq')}
            style={{ cursor: 'pointer' }}
          >
            FAQ
          </a>
        </div>

        {/* Right Action Area - DESKTOP ONLY on app header (Mobile viewers use bottom stationary bar & profile tab) */}
        <div className="ra desktop-only-action-cluster">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                className="navbar-user-pill"
                onClick={() => onNavigateApp('profile')}
                title="View Profile & Settings"
              >
                <Crest name={user.n} />
                <span className="navbar-user-name">{user.n}</span>
                {user.role === 'admin' && (
                  <span style={{ fontSize: '9px', fontWeight: 900, background: '#f59e0b', color: '#000', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Admin
                  </span>
                )}
              </div>
              <button
                type="button"
                className="gh landing-signin-btn navbar-signout-btn"
                onClick={onSignOut}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="gh landing-signin-btn"
              onClick={onSignIn}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
