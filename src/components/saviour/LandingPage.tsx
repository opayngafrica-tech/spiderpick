import React, { useState, useEffect, useRef } from 'react';
import { Ico, I } from '../common/Icons';
import { Crest } from '../common/Crest';
import { UnifiedNavbar } from '../common/UnifiedNavbar';
import { MatchItem } from '../../types/football';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onOpenFeed?: () => void;
  onNavigateApp?: (route: string) => void;
  isLoggedIn?: boolean;
  user?: { n: string; e: string } | null;
  onSignOut?: () => void;
  onOpenLegal: (key: 'privacy' | 'terms' | 'responsible') => void;
  onOpenMenu?: () => void;
  matches?: MatchItem[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  onOpenFeed,
  onNavigateApp,
  isLoggedIn,
  user,
  onSignOut,
  onOpenLegal,
  onOpenMenu,
  matches = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('wide');
    return () => {
      document.body.classList.remove('wide');
    };
  }, []);

  // One-way downward scroll-reveal observer:
  // Motion happens ONLY when scrolling towards the footer.
  // When scrolling back up, elements remain visible and normal (never replay backwards & forwards)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target); // Keep visible; never animate backward
          }
        });
      },
      { threshold: 0.08 }
    );

    const elements = document.querySelectorAll('.rvs');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  // Actual League & Competition Logos (replacing emojis)
  const competitionLogos = [
    { name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png" },
    { name: "Champions League", logo: "https://media.api-sports.io/football/leagues/2.png" },
    { name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png" },
    { name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png" },
    { name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png" },
    { name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png" },
    { name: "Europa League", logo: "https://media.api-sports.io/football/leagues/3.png" },
    { name: "Saudi Pro League", logo: "https://media.api-sports.io/football/leagues/307.png" },
    { name: "Major League Soccer", logo: "https://media.api-sports.io/football/leagues/253.png" },
    { name: "CAF Champions", logo: "https://media.api-sports.io/football/leagues/12.png" },
  ];

  const features = [
    {
      icon: "M4 20V10M10 20V4M16 20v-8M22 20H2",
      title: "Algorithmic Daily Picks",
      desc: "Confidence-graded match tips, expected value ratings, and form analysis for top leagues.",
    },
    {
      icon: "M13 2L4 14h7l-1 8 9-12h-7z",
      title: "Live Scores & In-Play",
      desc: "Real-time scores, match minutes, in-play momentum, and live betting tips as action unfolds.",
    },
    {
      icon: "M3 3v18h18M7 15l4-4 3 3 5-6",
      title: "Deep Match Analysis",
      desc: "Poisson distribution probabilities, head-to-head records, and team form trends.",
    },
    {
      icon: I.c,
      title: "Passionate Fan Community",
      desc: "Share match insights, screenshots, and SportyBet & Bet9ja booking codes instantly.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Create Free Account",
      desc: "Takes 30 seconds. No credit card or deposit needed.",
    },
    {
      num: "02",
      title: "Inspect Today's Picks",
      desc: "Filter by league, confidence rating, or 85%+ Banker status.",
    },
    {
      num: "03",
      title: "Engage in the Feed",
      desc: "Discuss games with fans, post tips, and copy accumulator booking codes.",
    },
  ];

  const [landingVipCycle, setLandingVipCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const faqs = [
    {
      q: "Are the predictions guaranteed?",
      a: "No football outcome can ever be 100% physically guaranteed due to the unpredictable nature of sport. However, our '100% Low-Risk Banker' selections represent our highest statistical confidence tier (often exceeding 85–92% historical probability) based on expected goals (xG), Poisson bivariate distribution, and defensive clean sheet metrics. We always advocate strict bankroll discipline and responsible staking.",
    },
    {
      q: "How does the AI Match Analysis Engine work?",
      a: "Our engine combines Dixon-Coles time-decay Poisson modeling with live Gemini AI intelligence. It evaluates home and away goal expectancy, attack/defense ratios, squad fatigue, recent head-to-head records, and referee tendencies to generate exact scorelines, 14 mandatory betting markets, and projected corner lines.",
    },
    {
      q: "Can I export or copy the AI prompt to external LLMs like ChatGPT or Claude?",
      a: "Yes! On any match analysis page or the manual match analyzer, simply click 'Copy AI Prompt' or 'Copy Master Prompt'. It formats the entire structured statistical dossier into an optimized master prompt that you can paste directly into ChatGPT, Claude, DeepSeek, or Gemini for second opinions.",
    },
    {
      q: "What is the difference between Daily Picks and the Match Analysis tab?",
      a: "Daily Picks is your daily quick-hit briefing: curated algorithmic match tips, confidence grades, filterable high-probability banker slips, and community discussions for today's top games. The Match Analysis tab lets you dive into dedicated multi-tab breakdowns for any specific fixture with 14 markets, Poisson score distribution, and squad news.",
    },
    {
      q: "Which 14 betting markets are covered in the detailed analysis?",
      a: "Every match is evaluated across 14 statistical markets: Full-Time 1X2, Double Chance (1X, 12, X2), Over/Under 1.5 Goals, Over/Under 2.5 Goals, Over/Under 3.5 Goals, Both Teams to Score (GG/NG), Draw No Bet (DNB), Half-Time Result, Half-Time/Full-Time (HT/FT), Total Goals Odd/Even, First Team to Score, Clean Sheet Probabilities, Corner Total Lines, and Asian Handicap lines.",
    },
    {
      q: "How are corner statistics calculated?",
      a: "Corner models are calculated independently from goals. Our Poisson corner model tracks each club's average corners won and conceded per 90 minutes, crossing frequency, wing play dominance, and defensive block rates to project total corners and safe under/over lines.",
    },
    {
      q: "What booking codes and sportsbooks are supported?",
      a: "Spider Picks supports community booking codes for major African and global bookmakers including SportyBet, Bet9ja, 1xBet, BetKing, and Betway. You can copy booking codes straight from user slips and load them into your betting app in seconds.",
    },
    {
      q: "Can I analyze matches that are not in today's live score list?",
      a: "Yes! Use the 'Manual Match Analysis (World Football)' section on the analysis tab. You can enter any two teams worldwide (e.g. Brazilian Serie A, Argentine Primera, African Champions League, MLS, or international friendlies), select the league and date, and run an instant algorithmic analysis or copy its external AI master prompt.",
    },
    {
      q: "How does the Live Score and in-play ticker work?",
      a: "The Live tab provides real-time minute-by-minute scorelines, live status indicators, elapsed match timers, and halftime/fulltime scores with fast filters across Premier League, Champions League, La Liga, Serie A, Bundesliga, and endless leagues worldwide.",
    },
    {
      q: "Is Spider Picks free to use and what are the VIP fees?",
      a: "Yes, Spider Picks is free for all core features including daily algorithmic picks, live match tickers, full AI match analyses, and community feed sharing. For serious punters seeking daily 85%+ banker accumulators, instant Telegram and WhatsApp drops, and booking codes, our VIP subscription fees are ₦2,000 per week, ₦5,000 monthly, and ₦50,000 yearly (which saves you ₦10,000 on full-season coverage).",
    },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="lp" ref={containerRef}>
      {/* ========================================================
          1. TOP NAVBAR WITH CLEAN SEPARATION & NO MOBILE OVERLAP
          ======================================================== */}
      <UnifiedNavbar
        currentRoute=""
        isLandingPage={true}
        user={isLoggedIn ? (user || { n: 'Member', e: '' }) : null}
        onNavigateLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateSection={scrollToSection}
        onNavigateApp={(targetRoute) => (onNavigateApp ? onNavigateApp(targetRoute) : onGetStarted())}
        onSignIn={onSignIn}
        onSignOut={onSignOut || (() => {})}
        onOpenMenu={onOpenMenu}
      />

      {/* ========================================================
          2. HERO SECTION WITH SEPARATION & PERSON PHONE MOCKUP
          ======================================================== */}
      <section className="hr-hero">
        <div className="hw-hero">
          <div className="hero-text-col">
            <div className="hero-tag-pill up1">
              <span className="pill-pulse"></span>
              <span>2026/27 FOOTBALL INTELLIGENCE</span>
            </div>

            <h1 className="hero-title up1">
              Smarter football picks, shared by fans.
            </h1>

            <p className="hero-subtitle up2">
              Daily algorithmic predictions, live match scores, and a passionate football community feed all in one sleek platform.
            </p>

            <div className="hero-cta-group up3">
              {isLoggedIn ? (
                <button className="cta" onClick={onOpenFeed}>
                  Open Fan Feed & Picks &rarr;
                </button>
              ) : (
                <>
                  <button className="cta" onClick={onGetStarted}>
                    Create Free Account &rarr;
                  </button>
                  <button
                    className="hero-explore-btn"
                    onClick={() => onNavigateApp ? onNavigateApp('picks') : onGetStarted()}
                  >
                    Explore Picks &rarr;
                  </button>
                </>
              )}
            </div>

            {/* Micro Trust Indicators */}
            <div className="hero-trust-row up3">
              <div className="trust-item">
                <span className="check-mark">✓</span>
                <span>85%+ Banker Rate</span>
              </div>
              <div className="trust-item">
                <span className="check-mark">✓</span>
                <span>Live In-Play Alerts</span>
              </div>
              <div className="trust-item">
                <span className="check-mark">✓</span>
                <span>100% Free Access</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              HERO VISUAL: PERSON HOLDING PHONE MOCKUP WITH FLOATING BADGES
              ======================================================== */}
          <div className="hero-visual-col up4">
            <div className="hero-phone-stage">
              {/* Emerald ambient glow */}
              <div className="hero-glow-backdrop"></div>

              {/* Real Person with Phone Mockup Image */}
              <img
                src="/assets/hero-phone.png"
                alt="Spider Picks Football App"
                className="hero-phone-mockup"
                onError={(e) => {
                  e.currentTarget.src = 'https://photos.app.goo.gl/UMGvBm67Rxu3LQ9n6';
                }}
              />

              {/* Floating Badge 1: Live In-Play Match */}
              <div className="hero-floating-badge badge-live">
                <div className="badge-live-pulse"></div>
                <b>Live 67'</b>
                <span className="badge-sep">·</span>
                <span>Arsenal 2 - 1 Chelsea</span>
              </div>

              {/* Floating Badge 2: Banker Confidence Card */}
              <div className="hero-floating-badge badge-banker">
                <div className="badge-top-row">
                  <span className="badge-chip">BANKER PICK</span>
                  <span className="badge-conf-pct">88% Confidence</span>
                </div>
                <div className="badge-match-tip">Over 1.5 Goals @ 1.35</div>
                <div className="badge-progress-wrap">
                  <div className="badge-progress-bar"></div>
                </div>
              </div>

              {/* Floating Badge 3: Booking Code */}
              <div className="hero-floating-badge badge-code">
                <span className="code-label">BOOKING CODE:</span>
                <span className="code-pill">SP-ARS-CHE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. LEAGUE MARQUEE TICKER (ACTUAL COMPETITION LOGOS)
          ======================================================== */}
      <div className="mq-ticker">
        <div className="mq-track">
          {competitionLogos.concat(competitionLogos).concat(competitionLogos).map((comp, idx) => (
            <span key={idx} className="mq-item">
              <img
                src={comp.logo}
                alt={comp.name}
                style={{
                  width: '22px',
                  height: '22px',
                  objectFit: 'contain',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  padding: '2px',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span style={{ fontWeight: 800 }}>{comp.name}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ========================================================
          4. FEATURES SECTION (WITH ENHANCED MOTIONS & HOVERS)
          ======================================================== */}
      <section className="sw2 rvs" id="features">
        <div className="section-header">
          <span className="section-pill">EVERYTHING YOU NEED</span>
          <h2>Built for the Modern Football Fan</h2>
          <p className="section-sub">
            From algorithmic confidence metrics to live goal momentum and community accas.
          </p>
        </div>

        <div className="fg">
          {features.map((f, i) => (
            <div
              className={`fcd rvs up${(i % 4) + 1}`}
              key={i}
              style={{
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 125, 55, 0.14)';
                e.currentTarget.style.borderColor = 'var(--g)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--ln)';
              }}
            >
              <div className="fcd-icon-box">
                <Ico path={f.icon} />
              </div>
              <b>{f.title}</b>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          5. TODAY'S DAILY BANKER PICKS SHOWCASE SECTION
          ======================================================== */}
      <section className="sw2 rvs" id="picks" style={{ paddingTop: '10px' }}>
        <div className="section-header">
          <span className="section-pill">TODAY'S HIGHEST CONFIDENCE</span>
          <h2>Algorithmic Daily Banker Picks</h2>
          <p className="section-sub">
            Calculated with Poisson goal modeling, head-to-head metrics, and 85%+ statistical probability.
          </p>
        </div>

        {matches.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--s)',
              border: '1px solid var(--ln)',
              borderRadius: '16px',
              maxWidth: '540px',
              margin: '0 auto 24px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(10, 125, 55, 0.08)',
                color: 'var(--g)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Ico path={I.b} />
            </div>
            <b style={{ fontSize: '16px', color: 'var(--tx)', display: 'block', marginBottom: '4px' }}>
              No games published today yet
            </b>
            <p style={{ fontSize: '12px', color: 'var(--mu)', margin: 0 }}>
              Our expert analysts are verifying algorithmic confidence metrics. Check back soon for today's banker picks!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              maxWidth: '960px',
              margin: '0 auto 24px',
            }}
          >
            {matches.slice(0, 3).map((item, idx) => (
              <div
                key={item.id || idx}
                className={`rvs up${idx + 1}`}
                style={{
                  background: 'var(--s)',
                  border: '1px solid var(--ln)',
                  borderRadius: '16px',
                  padding: '18px 16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
                  cursor: 'pointer',
                }}
                onClick={() => onNavigateApp ? onNavigateApp('picks') : onGetStarted()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(10, 125, 55, 0.14)';
                  e.currentTarget.style.borderColor = 'var(--g)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = 'var(--ln)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--g)', background: 'rgba(10, 125, 55, 0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                    {item.l}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--mu)', fontWeight: 600 }}>{item.t}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Crest name={item.h} />
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--tx)' }}>{item.h}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Crest name={item.a} />
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--tx)' }}>{item.a}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', background: 'var(--s2)', padding: '8px 12px', borderRadius: '10px' }}>
                    <b style={{ color: 'var(--g)', fontSize: '16px', display: 'block' }}>{item.c}%</b>
                    <span style={{ fontSize: '11px', color: 'var(--mu)', fontWeight: 600 }}>Confidence</span>
                  </div>
                </div>

                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--ln)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <small style={{ fontSize: '11px', color: 'var(--mu)', display: 'block' }}>Banker Selection</small>
                    <b style={{ fontSize: '13px', color: 'var(--tx)' }}>{item.tip}</b>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--g)' }}>@{Number(item.o || 1.5).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            className="cta"
            onClick={() => onNavigateApp ? onNavigateApp('picks') : onGetStarted()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Explore All Today's Banker Picks</span>
            <span>&rarr;</span>
          </button>
        </div>
      </section>

      {/* ========================================================
          6. HOW IT WORKS / STEPS
          ======================================================== */}
      <section className="sw2 rvs" id="steps">
        <div className="section-header">
          <span className="section-pill">SIMPLE & INSTANT</span>
          <h2>Start Winning in Three Steps</h2>
        </div>

        <div className="stp-grid">
          {steps.map((st, i) => (
            <div className="stp-card rvs" key={i}>
              <div className="stp-num">{st.num}</div>
              <b>{st.title}</b>
              <p>{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          7. PRICING & MEMBERSHIP CLUB SECTION
          ======================================================== */}
      <section className="sw2 rvs" id="pricing">
        <div className="section-header">
          <span className="section-pill">MEMBERSHIP PLANS</span>
          <h2>Choose Your Prediction Edge</h2>
          <p className="section-sub">
            Get started completely free or join our high-confidence VIP Members Club.
          </p>

          {/* Interactive VIP Billing Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px' }}>
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--s2)',
                padding: '4px',
                borderRadius: '99px',
                border: '1px solid var(--ln)',
                gap: '4px',
              }}
            >
              {[
                { id: 'weekly', label: 'Weekly', price: '₦2,000' },
                { id: 'monthly', label: 'Monthly', price: '₦5,000', popular: true },
                { id: 'yearly', label: 'Yearly', price: '₦50,000', save: 'Save ₦10k' },
              ].map((c) => {
                const isSelected = landingVipCycle === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setLandingVipCycle(c.id as any)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '99px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 800 : 600,
                      background: isSelected ? 'var(--g)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--tx)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{c.label}</span>
                    <span style={{ opacity: isSelected ? 1 : 0.8, fontSize: '12px' }}>({c.price})</span>
                    {c.popular && (
                      <span style={{ fontSize: '9px', fontWeight: 900, background: '#ffffff33', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        Popular
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pg">
          {/* Free Tier */}
          <div className="pc rvs">
            <span className="tier-pill free">FREE FOREVER</span>
            <b>Standard Free</b>
            <div className="pr">Free</div>
            <p className="plan-desc">
              Essential match predictions, live scores, and fan community feed for all leagues.
            </p>
            <ul className="plan-features">
              <li>✓ Daily curated match predictions</li>
              <li>✓ Live in-play scores & match minute</li>
              <li>✓ Community feed & booking codes</li>
              <li>✓ Team head-to-head stats & basic form</li>
            </ul>
            <button className="pbn" onClick={isLoggedIn ? onOpenFeed : onGetStarted}>
              {isLoggedIn ? "Open Your Feed" : "Start Free Today"}
            </button>
          </div>

          {/* VIP Club Tier */}
          <div className="pc pro rvs">
            <span className="tg" style={{ background: landingVipCycle === 'monthly' ? '#ffffff' : '#fef3c7', color: landingVipCycle === 'monthly' ? 'var(--g2)' : '#92400e' }}>
              {landingVipCycle === 'weekly' ? 'FLEXIBLE' : landingVipCycle === 'monthly' ? 'MOST POPULAR' : 'SAVE ₦10,000'}
            </span>
            <b>VIP Members Club</b>
            <div className="pr" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span>{landingVipCycle === 'weekly' ? '₦2,000' : landingVipCycle === 'monthly' ? '₦5,000' : '₦50,000'}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.85 }}>
                {landingVipCycle === 'weekly' ? '/ week' : landingVipCycle === 'monthly' ? '/ month' : '/ year'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#bbf7d0', fontWeight: 700, marginTop: '-4px' }}>
              {landingVipCycle === 'weekly'
                ? '₦2,000 per week · Weekend accas'
                : landingVipCycle === 'monthly'
                ? '₦5,000 monthly · Full 30 days coverage'
                : '₦50,000 yearly · Full season access (Save ₦10,000)'}
            </div>
            <p className="plan-desc" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Verified daily 85%+ banker accumulators, instant Telegram and WhatsApp drops, and Poisson models.
            </p>
            <ul className="plan-features">
              <li>✓ Everything in Standard Free</li>
              <li>✓ Daily 85%+ Banker Accumulators</li>
              <li>✓ Private Telegram & WhatsApp Alerts</li>
              <li>✓ SportyBet & Bet9ja Direct Booking Codes</li>
              <li>✓ Poisson & Expected Goals (xG) Models</li>
              <li>✓ Ad-free experience & priority support</li>
            </ul>
            <button
              className="pbn pbtn"
              onClick={() => onNavigateApp ? onNavigateApp('membership') : onGetStarted()}
            >
              Subscribe to VIP ({landingVipCycle === 'weekly' ? '₦2,000' : landingVipCycle === 'monthly' ? '₦5,000' : '₦50,000'}) &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. FAQ ACCORDION SECTION
          ======================================================== */}
      <section className="sw2 rvs fq" id="faq">
        <div className="section-header">
          <span className="section-pill">HAVE QUESTIONS?</span>
          <h2>Frequently Asked Questions</h2>
        </div>

        <div className="faq-list">
          {faqs.map((q, i) => (
            <details key={i} className="faq-item">
              <summary>{q.q}</summary>
              <p>{q.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ========================================================
          9. CALL TO ACTION BANNER
          ======================================================== */}
      <section className="cb rvs">
        <h2>Ready for kickoff?</h2>
        <p style={{ maxWidth: '480px', margin: '10px auto 24px', opacity: 0.9, fontSize: '15px' }}>
          Join Spider Picks today and access the smartest football analysis in seconds.
        </p>
        <button className="cta" onClick={isLoggedIn ? onOpenFeed : onGetStarted}>
          {isLoggedIn ? "Open Fan Feed" : "Create Free Account Now"}
        </button>
      </section>

      {/* ========================================================
          10. FOOTER
          ======================================================== */}
      <footer className="ft2">
        <div className="fw">
          <div>
            <div className="footer-icon-lockup">
              <img
                src="/assets/icon.png"
                alt="SpiderPicks"
                style={{
                  height: '46px',
                  width: '46px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 10px rgba(10, 125, 55, 0.45))',
                }}
              />
              <div className="footer-title-text">
                <span style={{ color: '#ffffff', fontWeight: 900 }}>SPIDER </span>
                <span style={{ color: 'var(--g)', fontWeight: 900 }}>PICKS</span>
              </div>
            </div>
            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--mu)', maxWidth: '300px', lineHeight: 1.5 }}>
              SpiderPicks: Smarter football predictions, live scores, and passionate fan community.
            </p>
          </div>

          <div>
            <b>Navigation</b>
            <a onClick={() => scrollToSection('features')}>Features</a>
            <a onClick={() => scrollToSection('picks')}>Daily Picks</a>
            <a onClick={() => scrollToSection('steps')}>How It Works</a>
            <a onClick={() => scrollToSection('pricing')}>Membership Plans</a>
            <a onClick={() => scrollToSection('faq')}>FAQ</a>
          </div>

          <div>
            <b>Legal & Safety</b>
            <a onClick={() => onOpenLegal('privacy')}>Privacy Policy</a>
            <a onClick={() => onOpenLegal('terms')}>Terms of Service</a>
            <a onClick={() => onOpenLegal('responsible')}>Responsible Betting</a>
          </div>

          <div className="acc">
            <b>Account</b>
            {isLoggedIn ? (
              <a onClick={onOpenFeed}>Open feed</a>
            ) : (
              <>
                <a onClick={onSignIn}>Sign in</a>
                <a onClick={onGetStarted}>Create free account</a>
              </>
            )}
          </div>
        </div>

        <p className="cp">
          &copy; 2026 SpiderPicks. Statistical analysis only. 18+. Gamble responsibly.
        </p>
      </footer>
    </div>
  );
};
