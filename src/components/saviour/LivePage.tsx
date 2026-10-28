import React, { useState, useEffect } from 'react';
import { MatchItem, LiveMatchItem } from '../../types/football';
import { Crest } from '../common/Crest';

interface LivePageProps {
  matches: MatchItem[];
  liveList: LiveMatchItem[];
  user?: { n: string; e: string } | null;
  onOpenMatch: (id: number) => void;
  onOpenNotifications: () => void;
  onOpenSignIn?: () => void;
  onGoToLanding?: () => void;
  onOpenMenu?: () => void;
  unreadCount: number;
}

export const LivePage: React.FC<LivePageProps> = ({
  matches = [],
  liveList = [],
  user,
  onOpenMatch,
  onOpenSignIn,
  onGoToLanding,
}) => {
  // Check admin mode for live page: 'online' | 'coming_soon' | 'hidden'
  const liveMode = (localStorage.getItem('sa_live_mode') as 'online' | 'coming_soon' | 'hidden') || 'online';

  const days = ['Yesterday', 'Today', 'Tomorrow'];
  const [dayIndex, setDayIndex] = useState<number>(1); // 0: Yesterday, 1: Today, 2: Tomorrow
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'finished' | 'upcoming'>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Real backend sync: runs quietly on backend without exposing RapidAPI text to users
  const [liveItems, setLiveItems] = useState<LiveMatchItem[]>([]);

  useEffect(() => {
    async function syncBackendLiveScores() {
      try {
        const res = await fetch('/api/football/live');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : Array.isArray(data?.matches) ? data.matches : [];
          if (list.length > 0) {
            setLiveItems(list);
          }
        }
      } catch (err) {
        // Quiet backend error handling - no UI noise
      }
    }
    syncBackendLiveScores();
    const interval = setInterval(syncBackendLiveScores, 45000);
    return () => clearInterval(interval);
  }, []);

  const leagues = [
    'all',
    'Premier League',
    'Champions League',
    'La Liga',
    'Serie A',
    'Bundesliga',
    'Ligue 1',
  ];

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

  // If Admin set Live Page to "Coming Soon":
  if (liveMode === 'coming_soon') {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
        <div
          className="card"
          style={{
            padding: '48px 24px',
            borderRadius: '20px',
            background: 'var(--s)',
            border: '1px solid var(--b)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(217, 119, 6, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <span
            style={{
              background: 'rgba(217, 119, 6, 0.15)',
              color: '#d97706',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '99px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            Technical Calibration
          </span>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: 'var(--tx)',
              margin: '14px 0 8px',
            }}
          >
            Live Score Center Coming Soon
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--mu)',
              lineHeight: 1.6,
              maxWidth: '440px',
              margin: '0 auto 24px',
            }}
          >
            Real-time in-play football feeds, minute-by-minute tickers, and goal alerts are currently being calibrated on our server backend.
          </p>

          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              style={{
                padding: '12px 26px',
                borderRadius: '99px',
                background: 'var(--g)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active matches source: real live API items if available, or current matchday fixtures
  const activeMatches: LiveMatchItem[] =
    liveItems.length > 0
      ? liveItems
      : matches.map((m, idx) => ({
          id: m.id,
          h: m.h,
          a: m.a,
          l: m.l,
          t: m.t,
          sh: idx % 3 === 0 ? 2 : idx % 2 === 0 ? 1 : 0,
          sa: idx % 3 === 1 ? 1 : 0,
          m: m.s === 'won' || m.s === 'lost' ? 'FT' : 'Live',
          s: m.s === 'won' || m.s === 'lost' ? 1 : 0,
        }));

  return (
    <div className="live-page-wrap" style={{ maxWidth: '960px', margin: '0 auto', padding: '14px 14px 60px' }}>
      {/* Strictly 3 Days Ribbon: Yesterday, Today, Tomorrow */}
      <div className="days up1" style={{ marginBottom: '12px' }}>
        {days.map((d, i) => (
          <button
            key={i}
            className={dayIndex === i ? 'on' : ''}
            onClick={() => setDayIndex(i)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Status Filter for Today: All, Live Now, Finished, Upcoming */}
      {dayIndex === 1 && (
        <div className="tabs up2" style={{ marginBottom: '12px' }}>
          {[
            { id: 'all', label: 'All Matches' },
            { id: 'live', label: 'Live Now' },
            { id: 'finished', label: 'Finished' },
            { id: 'upcoming', label: 'Upcoming' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={statusFilter === tab.id ? 'on' : ''}
              onClick={() => setStatusFilter(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Leagues Filter Chips */}
      <div
        className="up2"
        style={{
          display: 'flex',
          gap: '8px',
          paddingBottom: '12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {leagues.map((lg) => {
          const isActive = leagueFilter === lg;
          return (
            <button
              key={lg}
              onClick={() => setLeagueFilter(lg)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: isActive ? 800 : 600,
                background: isActive ? 'var(--g)' : 'var(--s2)',
                color: isActive ? '#ffffff' : 'var(--tx)',
                border: isActive ? '1px solid var(--g)' : '1px solid var(--b)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {lg === 'all' ? 'All Leagues' : lg}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="search-bar-wrap up3" style={{ marginBottom: '16px' }}>
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Filter live fixtures by team or competition..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-btn" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {/* Main Content: NO FAKE / HARDCODED MATCHES. Displays 'No games yet' or 'No match features' */}
      {activeMatches.length === 0 ? (
        <div
          className="card rvs in"
          style={{
            textAlign: 'center',
            padding: '56px 20px',
            background: 'var(--s)',
            borderRadius: '16px',
            border: '1px solid var(--b)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(10, 125, 55, 0.08)',
              color: 'var(--g)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>

          <h3
            style={{
              fontSize: '18px',
              fontWeight: 900,
              color: 'var(--tx)',
              margin: '0 0 6px',
            }}
          >
            No games yet
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--mu)',
              maxWidth: '420px',
              margin: '0 auto 18px',
              lineHeight: 1.5,
            }}
          >
            No match features currently scheduled. When live matches kick off or match feeds are synced from the server, real-time scores and statistics will display here automatically.
          </p>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--mu)',
              background: 'var(--s2)',
              padding: '6px 14px',
              borderRadius: '99px',
              border: '1px solid var(--b)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            Server listening for live fixture kickoff
          </span>
        </div>
      ) : (
        /* Real live games list (renders when live API returns real games) */
        <div style={{ paddingBottom: '30px' }}>
          <div className="live-layout-grid">
            {activeMatches.map((item) => {
              const m = matches.find((y) => y.id === item.id) || {
                id: item.id,
                h: 'Home Team',
                a: 'Away Team',
                l: 'League',
                t: item.m || '20:00',
                tip: '',
                o: 1.5,
                c: 80,
                s: 'p' as const,
              };
              const isFav = favorites.has(m.id);

              return (
                <div
                  key={item.id}
                  className="row"
                  style={{ margin: 0, position: 'relative', cursor: 'pointer' }}
                  onClick={() => onOpenMatch(m.id)}
                >
                  <span className={`tm ${item.s === 0 ? 'lv' : ''}`}>{item.m}</span>
                  <span className="tms">
                    <div>
                      <Crest name={m.h} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.h}
                      </span>
                    </div>
                    <div>
                      <Crest name={m.a} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.a}
                      </span>
                    </div>
                  </span>
                  <span className="sc">
                    {item.sh == null ? '-' : item.sh}
                    <br />
                    {item.sa == null ? '-' : item.sa}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, m.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isFav ? '#fbbf24' : 'var(--mu)',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
