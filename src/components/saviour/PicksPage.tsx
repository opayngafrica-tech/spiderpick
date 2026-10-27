import React, { useState } from 'react';
import { MatchItem } from '../../types/football';
import { Crest } from '../common/Crest';

interface PicksPageProps {
  matches: MatchItem[];
  user?: { n: string; e: string; role?: string; isVip?: boolean; subscriptionTier?: string } | null;
  onOpenMatch: (id: number) => void;
  onOpenNotifications?: () => void;
  onOpenSignIn?: () => void;
  onOpenMembership?: () => void;
  onAddDailyPick?: (newPick: MatchItem) => void;
  onGoToLanding?: () => void;
  onOpenMenu?: () => void;
  unreadCount?: number;
}

export const PicksPage: React.FC<PicksPageProps> = ({
  matches = [],
  user,
  onOpenMatch,
  onOpenSignIn,
  onOpenMembership,
  onAddDailyPick,
}) => {
  // Navigation between Free Daily Predictions and VIP Predictions
  const [predictionTab, setPredictionTab] = useState<'free' | 'vip'>('free');

  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [createPickModalOpen, setCreatePickModalOpen] = useState(false);

  // Admin form state
  const [newTargetSection, setNewTargetSection] = useState<'free' | 'vip'>('free');
  const [newHome, setNewHome] = useState('');
  const [newAway, setNewAway] = useState('');
  const [newLeague, setNewLeague] = useState('Premier League');
  const [newTime, setNewTime] = useState('20:00');
  const [newTip, setNewTip] = useState('Over 1.5 Goals');
  const [newOdds, setNewOdds] = useState('1.50');
  const [newConf, setNewConf] = useState('88');

  const isAdmin = user?.role === 'admin';
  const isVip = isAdmin || Boolean(user?.isVip) || (Boolean(user?.subscriptionTier) && user?.subscriptionTier !== 'free');

  const handleToggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!user && onOpenSignIn) {
      onOpenSignIn();
      return;
    }
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreatePickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHome.trim() || !newAway.trim() || !onAddDailyPick) return;

    const newMatchItem: MatchItem = {
      id: Date.now(),
      h: newHome.trim(),
      a: newAway.trim(),
      l: newLeague.trim(),
      t: newTime.trim() || '20:00',
      tip: newTip.trim() || 'Over 1.5 Goals',
      o: parseFloat(newOdds) || 1.45,
      c: parseInt(newConf, 10) || 85,
      s: 'p',
      isVip: newTargetSection === 'vip',
    };

    onAddDailyPick(newMatchItem);
    setCreatePickModalOpen(false);
    setNewHome('');
    setNewAway('');
  };

  const handleAdminCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddDailyPick) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      lines.slice(1).forEach((line) => {
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 3 && cols[0] && cols[1]) {
          onAddDailyPick({
            id: Date.now() + Math.floor(Math.random() * 10000),
            h: cols[0],
            a: cols[1],
            l: cols[2] || 'World Football',
            t: cols[3] || '20:00',
            tip: cols[4] || 'Over 1.5 Goals',
            o: parseFloat(cols[5]) || 1.5,
            c: parseInt(cols[6], 10) || 85,
            s: 'p',
            isVip: newTargetSection === 'vip',
          });
        }
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter matches based on Free vs VIP section + search query
  const displayedMatches = matches.filter((m) => {
    // If in VIP section: match must be marked as VIP
    if (predictionTab === 'vip' && !m.isVip) return false;
    // If in Free section: match must be free (not marked as VIP)
    if (predictionTab === 'free' && m.isVip) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.h} ${m.a} ${m.l} ${m.tip}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="picks-page-wrap" style={{ maxWidth: '840px', margin: '0 auto', padding: '16px 14px 60px' }}>
      {/* ========================================================
          PREDICTION SECTIONS SWITCHER: FREE ACCESS vs VIP PREDICTIONS
          ======================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'var(--s2)',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '18px',
          border: '1px solid var(--b)',
        }}
      >
        {/* Button 1: Free Daily Predictions */}
        <button
          type="button"
          onClick={() => setPredictionTab('free')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: predictionTab === 'free' ? 'var(--g)' : 'transparent',
            color: predictionTab === 'free' ? '#ffffff' : 'var(--mu)',
            boxShadow: predictionTab === 'free' ? '0 4px 14px rgba(10, 125, 55, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>Free Daily Predictions</span>
        </button>

        {/* Button 2: VIP Predictions */}
        <button
          type="button"
          onClick={() => setPredictionTab('vip')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: predictionTab === 'vip' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'transparent',
            color: predictionTab === 'vip' ? '#ffffff' : 'var(--mu)',
            boxShadow: predictionTab === 'vip' ? '0 4px 14px rgba(217, 119, 6, 0.35)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '13px' }}>★</span>
          <span>VIP Predictions</span>
          {!isVip && (
            <span
              style={{
                fontSize: '10px',
                background: predictionTab === 'vip' ? 'rgba(255,255,255,0.2)' : 'rgba(217, 119, 6, 0.15)',
                color: predictionTab === 'vip' ? '#ffffff' : '#d97706',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 800,
              }}
            >
              LOCKED
            </span>
          )}
        </button>
      </div>

      {/* ========================================================
          ADMIN-ONLY ACTION CONTROLS: CSV UPLOAD & MANUAL POST
          (ONLY APPEARS TO ADMIN USERS)
          ======================================================== */}
      {isAdmin && (
        <div
          className="card"
          style={{
            padding: '14px 16px',
            marginBottom: '18px',
            background: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#d97706', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                ADMIN
              </span>
              <b style={{ fontSize: '13px', color: 'var(--tx)' }}>Publisher Controls</b>
            </div>

            {/* Target Selection: Free or VIP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--mu)', fontWeight: 700 }}>Upload Target:</span>
              <select
                value={newTargetSection}
                onChange={(e) => setNewTargetSection(e.target.value as 'free' | 'vip')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'var(--s)',
                  border: '1px solid var(--b)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--tx)',
                }}
              >
                <option value="free">Free Daily Predictions</option>
                <option value="vip">★ VIP Predictions</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setCreatePickModalOpen(true)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'var(--g)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              + Post Daily Pick Manually
            </button>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'var(--s2)',
                color: 'var(--tx)',
                border: '1px solid var(--b)',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Upload Predictions CSV
              <input type="file" accept=".csv" onChange={handleAdminCsvUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* ========================================================
          CASE 1: VIP PREDICTIONS CLICKED BUT USER IS NOT VIP
          (DOES NOT SHOW THE GAMES AT ALL - GATED VIEW)
          ======================================================== */}
      {predictionTab === 'vip' && !isVip ? (
        <div
          className="card rvs in"
          style={{
            textAlign: 'center',
            padding: '54px 24px',
            background: 'var(--s)',
            borderRadius: '20px',
            border: '1px solid rgba(217, 119, 6, 0.4)',
            boxShadow: '0 8px 32px rgba(217, 119, 6, 0.1)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(180, 83, 9, 0.25) 100%)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: '2px solid rgba(217, 119, 6, 0.3)',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <span
            style={{
              background: 'rgba(217, 119, 6, 0.15)',
              color: '#d97706',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: '99px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            VIP Member Access Required
          </span>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: 'var(--tx)',
              margin: '14px 0 8px',
              letterSpacing: '-0.3px',
            }}
          >
            VIP Predictions Are Locked
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--mu)',
              lineHeight: 1.6,
              maxWidth: '460px',
              margin: '0 auto 24px',
            }}
          >
            You cannot view the VIP predictions list on a standard free tier. VIP members receive 85%+ banker accumulators, high-odds value slips, and instant Telegram bot alerts.
          </p>

          {/* Primary Action Button: Takes user directly to the VIP Prediction pricing page */}
          <button
            type="button"
            onClick={onOpenMembership}
            style={{
              padding: '14px 32px',
              borderRadius: '99px',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(217, 119, 6, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.15s ease',
            }}
          >
            <span>Unlock VIP Predictions & View List</span>
            <span>&rarr;</span>
          </button>

          {/* VIP Perks Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '32px',
              textAlign: 'left',
            }}
          >
            <div style={{ background: 'var(--s2)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--b)' }}>
              <b style={{ fontSize: '12px', color: 'var(--tx)', display: 'block', marginBottom: '2px' }}>
                ★ 85%+ Banker Confidence
              </b>
              <span style={{ fontSize: '11px', color: 'var(--mu)' }}>Poisson calibrated selections</span>
            </div>

            <div style={{ background: 'var(--s2)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--b)' }}>
              <b style={{ fontSize: '12px', color: 'var(--tx)', display: 'block', marginBottom: '2px' }}>
                ★ Instant Telegram Alerts
              </b>
              <span style={{ fontSize: '11px', color: 'var(--mu)' }}>Real-time booking codes</span>
            </div>

            <div style={{ background: 'var(--s2)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--b)' }}>
              <b style={{ fontSize: '12px', color: 'var(--tx)', display: 'block', marginBottom: '2px' }}>
                ★ Multi-Bookmaker Slips
              </b>
              <span style={{ fontSize: '11px', color: 'var(--mu)' }}>SportyBet, Bet9ja & 1xBet</span>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
            CASE 2: FREE PREDICTIONS (OR VIP PREDICTIONS FOR UNLOCKED USERS)
            ======================================================== */
        <div>
          {/* Search Bar */}
          <div className="search-bar-wrap" style={{ marginBottom: '14px' }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${predictionTab === 'vip' ? 'VIP' : 'Free'} predictions...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* List of Predictions */}
          {displayedMatches.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: 'var(--s)',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(10, 125, 55, 0.08)',
                  color: 'var(--g)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <b style={{ fontSize: '18px', color: 'var(--tx)', display: 'block', marginBottom: '6px' }}>
                {predictionTab === 'vip' ? 'No games yet on VIP' : 'No games yet'}
              </b>
              <p style={{ fontSize: '13px', color: 'var(--mu)', margin: '0 auto', maxWidth: '400px', lineHeight: 1.5 }}>
                {predictionTab === 'vip'
                  ? 'No VIP games posted yet. When new VIP banker predictions are added, they will appear here.'
                  : 'No games yet. Daily predictions will appear here once published.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedMatches.map((m) => {
                const isFav = favorites.has(m.id);

                return (
                  <div
                    key={m.id}
                    onClick={() => onOpenMatch(m.id)}
                    className="card"
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderLeft: predictionTab === 'vip' ? '4px solid #d97706' : '4px solid var(--g)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mu)' }}>{m.t}</span>
                        <span style={{ fontSize: '11px', color: 'var(--mu)' }}>·</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--tx)' }}>{m.l}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {m.isVip && (
                          <span style={{ background: '#d97706', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                            ★ VIP
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, m.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isFav ? '#fbbf24' : 'var(--mu)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          {isFav ? '★' : '☆'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Crest name={m.h} />
                          <b style={{ fontSize: '14px', color: 'var(--tx)' }}>{m.h}</b>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Crest name={m.a} />
                          <b style={{ fontSize: '14px', color: 'var(--tx)' }}>{m.a}</b>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: 'var(--mu)', display: 'block' }}>Pick</span>
                        <b style={{ fontSize: '14px', color: predictionTab === 'vip' ? '#d97706' : 'var(--g)' }}>{m.tip}</b>
                        <span style={{ fontSize: '11px', color: 'var(--mu)', display: 'block', marginTop: '2px' }}>
                          Odds: {m.o.toFixed(2)} · {m.c}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Manual Creation Modal for Admins */}
      {createPickModalOpen && (
        <div
          className="sh"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreatePickModalOpen(false);
          }}
        >
          <div className="shc" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '14px', color: 'var(--tx)' }}>
              Publish Match Prediction ({newTargetSection.toUpperCase()})
            </h3>

            <form onSubmit={handleCreatePickSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--mu)', marginBottom: '4px' }}>
                    Prediction Type
                  </label>
                  <select
                    value={newTargetSection}
                    onChange={(e) => setNewTargetSection(e.target.value as 'free' | 'vip')}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--tx)' }}
                  >
                    <option value="free">Free Daily Prediction</option>
                    <option value="vip">★ VIP Prediction</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Home Team"
                    value={newHome}
                    onChange={(e) => setNewHome(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--tx)' }}
                  />
                  <input
                    type="text"
                    placeholder="Away Team"
                    value={newAway}
                    onChange={(e) => setNewAway(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--tx)' }}
                  />
                </div>

                <input
                  type="text"
                  placeholder="League"
                  value={newLeague}
                  onChange={(e) => setNewLeague(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--tx)' }}
                />

                <input
                  type="text"
                  placeholder="Kickoff Time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--tx)' }}
                />

                <input
                  type="text"
                  placeholder="Selection / Tip"
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--tx)' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Odds"
                    value={newOdds}
                    onChange={(e) => setNewOdds(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--tx)' }}
                  />
                  <input
                    type="text"
                    placeholder="Confidence %"
                    value={newConf}
                    onChange={(e) => setNewConf(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--tx)' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: newTargetSection === 'vip' ? '#d97706' : 'var(--g)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    marginTop: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Publish Prediction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
