import React, { useState, useEffect } from 'react';
import { MatchItem } from '../../types/football';
import { Crest } from '../common/Crest';
import { seed, form } from '../../lib/saviourData';
import { generateStatisticalAnalysis } from '../../lib/aiFootballAnalysis';

interface MatchDetailPageProps {
  matchId: number;
  matches: MatchItem[];
  user?: { n: string; e: string } | null;
  onOpenSignIn?: () => void;
  onBack: () => void;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({
  matchId,
  matches,
  user,
  onOpenSignIn,
  onBack,
}) => {
  const [tab, setTab] = useState<number>(0); // 0: Prediction, 1: Analysis, 2: H2H
  const [isFav, setIsFav] = useState(false);

  const handleToggleFavorite = () => {
    if (!user && onOpenSignIn) {
      onOpenSignIn();
      return;
    }
    setIsFav(!isFav);
  };

  const m = matches.find((x) => x.id === matchId) || matches[0];
  const aiData = generateStatisticalAnalysis(m.h, m.a, m.l, m.t);
  const fh = form(m.id, 1);
  const fa = form(m.id, 2);

  const stats = [
    { name: 'Goals per game', a: 1.4 + seed(m.id, 3) * 1.4, b: 1.1 + seed(m.id, 4) * 1.4 },
    { name: 'Shots on target', a: 4 + seed(m.id, 5) * 4, b: 3 + seed(m.id, 6) * 4 },
    { name: 'Possession %', a: 48 + seed(m.id, 7) * 12, b: 40 + seed(m.id, 8) * 12 },
  ];

  const h2hMatches = [
    { date: 'Mar 24', score: '2-1' },
    { date: 'Sep 23', score: '1-1' },
    { date: 'Feb 23', score: '0-2' },
    { date: 'Oct 22', score: '3-1' },
  ];

  return (
    <>
      {/* Clean Sub-header Bar */}
      <div className="subpage-nav-bar">
        <button type="button" className="subpage-back-btn" onClick={onBack} aria-label="Back to matches">
          &larr; Back
        </button>
        <span className="subpage-title">{m.l}</span>
        <button
          type="button"
          onClick={handleToggleFavorite}
          style={{
            background: 'transparent',
            border: 'none',
            color: isFav ? '#fbbf24' : '#64748b',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
          }}
          title={isFav ? 'Favorited' : 'Favorite match'}
        >
          {isFav ? '★' : '☆'}
        </button>
      </div>

      {/* Hero Teams Confrontation */}
      <div className="hero">
        <div className="tt">
          <div>
            <Crest name={m.h} large />
            {m.h}
          </div>
          <span className="vs">{m.t}</span>
          <div>
            <Crest name={m.a} large />
            {m.a}
          </div>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="tip">
        <div>
          <small>Our pick</small>
          <b>{m.tip}</b>
        </div>
        <div className="n">{m.o.toFixed(2)}</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['Prediction', 'Analysis', 'H2H'].map((title, i) => (
          <button
            key={i}
            className={tab === i ? 'on' : ''}
            onClick={() => setTab(i)}
          >
            {title}
          </button>
        ))}
      </div>

      {/* Tab 0: Prediction */}
      {tab === 0 && (
        <div className="sec">
          <div className="card">
            <div className="kv">
              <span>Primary Tip</span>
              <b>{m.tip}</b>
            </div>
            <div className="kv">
              <span>Odds</span>
              <b>{m.o.toFixed(2)}</b>
            </div>
            <div className="kv">
              <span>Confidence</span>
              <b>{m.c}%</b>
            </div>
            <div className="bar">
              <i style={{ width: `${m.c}%` }}></i>
            </div>
          </div>

          {/* Poisson Correct Scores from Master Engine */}
          <div className="card" style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Poisson Scoreline Projections
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              {aiData.correctScores.slice(0, 3).map((cs, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '10px 6px', borderRadius: '10px', border: i === 0 ? '2px solid #0a7d37' : '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{i === 0 ? 'Top Pick' : `#${i + 1}`}</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>{cs.score}</div>
                  <div style={{ fontSize: '11px', color: '#0a7d37', fontWeight: 800 }}>{cs.probability}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* 14-Market Key Selections */}
          <div className="card" style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Statistically Supported Selections
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiData.predictionTable.slice(0, 4).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{item.selection}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.line}</div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0a7d37' }}>{item.estimatedProbability}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Analysis */}
      {tab === 1 && (
        <div className="sec">
          {/* Expected Goals (xG) confrontation */}
          <div className="card" style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              Expected Goals (xG) & Chance Creation
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{m.h}</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0a7d37' }}>{aiData.matchAnalysis.expectedGoalsHome.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: '70px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
                TOTAL xG<br />{aiData.matchAnalysis.totalProjectedXG.toFixed(2)}
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{m.a}</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0a7d37' }}>{aiData.matchAnalysis.expectedGoalsAway.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Corner Statistics Module */}
          <div className="card" style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Corner Statistics & Projections
            </div>
            <div style={{ background: '#eaf8ee', padding: '10px 12px', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0a7d37' }}>RECOMMENDED CORNER LINE:</span>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#0a7d37' }}>{aiData.cornerStatistics.recommendedLine}</div>
              <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>{aiData.cornerStatistics.rationale}</div>
            </div>
          </div>

          {/* Team News & Risks */}
          <div className="card">
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Tactical & Squad Intelligence
            </div>
            <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5, marginBottom: '8px' }}>
              <b>Tactical Setup:</b> {aiData.matchAnalysis.tacticalBreakdown}
            </div>
            <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
              <b>Rest & Fatigue:</b> {aiData.teamNews.fatigueMoraleRest}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: H2H */}
      {tab === 2 && (
        <div className="sec">
          <div className="card">
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              Recent Head-to-Head Meetings
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Match</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {aiData.h2hHistory.meetings.map((r, i) => (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td>
                      {r.homeTeam.split(' ')[0]} v {r.awayTeam.split(' ')[0]}
                    </td>
                    <td><b>{r.score}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recurring Trends */}
          <div className="card" style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              H2H Recurring Trends
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
              {aiData.h2hHistory.recurringTrends.map((tr, i) => (
                <li key={i}>{tr}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
