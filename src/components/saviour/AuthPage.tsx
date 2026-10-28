import React, { useState } from 'react';
import { Si } from '../common/Icons';
import { BrandWordmark } from '../common/BrandWordmark';
import { Crest } from '../common/Crest';
import { supabase } from '../../utils/supabase';

interface AuthPageProps {
  initialMode?: 'in' | 'up';
  onSuccess: (user: {
    n: string;
    e: string;
    id?: string;
    role?: 'admin' | 'moderator' | 'user';
    isVip?: boolean;
    subscriptionTier?: string;
  }) => void;
  onBackHome: () => void;
  onOpenLegal: (key: 'privacy' | 'terms' | 'responsible') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'in',
  onSuccess,
  onBackHome,
  onOpenLegal,
}) => {
  const [mode, setMode] = useState<'in' | 'up'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'up';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotMsg('');

    const em = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) {
      setErrorMsg('Enter a valid email.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password needs 6 or more characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const name = fullName.trim() || em.split('@')[0];
        const { data, error } = await supabase.auth.signUp({
          email: em,
          password: password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          // Auto create or update profile in profiles table
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: em,
              full_name: name,
              role: 'user',
              subscription_tier: 'free',
            });
          } catch (profileErr) {
            console.warn('Profile sync note:', profileErr);
          }

          onSuccess({
            id: data.user.id,
            n: name,
            e: em,
            role: 'user',
            subscriptionTier: 'free',
            isVip: false,
          });
        } else {
          setErrorMsg('Account created! Please check your email to confirm registration or sign in.');
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: em,
          password: password,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          let userRole: 'admin' | 'user' = 'user';
          let subTier = 'free';
          let displayName = data.user.user_metadata?.full_name || em.split('@')[0];

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            if (profile) {
              userRole = profile.role === 'admin' || profile.subscription_tier === 'admin' ? 'admin' : 'user';
              subTier = profile.subscription_tier || 'free';
              displayName = profile.full_name || displayName;
            } else {
              // Create profile if missing
              await supabase.from('profiles').insert({
                id: data.user.id,
                email: em,
                full_name: displayName,
                role: 'user',
                subscription_tier: 'free',
              });
            }
          } catch (profileFetchErr) {
            console.warn('Profile read note:', profileFetchErr);
          }

          onSuccess({
            id: data.user.id,
            n: displayName,
            e: em,
            role: userRole,
            subscriptionTier: subTier,
            isVip: subTier === 'vip' || userRole === 'admin',
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Enter your email above first.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        setErrorMsg(error.message);
      } else {
        setForgotMsg(`Password reset instructions sent to ${email.trim()}.`);
        setErrorMsg('');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send reset email.');
    }
  };

  const handleQuickDemo = () => {
    onSuccess({ n: 'Spider Member', e: 'member@spiderpicks.com', role: 'user', subscriptionTier: 'free', isVip: false });
  };

  return (
    <div className="auth">
      {/* ========================================================
          1. MOBILE VIEW (< 768px)
          Faithfully matches the mobile single-column curved design
          ======================================================== */}
      <div className="auth-mobile-view">
        {/* Flat Brand Navigation: Back icon on left of logo, flat directly on design */}
        <div className="auth-flat-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="auth-back-icon-btn"
              onClick={onBackHome}
              aria-label="Back to Landing Page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Logo directly on flat background, no card wrapper, no shadow */}
            <div className="auth-flat-logo" onClick={onBackHome}>
              <img
                src="/assets/icon.png"
                alt="Spider Picks"
                style={{ width: '34px', height: '34px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                Spider<span style={{ color: 'var(--g)' }}>Picks</span>
              </span>
            </div>
          </div>

          {/* Flat Members Badge without shadow */}
          <span className="auth-flat-badge">Members</span>
        </div>

        <div className="ttl">
          <h2>{isSignUp ? 'Create account' : 'Sign in'}</h2>
          <p>Spider Picks — Smarter football predictions</p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <label>Full Name</label>
              <div className="in">
                <Si path="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" />
                <input
                  type="text"
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </>
          )}

          <label>Email</label>
          <div className="in">
            <Si path="M3 6h18v12H3zM3 7l9 7 9-7" />
            <input
              id="em"
              type="email"
              placeholder="you@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label>Password</label>
          <div className="in">
            <Si path="M6 11h12v9H6zM8 11V8a4 4 0 018 0v3" />
            <input
              id="pw"
              type={showPassword ? 'text' : 'password'}
              placeholder="6+ characters"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="eye"
              aria-label="Show password"
              onClick={() => setShowPassword(!showPassword)}
            >
              <Si path="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6" />
            </button>
          </div>

          <div className="er" id="er">
            {errorMsg}
            {forgotMsg && <span style={{ color: '#fff' }}>{forgotMsg}</span>}
          </div>

          {!isSignUp && (
            <a className="fp" onClick={handleForgotPassword}>
              Forgot password?
            </a>
          )}

          <button type="submit" className="go" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

          <p className="cn">
            By continuing you agree to our{' '}
            <a onClick={() => onOpenLegal('terms')}>Terms</a> and{' '}
            <a onClick={() => onOpenLegal('privacy')}>Privacy Policy</a>.
          </p>

          <small
            onClick={() => {
              setMode(isSignUp ? 'in' : 'up');
              setErrorMsg('');
              setForgotMsg('');
            }}
          >
            {isSignUp ? 'Have an account? Sign in' : 'New here? Create account'}
          </small>
        </form>
      </div>

      {/* ========================================================
          2. TABLET & DESKTOP VIEW (>= 768px)
          Clean, modern 2-column card layout with landing motions
          ======================================================== */}
      <div className="auth-desktop-wrapper">
        {/* Left Showcase Pane */}
        <div className="auth-desktop-showcase">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onBackHome}
                  className="auth-back-icon-btn"
                  aria-label="Back to Landing Page"
                  style={{
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src="/assets/icon.png"
                    alt="SpiderPicks"
                    style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                    Spider<span style={{ color: '#86efac' }}>Picks</span>
                  </span>
                </div>
              </div>

              <span
                className="auth-flat-badge"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                Members
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.5px', marginBottom: '12px' }}>
                Football intelligence & verified predictions.
              </h2>
              <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: 1.5, marginBottom: '26px' }}>
                Join thousands of football enthusiasts accessing daily algorithmic picks, live match momentum, and exclusive banker accumulators.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', color: 'var(--g2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Daily 85%+ Banker Accumulators with odds calculation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', color: 'var(--g2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Live match score ticker with minute-by-minute updates</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', color: 'var(--g2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Community feed for sharing thoughts and SportyBet/Bet9ja booking codes</span>
              </div>
            </div>
          </div>

          {/* Mini Live Match Card Preview (Solid brand card) */}
          <div
            style={{
              background: '#044a1e',
              borderRadius: '16px',
              padding: '14px 16px',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              marginTop: '30px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', opacity: 0.85, fontWeight: 700, marginBottom: '8px' }}>
              <span>PREMIER LEAGUE · TODAY</span>
              <span style={{ background: '#ffffff33', padding: '2px 8px', borderRadius: '99px' }}>Banker Pick</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crest name="Arsenal" />
                <span>Arsenal vs Chelsea</span>
              </div>
              <span style={{ color: '#ffffff' }}>88% Conf.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ fontWeight: 600 }}>Tip: Over 1.5 Goals</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>@1.35</span>
            </div>
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="auth-desktop-form-pane">
          {/* Segmented Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--s2)',
              padding: '4px',
              borderRadius: '99px',
              marginBottom: '24px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('in');
                setErrorMsg('');
                setForgotMsg('');
              }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: '99px',
                fontWeight: 700,
                fontSize: '13px',
                color: !isSignUp ? '#ffffff' : 'var(--mu)',
                background: !isSignUp ? 'var(--g)' : 'transparent',
                transition: 'all 0.2s',
                boxShadow: !isSignUp ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('up');
                setErrorMsg('');
                setForgotMsg('');
              }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: '99px',
                fontWeight: 700,
                fontSize: '13px',
                color: isSignUp ? '#ffffff' : 'var(--mu)',
                background: isSignUp ? 'var(--g)' : 'transparent',
                transition: 'all 0.2s',
                boxShadow: isSignUp ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.3px' }}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--mu)', marginTop: '2px' }}>
              {isSignUp
                ? 'Fill in your details below to start using Spider Picks.'
                : 'Enter your account credentials to access your saved picks.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--tx)' }}>
                  Full Name
                </label>
                <div className="in">
                  <Si path="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" />
                  <input
                    type="text"
                    placeholder="e.g. Alex Cole"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--tx)' }}>
                Email Address
              </label>
              <div className="in">
                <Si path="M3 6h18v12H3zM3 7l9 7 9-7" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontWeight: 600, fontSize: '12px', color: 'var(--tx)' }}>Password</label>
                {!isSignUp && (
                  <a
                    onClick={handleForgotPassword}
                    style={{ fontSize: '12px', color: 'var(--g)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="in">
                <Si path="M6 11h12v9H6zM8 11V8a4 4 0 018 0v3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6+ characters"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye"
                  aria-label="Show password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Si path="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6" />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(217, 58, 58, 0.1)', color: 'var(--no)', fontSize: '12px', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            {forgotMsg && (
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(10, 125, 55, 0.1)', color: 'var(--g)', fontSize: '12px', fontWeight: 600 }}>
                {forgotMsg}
              </div>
            )}

            <button type="submit" className="go" disabled={loading} style={{ height: '48px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in to Spider Picks'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--mu)', marginTop: '20px' }}>
            By continuing you agree to our{' '}
            <a onClick={() => onOpenLegal('terms')} style={{ color: 'var(--g)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
              Terms
            </a>{' '}
            and{' '}
            <a onClick={() => onOpenLegal('privacy')} style={{ color: 'var(--g)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
