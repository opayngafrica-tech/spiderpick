import React, { useState, useEffect } from 'react';
import { Crest } from '../common/Crest';
import {
  AIFootballAnalysisResult,
  fetchAIMatchAnalysis,
  generateStatisticalAnalysis,
  buildMasterPromptForMatch,
} from '../../lib/aiFootballAnalysis';

// Clean SVG icon components replacing all emojis
const CopyIcon: React.FC<{ size?: number; color?: string }> = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ size?: number; color?: string }> = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CheckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon: React.FC<{ size?: number; color?: string }> = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SparklesIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

interface AnalysisPageProps {
  user?: { n: string; e: string; role?: string; isVip?: boolean; subscriptionTier?: string } | null;
  liveList?: any[];
  onOpenNotifications: () => void;
  onGoToLanding?: () => void;
  onOpenMenu?: () => void;
  onOpenMembership?: () => void;
  unreadCount: number;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  user,
  liveList = [],
  onOpenNotifications,
  onGoToLanding,
  onOpenMenu,
  onOpenMembership,
  unreadCount,
}) => {
  // Sync live matches from prop or directly from backend
  const [syncedLiveMatches, setSyncedLiveMatches] = useState<any[]>(liveList || []);

  useEffect(() => {
    if (Array.isArray(liveList) && liveList.length > 0) {
      setSyncedLiveMatches(liveList);
      return;
    }
    async function syncBackendLive() {
      try {
        const res = await fetch('/api/football/live');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : Array.isArray(data?.matches) ? data.matches : [];
          setSyncedLiveMatches(list);
        }
      } catch (err) {}
    }
    syncBackendLive();
    const timer = setInterval(syncBackendLive, 45000);
    return () => clearInterval(timer);
  }, [liveList]);

  // 5 Analyses per day tracking
  const todayKey = new Date().toISOString().slice(0, 10);
  const quotaStorageKey = `sa_ai_quota_${todayKey}`;

  const [dailyAnalysisCount, setDailyAnalysisCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(quotaStorageKey);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [quotaModalOpen, setQuotaModalOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isVip = isAdmin || Boolean(user?.isVip) || (Boolean(user?.subscriptionTier) && user?.subscriptionTier !== 'free');
  const remainingQuota = isVip ? 999 : Math.max(0, 5 - dailyAnalysisCount);

  // Page view: 'list' (Match Selection Hub) or 'detail' (Dedicated Analysis Page entirely)
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');

  // Currently active match details
  const [activeHome, setActiveHome] = useState<string>('Arsenal');
  const [activeAway, setActiveAway] = useState<string>('Chelsea');
  const [activeLeague, setActiveLeague] = useState<string>('Premier League');
  const [activeDate, setActiveDate] = useState<string>('Today 20:00');
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  // Manual inputs for World Football
  const [manualHome, setManualHome] = useState('');
  const [manualAway, setManualAway] = useState('');
  const [manualLeague, setManualLeague] = useState('');
  const [manualDate, setManualDate] = useState('');

  // Analysis result state
  const [analysisData, setAnalysisData] = useState<AIFootballAnalysisResult>(() =>
    generateStatisticalAnalysis('Arsenal', 'Chelsea', 'Premier League', 'Today 20:00')
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Detailed tab on analysis screen
  const [activeTab, setActiveTab] = useState<'bankers' | 'markets' | 'scores' | 'corners' | 'tactics'>('bankers');
  const [fixtureSearch, setFixtureSearch] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('all');

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => {
      setCopiedToast(null);
    }, 2800);
  };

  // Run analysis function
  const runAnalysis = async (home: string, away: string, comp: string, date: string) => {
    setLoading(true);
    try {
      const result = await fetchAIMatchAnalysis(home, away, comp, date);
      setAnalysisData(result);
    } catch {
      setAnalysisData(generateStatisticalAnalysis(home, away, comp, date));
    } finally {
      setLoading(false);
    }
  };

  // When clicking on a match card from the list: open a different page entirely!
  const handleSelectAndOpenMatch = (matchId: number) => {
    const m = syncedLiveMatches.find((item: any) => item.id === matchId);
    if (!m) return;

    if (!isVip && dailyAnalysisCount >= 5) {
      setQuotaModalOpen(true);
      return;
    }

    if (!isVip) {
      const nextCount = dailyAnalysisCount + 1;
      setDailyAnalysisCount(nextCount);
      localStorage.setItem(quotaStorageKey, String(nextCount));
    }

    setSelectedMatchId(matchId);
    setActiveHome(m.h || 'Home Team');
    setActiveAway(m.a || 'Away Team');
    setActiveLeague(m.l || 'Live Football');
    setActiveDate(m.t || m.m || 'Live');

    runAnalysis(m.h || 'Home Team', m.a || 'Away Team', m.l || 'Live Football', m.t || m.m || 'Live');
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Run manual analysis: open a different page entirely!
  const handleRunManualAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualHome.trim() || !manualAway.trim()) {
      showToast('Please enter both Home and Away team names');
      return;
    }

    if (!isVip && dailyAnalysisCount >= 5) {
      setQuotaModalOpen(true);
      return;
    }

    if (!isVip) {
      const nextCount = dailyAnalysisCount + 1;
      setDailyAnalysisCount(nextCount);
      localStorage.setItem(quotaStorageKey, String(nextCount));
    }

    const h = manualHome.trim();
    const a = manualAway.trim();
    const l = manualLeague.trim() || 'World Football';
    const d = manualDate.trim() || 'Upcoming';

    setSelectedMatchId(null);
    setActiveHome(h);
    setActiveAway(a);
    setActiveLeague(l);
    setActiveDate(d);

    runAnalysis(h, a, l, d);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setCurrentView('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Copy Master Prompt for external AI
  const handleCopyMasterPrompt = () => {
    const promptText = buildMasterPromptForMatch(activeHome, activeAway, activeLeague, activeDate);
    navigator.clipboard.writeText(promptText);
    showToast('Master Prompt copied! Ready to paste into any AI');
  };

  // Copy 100% Banker Predictions
  const handleCopyBankerPredictions = () => {
    const primaryBanker = analysisData.finalVerdict.strongestPicks[0] || 'Over 1.5 Goals';
    const secondaryBanker = analysisData.finalVerdict.strongestPicks[1] || 'Home or Draw (1X)';
    const topScore = analysisData.correctScores[0]?.score || '2 - 1';
    const topScoreProb = analysisData.correctScores[0]?.probability || 14.5;
    const cornerLine = analysisData.cornerStatistics.recommendedLine;

    const slip = `[SPIDERPICKS 100% BANKER PREDICTIONS]
====================================
Match: ${activeHome} vs ${activeAway}
League: ${activeLeague}
Kickoff: ${activeDate}
====================================
• Primary Low-Risk Banker: ${primaryBanker}
• Safe Result (Double Chance): ${secondaryBanker}
• Projected Corner Line: ${cornerLine}
• Poisson Exact Score: ${topScore} (${topScoreProb}% prob)
• Model Rating: High Statistical Defense
====================================
SpiderPicks AI Football Engine`;

    navigator.clipboard.writeText(slip);
    showToast('Banker Predictions copied to clipboard!');
  };

  // Filter fixtures reflecting Live Page
  const filteredFixtures = syncedLiveMatches.filter((m: any) => {
    const leagueName = m.l || 'Live Football';
    if (selectedLeagueFilter !== 'all' && leagueName !== selectedLeagueFilter) return false;
    if (fixtureSearch.trim()) {
      const q = fixtureSearch.toLowerCase();
      const txt = `${m.h || ''} ${m.a || ''} ${leagueName}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });

  const availableLeagues = ['all', 'Premier League', 'Champions League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px 14px 60px' }}>
      {/* Toast Notification */}
      {copiedToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0a7d37',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(10, 125, 55, 0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <CheckIcon size={16} color="#ffffff" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* ========================================================
          PAGE VIEW 1: MATCH SELECTION HUB (MATCH LIST & SEARCH)
          ======================================================== */}
      {currentView === 'list' && (
        <div className="analysis-list-view">
          {/* Clean, Simple Header matching Landing Page */}
          <div
            className="up1 rvs"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px 20px',
              marginBottom: '18px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#0a7d37',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    padding: '3px 10px',
                    borderRadius: '99px',
                    textTransform: 'uppercase',
                  }}
                >
                  AI Football Analysis
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Master Prediction Engine
                </span>
              </div>

              {/* Daily Quota Indicator */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isVip ? 'rgba(16, 185, 129, 0.12)' : dailyAnalysisCount >= 5 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(10, 125, 55, 0.08)',
                  border: isVip ? '1px solid #10b981' : dailyAnalysisCount >= 5 ? '1px solid #ef4444' : '1px solid rgba(10, 125, 55, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: isVip ? '#059669' : dailyAnalysisCount >= 5 ? '#dc2626' : '#0a7d37',
                }}
              >
                <span>{isVip ? '★ Unlimited VIP Access' : `AI Daily Quota: ${Math.max(0, 5 - dailyAnalysisCount)}/5 left`}</span>
              </div>
            </div>

            <h1
              style={{
                fontSize: 'clamp(20px, 3.8vw, 26px)',
                fontWeight: 900,
                letterSpacing: '-0.4px',
                color: '#0f172a',
                margin: '0 0 8px',
              }}
            >
              Select Match for Deep AI Analysis
            </h1>

            <p
              style={{
                fontSize: '13px',
                color: '#475569',
                lineHeight: 1.5,
                margin: 0,
                maxWidth: '720px',
              }}
            >
              Touch any match from today's live score fixtures below to open its dedicated full prediction analysis page, or enter any custom match worldwide.
            </p>
          </div>

          {/* 1. Manual AI Analysis: World Football (Placed right after Banner at top) */}
          <div
            className="up2 rvs in"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '22px 18px',
              marginBottom: '18px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    background: '#0a7d37',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Featured
                </span>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Manual Match Analysis (World Football)
                </h2>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Type in any two clubs or national teams worldwide to open an in-depth AI analysis page or copy the Master Prompt
              </span>
            </div>

            <form onSubmit={handleRunManualAnalysis}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    Home Team
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Juventus"
                    value={manualHome}
                    onChange={(e) => setManualHome(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    Away Team
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Napoli"
                    value={manualAway}
                    onChange={(e) => setManualAway(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    League / Competition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Serie A"
                    value={manualLeague}
                    onChange={(e) => setManualLeague(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    Date / Time of Game
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tonight, 20:45"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '11px 24px',
                    borderRadius: '8px',
                    background: '#0a7d37',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(10, 125, 55, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                >
                  {loading ? 'Analyzing...' : 'Open Dedicated Analysis Page →'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const h = manualHome.trim() || 'Home Team';
                    const a = manualAway.trim() || 'Away Team';
                    const l = manualLeague.trim() || 'League Match';
                    const d = manualDate.trim() || 'Upcoming';
                    const promptText = buildMasterPromptForMatch(h, a, l, d);
                    navigator.clipboard.writeText(promptText);
                    showToast('Master Prompt copied! Ready for ChatGPT/Claude/DeepSeek');
                  }}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CopyIcon size={15} color="#ffffff" />
                  <span>Copy Master Prompt for External AI</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Today's Fixtures & Live Matches (Placed Below Manual Analysis) */}
          <div
            className="up3 rvs in"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px 18px',
              marginBottom: '18px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Today's Fixtures & Live Matches
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Touch any live fixture to launch its deep statistical prediction breakdown
                </span>
              </div>

              {/* Quick Search */}
              <input
                type="text"
                placeholder="Search team (e.g. Arsenal, Madrid)..."
                value={fixtureSearch}
                onChange={(e) => setFixtureSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  maxWidth: '260px',
                  width: '100%',
                }}
              />
            </div>

            {/* If NO live features are active: show clean 'No match features' state */}
            {filteredFixtures.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '44px 16px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(10, 125, 55, 0.08)',
                    color: '#0a7d37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <AlertIcon size={24} color="#0a7d37" />
                </div>
                <b style={{ fontSize: '15px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                  No match features
                </b>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 auto', maxWidth: '380px', lineHeight: 1.5 }}>
                  No live match features currently streaming. When matches kick off, fixtures will automatically appear here for real-time statistical modeling.
                </p>
              </div>
            ) : (
              <div>
                {/* League filter chips */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    paddingBottom: '12px',
                    scrollbarWidth: 'none',
                  }}
                >
                  {availableLeagues.map((lg) => {
                    const isActive = selectedLeagueFilter === lg;
                    return (
                      <button
                        key={lg}
                        onClick={() => setSelectedLeagueFilter(lg)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '99px',
                          fontSize: '12px',
                          fontWeight: isActive ? 800 : 600,
                          background: isActive ? '#0a7d37' : '#f1f5f9',
                          color: isActive ? '#ffffff' : '#334155',
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {lg === 'all' ? 'All Leagues' : lg}
                      </button>
                    );
                  })}
                </div>

                {/* Match Cards Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                    gap: '12px',
                    marginTop: '6px',
                  }}
                >
                  {filteredFixtures.map((m: any) => {
                    const isLiveNow = m.s === 0 || (typeof m.m === 'string' && m.m.includes("'"));

                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectAndOpenMatch(m.id)}
                        className="analysis-fixture-card rvs in"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: isLiveNow ? '#dc2626' : '#0a7d37',
                                background: isLiveNow ? '#fee2e2' : '#eaf8ee',
                                padding: '2px 8px',
                                borderRadius: '99px',
                                border: isLiveNow ? '1px solid #fecaca' : '1px solid #a7f3d0',
                              }}
                            >
                              {isLiveNow ? `● LIVE ${m.m || ''}` : m.t || 'Upcoming'}
                            </span>

                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                              {m.l || 'Football'}
                            </span>
                          </div>

                          {/* Home team */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Crest name={m.h} />
                              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                                {m.h}
                              </span>
                            </div>
                            {m.sh != null && (
                              <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{m.sh}</span>
                            )}
                          </div>

                          {/* Away team */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Crest name={m.a} />
                              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                                {m.a}
                              </span>
                            </div>
                            {m.sa != null && (
                              <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{m.sa}</span>
                            )}
                          </div>
                        </div>

                        {/* Action button inside card */}
                        <div
                          style={{
                            marginTop: '14px',
                            paddingTop: '10px',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontSize: '11px', color: '#0a7d37', fontWeight: 800 }}>
                            {m.tip}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0a7d37' }}>
                            Open Full Analysis &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          PAGE VIEW 2: DEDICATED FULL MATCH ANALYSIS PAGE ENTIRELY
          ======================================================== */}
      {currentView === 'detail' && (
        <div className="analysis-detail-view">
          {/* Subpage Top Navigation Bar - Clean, spacious layout without middle club redundancy */}
          <div
            className="up1"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              borderRadius: '14px',
              padding: '12px 18px',
              marginBottom: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={handleBackToList}
              style={{
                background: '#0f172a',
                border: '1px solid #0f172a',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
            >
              <ArrowLeftIcon size={15} color="#ffffff" />
              <span>Back to Fixtures</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMasterPrompt}
              style={{
                background: '#0a7d37',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(10, 125, 55, 0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#08632c'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0a7d37'; }}
            >
              <CopyIcon size={15} color="#ffffff" />
              <span>Copy AI Prompt</span>
            </button>
          </div>

          {/* Hero Teams Confrontation Card */}
          <div
            className="up1 rvs in"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px 20px',
              marginBottom: '18px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#0a7d37',
                  background: '#eaf8ee',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  border: '1px solid #a7f3d0',
                }}
              >
                {activeLeague} • {activeDate}
              </span>

              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <SparklesIcon size={13} color="#0a7d37" />
                <span>{analysisData.source === 'gemini-live-ai' ? 'Live Gemini Analysis' : 'Statistical Poisson Engine'}</span>
              </span>
            </div>

            {/* Teams confrontation with large crests */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Crest name={activeHome} large />
                <span style={{ fontSize: 'clamp(15px, 3.2vw, 20px)', fontWeight: 900, color: '#0f172a' }}>
                  {activeHome}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Projected xG: <b>{analysisData.matchAnalysis.expectedGoalsHome.toFixed(2)}</b>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '4px 14px',
                    borderRadius: '99px',
                  }}
                >
                  VS
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Total xG: <b>{analysisData.matchAnalysis.totalProjectedXG.toFixed(2)}</b>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Crest name={activeAway} large />
                <span style={{ fontSize: 'clamp(15px, 3.2vw, 20px)', fontWeight: 900, color: '#0f172a' }}>
                  {activeAway}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Projected xG: <b>{analysisData.matchAnalysis.expectedGoalsAway.toFixed(2)}</b>
                </span>
              </div>
            </div>

            {/* Win Probability Bar */}
            {(() => {
              const homeProb = analysisData.predictionTable.find((p) => p.market.includes('1X2'))?.estimatedProbability || 48;
              const drawProb = 26;
              const awayProb = Math.max(10, 100 - homeProb - drawProb);

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                    <span>{activeHome} Win ({homeProb}%)</span>
                    <span>Draw ({drawProb}%)</span>
                    <span>{activeAway} Win ({awayProb}%)</span>
                  </div>
                  <div style={{ display: 'flex', height: '10px', borderRadius: '99px', overflow: 'hidden', background: '#e2e8f0' }}>
                    <div style={{ width: `${homeProb}%`, background: '#0a7d37' }} title={`${activeHome} Win: ${homeProb}%`} />
                    <div style={{ width: `${drawProb}%`, background: '#94a3b8' }} title={`Draw: ${drawProb}%`} />
                    <div style={{ width: `${awayProb}%`, background: '#0284c7' }} title={`${activeAway} Win: ${awayProb}%`} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 100% LOW-RISK BANKER PREDICTIONS SECTION WITH COPY BUTTON */}
          <div
            className="up2 rvs in"
            style={{
              background: 'linear-gradient(135deg, #0a7d37 0%, #064e23 100%)',
              borderRadius: '16px',
              padding: '24px 20px',
              color: '#ffffff',
              marginBottom: '20px',
              boxShadow: '0 8px 30px rgba(10, 125, 55, 0.25)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 900,
                      letterSpacing: '0.8px',
                      padding: '2px 8px',
                      borderRadius: '99px',
                      textTransform: 'uppercase',
                    }}
                  >
                    100% Statistical Probability
                  </span>
                  <span style={{ fontSize: '12px', color: '#bbf7d0', fontWeight: 700 }}>
                    Low-Risk Banker Slip
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
                  High-Confidence Match Predictions
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCopyBankerPredictions}
                style={{
                  padding: '11px 22px',
                  borderRadius: '99px',
                  background: '#ffffff',
                  color: '#0a7d37',
                  fontWeight: 900,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <CopyIcon size={15} color="#0a7d37" />
                <span>Copy Banker Predictions</span>
              </button>
            </div>

            {/* Prediction Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Card 1: Primary Low-Risk Banker */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PRIMARY LOW-RISK BANKER
                </span>
                <div style={{ fontSize: '17px', fontWeight: 900, marginTop: '4px', marginBottom: '4px' }}>
                  {analysisData.finalVerdict.strongestPicks[0] || 'Over 1.5 Total Goals'}
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  Safest statistical probability outcome based on attacking metrics.
                </div>
              </div>

              {/* Card 2: Safe Double Chance */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SAFE DOUBLE CHANCE (1X / X2)
                </span>
                <div style={{ fontSize: '17px', fontWeight: 900, marginTop: '4px', marginBottom: '4px' }}>
                  {analysisData.finalVerdict.strongestPicks[1] || `${activeHome} or Draw (1X)`}
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  High-probability coverage safeguarding both win and draw results.
                </div>
              </div>

              {/* Card 3: Corner Banker Line */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CORNER PROJECTION LINE
                </span>
                <div style={{ fontSize: '17px', fontWeight: 900, marginTop: '4px', marginBottom: '4px' }}>
                  {analysisData.cornerStatistics.recommendedLine}
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  Projected total: {analysisData.cornerStatistics.projectedTotalCorners.toFixed(1)} corners.
                </div>
              </div>

              {/* Card 4: Poisson Exact Score */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  POISSON EXACT SCORE
                </span>
                <div style={{ fontSize: '17px', fontWeight: 900, marginTop: '4px', marginBottom: '4px' }}>
                  {analysisData.correctScores[0]?.score || '2 - 1'} ({analysisData.correctScores[0]?.probability || 14.5}%)
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {analysisData.correctScores[0]?.rationale || 'Highest probability scoreline from bivariate distribution.'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Deep Breakdown */}
          <div
            className="up3"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '12px',
              marginBottom: '16px',
              scrollbarWidth: 'none',
            }}
          >
            {[
              { id: 'bankers', label: 'Banker Summary' },
              { id: 'markets', label: '14 Prediction Markets' },
              { id: 'scores', label: 'Poisson Scorelines' },
              { id: 'corners', label: 'Corner Models' },
              { id: 'tactics', label: 'Tactics & Squad News' },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 18px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 600,
                    background: isActive ? '#0a7d37' : '#ffffff',
                    color: isActive ? '#ffffff' : '#334155',
                    border: isActive ? '1px solid #0a7d37' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 12px rgba(10, 125, 55, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Banker Summary */}
          {activeTab === 'bankers' && (
            <div className="up3 rvs in" style={{ display: 'grid', gap: '14px' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: '0 0 10px' }}>
                  Tactical Match Summary & Statistical Edge
                </h3>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px' }}>
                  {analysisData.finalVerdict.summary}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0a7d37', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <CheckIcon size={14} color="#0a7d37" />
                      <span>STRONGEST LOW-RISK SELECTIONS</span>
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#166534', lineHeight: 1.6 }}>
                      {analysisData.finalVerdict.strongestPicks.map((pick, i) => (
                        <li key={i}><b>{pick}</b></li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <AlertIcon size={14} color="#dc2626" />
                      <span>HIGH-RISK MARKETS TO AVOID</span>
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#991b1b', lineHeight: 1.6 }}>
                      {analysisData.finalVerdict.marketsToAvoid.map((avoid, i) => (
                        <li key={i}>{avoid}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: 14 Mandatory Markets Table */}
          {activeTab === 'markets' && (
            <div
              className="up3 rvs in"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px 18px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                overflowX: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Full 14-Market Probability Model
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Poisson & Dixon-Coles calculations
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Market</th>
                    <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Selection & Line</th>
                    <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Probability</th>
                    <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Confidence</th>
                    <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Statistical Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.predictionTable.map((item, idx) => {
                    const confColor = item.confidence === 'High' ? '#0a7d37' : item.confidence === 'Medium' ? '#d97706' : '#dc2626';
                    const confBg = item.confidence === 'High' ? '#eaf8ee' : item.confidence === 'Medium' ? '#fef3c7' : '#fee2e2';

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                          {item.market}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#0a7d37', fontWeight: 800 }}>
                          {item.selection} {item.line ? `(${item.line})` : ''}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0f172a' }}>
                          {item.estimatedProbability}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              background: confBg,
                              color: confColor,
                              padding: '3px 8px',
                              borderRadius: '99px',
                              fontSize: '11px',
                              fontWeight: 800,
                            }}
                          >
                            {item.confidence}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569', fontSize: '12px', maxWidth: '340px' }}>
                          {item.supportingEvidence}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Poisson Scorelines */}
          {activeTab === 'scores' && (
            <div
              className="up3 rvs in"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px 18px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                  Poisson Distribution Correct Scorelines
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Broad spectrum modeling covering low, medium, and high scoring scenarios
                </span>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {analysisData.correctScores.map((sc, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0a7d37', textTransform: 'uppercase' }}>
                        {sc.label}
                      </span>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>
                        {sc.score}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {sc.rationale}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#0a7d37' }}>
                        {sc.probability.toFixed(1)}%
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Poisson Probability</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Corner Models */}
          {activeTab === 'corners' && (
            <div
              className="up3 rvs in"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px 18px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                  Corner Statistics & Probability Projections
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Independent corner modeling calculated separately from match goals
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{activeHome} Avg Corners</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0a7d37', marginTop: '4px' }}>
                    {analysisData.cornerStatistics.homeAvgCornersWon.toFixed(1)}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Projected Total Corners</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0a7d37', marginTop: '4px' }}>
                    {analysisData.cornerStatistics.projectedTotalCorners.toFixed(1)}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{activeAway} Avg Corners</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0a7d37', marginTop: '4px' }}>
                    {analysisData.cornerStatistics.awayAvgCornersWon.toFixed(1)}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '14px 16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0a7d37', textTransform: 'uppercase' }}>
                  RECOMMENDED STATISTICAL LINE
                </span>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#064e23', margin: '4px 0' }}>
                  {analysisData.cornerStatistics.recommendedLine}
                </div>
                <div style={{ fontSize: '12px', color: '#166534', lineHeight: 1.5 }}>
                  {analysisData.cornerStatistics.rationale}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Tactics & Squad News */}
          {activeTab === 'tactics' && (
            <div
              className="up3 rvs in"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px 18px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                  Tactical & Squad Intelligence
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Formations, resting schedules, fatigue, and injury reports
                </span>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <b style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    Tactical Breakdown & Game Scenario:
                  </b>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    {analysisData.matchAnalysis.tacticalBreakdown}
                  </p>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <b style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    Rest Days & Squad Fatigue:
                  </b>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    {analysisData.teamNews.fatigueMoraleRest}
                  </p>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <b style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    Key Absences & Doubts:
                  </b>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, marginTop: '4px' }}>
                    <div><b>{activeHome}:</b> {analysisData.teamNews.homeInjuriesAndDoubts.join(', ') || 'No major confirmed absences'}</div>
                    <div><b>{activeAway}:</b> {analysisData.teamNews.awayInjuriesAndDoubts.join(', ') || 'Squad close to full fitness'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div
            className="up4"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={handleBackToList}
              style={{
                background: '#0f172a',
                border: '1px solid #0f172a',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
            >
              <ArrowLeftIcon size={15} color="#ffffff" />
              <span>Back to Fixtures List</span>
            </button>

            <button
              type="button"
              onClick={handleCopyBankerPredictions}
              style={{
                background: '#0a7d37',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(10, 125, 55, 0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#08632c'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0a7d37'; }}
            >
              <CopyIcon size={15} color="#ffffff" />
              <span>Copy Banker Predictions</span>
            </button>
          </div>

          {/* Disclaimer */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#94a3b8' }}>
            {analysisData.disclaimer}
          </div>
        </div>
      )}

      {/* 5-Game Daily Quota Limit Reached Modal */}
      {quotaModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setQuotaModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px 24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertIcon size={28} color="#dc2626" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
              Daily AI Limit Reached (5/5)
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Free member accounts can analyze up to <b>5 games per day</b> with the AI Prediction Engine. Upgrade to <b>SpiderPicks VIP</b> for unlimited analyses on matches worldwide!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setQuotaModalOpen(false);
                  if (onOpenMembership) onOpenMembership();
                }}
                style={{
                  background: 'linear-gradient(135deg, #0a7d37 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(10, 125, 55, 0.3)',
                }}
              >
                ★ Upgrade to VIP (From ₦2,000)
              </button>
              <button
                type="button"
                onClick={() => setQuotaModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
