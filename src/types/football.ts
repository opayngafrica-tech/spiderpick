export interface ScoreProjection {
  label?: string; // "Top Pick", "#2", "#3"
  score: string;
  probability: number; // percentage (e.g. 38)
}

export interface H2HMeeting {
  date: string;
  match: string;
  score: string;
}

export interface StatSelection {
  label: string; // e.g. "Over 1.5 Goals"
  code: string; // e.g. "1.5", "1X", "BTTS"
  percentage: number; // e.g. 88
}

export interface MatchItem {
  id: number;
  l: string; // League name
  t: string; // Kickoff time or minute
  h: string; // Home team
  a: string; // Away team
  tip: string; // Pick / prediction
  o: number; // Odds
  c: number; // Confidence percentage
  s: 'p' | 'won' | 'lost'; // Status: pending, won, lost
  isVip?: boolean;
  date?: string; // YYYY-MM-DD
  scores?: ScoreProjection[];
  h2h?: H2HMeeting[];
  trends?: string[];
  selections?: StatSelection[];
}

export interface LiveMatchItem {
  id: number;
  sh?: number;
  sa?: number;
  m: string; // "67'", "34'", "FT", "18:30"
  s: number; // 0: Live, 1: Finished, 2: Upcoming
}

export interface CommentItem {
  n: string;
  t: number;
  x: string;
}

export interface PostItem {
  id: number;
  n: string;
  txt?: string;
  img?: string;
  imgs?: string[];
  code?: string;
  bk?: string;
  t: number;
  m?: number;
  lk: number;
  liked?: boolean;
  cm: CommentItem[];
}

export interface NotificationItem {
  id: number;
  x: string;
  m?: number;
  t: number;
}
