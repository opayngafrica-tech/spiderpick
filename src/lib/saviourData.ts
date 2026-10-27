import { MatchItem, LiveMatchItem, PostItem, NotificationItem } from '../types/football';

export const M: MatchItem[] = [
  // Premier League
  { id: 1, l: "Premier League", t: "20:00", h: "Arsenal", a: "Chelsea", tip: "Over 1.5 Goals", o: 1.35, c: 88, s: "p" },
  { id: 2, l: "Premier League", t: "18:30", h: "Man City", a: "Liverpool", tip: "X2 (Liverpool or Draw)", o: 1.48, c: 79, s: "p" },
  { id: 3, l: "Premier League", t: "20:30", h: "Man United", a: "Tottenham", tip: "Both Teams To Score", o: 1.70, c: 74, s: "p" },
  { id: 9, l: "Premier League", t: "17:30", h: "Newcastle", a: "Aston Villa", tip: "Over 2.5 Goals", o: 1.72, c: 81, s: "p" },
  { id: 10, l: "Premier League", t: "15:00", h: "Brighton", a: "West Ham", tip: "Home or Draw (1X)", o: 1.30, c: 86, s: "won" },
  { id: 11, l: "Premier League", t: "15:00", h: "Wolves", a: "Everton", tip: "Under 3.5 Goals", o: 1.28, c: 84, s: "p" },
  { id: 12, l: "Premier League", t: "15:00", h: "Crystal Palace", a: "Fulham", tip: "Over 1.5 Goals", o: 1.36, c: 82, s: "p" },

  // Champions League
  { id: 4, l: "Champions League", t: "21:00", h: "Real Madrid", a: "Bayern Munich", tip: "Both Teams To Score", o: 1.62, c: 82, s: "p" },
  { id: 13, l: "Champions League", t: "21:00", h: "PSG", a: "Atletico Madrid", tip: "Home or Draw (1X)", o: 1.38, c: 85, s: "p" },
  { id: 14, l: "Champions League", t: "21:00", h: "Inter Milan", a: "Barcelona", tip: "Over 2.5 Goals", o: 1.68, c: 80, s: "p" },
  { id: 15, l: "Champions League", t: "21:00", h: "Dortmund", a: "Benfica", tip: "Home Win", o: 1.82, c: 77, s: "p" },

  // La Liga
  { id: 5, l: "La Liga", t: "20:00", h: "Barcelona", a: "Atletico Madrid", tip: "Home Win", o: 1.75, c: 84, s: "p" },
  { id: 16, l: "La Liga", t: "21:00", h: "Real Madrid", a: "Sevilla", tip: "Home Win & Over 1.5", o: 1.45, c: 87, s: "p" },
  { id: 17, l: "La Liga", t: "16:15", h: "Real Sociedad", a: "Athletic Bilbao", tip: "Under 2.5 Goals", o: 1.60, c: 83, s: "won" },
  { id: 18, l: "La Liga", t: "18:30", h: "Villarreal", a: "Valencia", tip: "Over 1.5 Goals", o: 1.32, c: 86, s: "p" },
  { id: 19, l: "La Liga", t: "20:45", h: "Real Betis", a: "Girona", tip: "Both Teams To Score", o: 1.65, c: 78, s: "p" },

  // Serie A
  { id: 6, l: "Serie A", t: "19:45", h: "Inter Milan", a: "AC Milan", tip: "Over 2.5 Goals", o: 1.90, c: 85, s: "won" },
  { id: 20, l: "Serie A", t: "20:45", h: "Juventus", a: "Napoli", tip: "Home or Draw (1X)", o: 1.40, c: 83, s: "p" },
  { id: 21, l: "Serie A", t: "18:00", h: "Roma", a: "Lazio", tip: "Under 3.5 Goals", o: 1.31, c: 88, s: "p" },
  { id: 22, l: "Serie A", t: "15:00", h: "Atalanta", a: "Fiorentina", tip: "Over 2.5 Goals", o: 1.66, c: 80, s: "p" },
  { id: 23, l: "Serie A", t: "12:30", h: "Bologna", a: "Torino", tip: "Home or Draw (1X)", o: 1.28, c: 85, s: "p" },

  // Bundesliga
  { id: 7, l: "Bundesliga", t: "17:30", h: "Leverkusen", a: "Dortmund", tip: "Both Teams To Score", o: 1.55, c: 90, s: "won" },
  { id: 24, l: "Bundesliga", t: "18:30", h: "Bayern Munich", a: "RB Leipzig", tip: "Over 2.5 Goals", o: 1.44, c: 89, s: "won" },
  { id: 25, l: "Bundesliga", t: "15:30", h: "Stuttgart", a: "Frankfurt", tip: "Over 1.5 Goals", o: 1.25, c: 91, s: "p" },
  { id: 26, l: "Bundesliga", t: "15:30", h: "Wolfsburg", a: "Gladbach", tip: "Both Teams To Score", o: 1.58, c: 79, s: "p" },

  // Ligue 1
  { id: 8, l: "Ligue 1", t: "20:45", h: "Paris Saint-Germain", a: "Marseille", tip: "Home Win", o: 1.42, c: 76, s: "lost" },
  { id: 27, l: "Ligue 1", t: "21:00", h: "Monaco", a: "Lyon", tip: "Over 2.5 Goals", o: 1.64, c: 84, s: "p" },
  { id: 28, l: "Ligue 1", t: "17:00", h: "Lille", a: "Lens", tip: "Under 2.5 Goals", o: 1.70, c: 78, s: "won" },
  { id: 29, l: "Ligue 1", t: "19:00", h: "Rennes", a: "Nice", tip: "Under 3.5 Goals", o: 1.26, c: 86, s: "p" },

  // World & Global Elite
  { id: 30, l: "Saudi Pro League", t: "19:00", h: "Al Hilal", a: "Al Nassr", tip: "Over 2.5 Goals", o: 1.52, c: 85, s: "won" },
  { id: 31, l: "Major League Soccer", t: "22:30", h: "Inter Miami", a: "LA Galaxy", tip: "Both Teams To Score", o: 1.46, c: 87, s: "p" },
  { id: 32, l: "Eredivisie", t: "14:30", h: "Ajax", a: "Feyenoord", tip: "Over 2.5 Goals", o: 1.55, c: 83, s: "won" },
  { id: 33, l: "Scottish Premiership", t: "12:30", h: "Celtic", a: "Rangers", tip: "Home Win or Draw", o: 1.32, c: 84, s: "p" },
  { id: 34, l: "Primeira Liga", t: "20:15", h: "Porto", a: "Sporting CP", tip: "Under 3.5 Goals", o: 1.30, c: 85, s: "p" },
];

export const LV: LiveMatchItem[] = [
  // Live matches (status 0)
  { id: 1, sh: 2, sa: 1, m: "67'", s: 0 },
  { id: 4, sh: 1, sa: 1, m: "34'", s: 0 },
  { id: 9, sh: 1, sa: 0, m: "52'", s: 0 },
  { id: 20, sh: 0, sa: 0, m: "18'", s: 0 },
  { id: 27, sh: 1, sa: 2, m: "41'", s: 0 },
  { id: 31, sh: 3, sa: 2, m: "78'", s: 0 },

  // Finished matches (status 1)
  { id: 6, sh: 3, sa: 1, m: "FT", s: 1 },
  { id: 7, sh: 2, sa: 2, m: "FT", s: 1 },
  { id: 8, sh: 0, sa: 1, m: "FT", s: 1 },
  { id: 10, sh: 1, sa: 1, m: "FT", s: 1 },
  { id: 17, sh: 2, sa: 0, m: "FT", s: 1 },
  { id: 24, sh: 3, sa: 2, m: "FT", s: 1 },
  { id: 28, sh: 2, sa: 1, m: "FT", s: 1 },
  { id: 30, sh: 3, sa: 1, m: "FT", s: 1 },
  { id: 32, sh: 1, sa: 2, m: "FT", s: 1 },

  // Upcoming matches (status 2)
  { id: 2, m: "18:30", s: 2 },
  { id: 3, m: "20:30", s: 2 },
  { id: 5, m: "20:00", s: 2 },
  { id: 11, m: "15:00", s: 2 },
  { id: 12, m: "15:00", s: 2 },
  { id: 13, m: "21:00", s: 2 },
  { id: 14, m: "21:00", s: 2 },
  { id: 15, m: "21:00", s: 2 },
  { id: 16, m: "21:00", s: 2 },
  { id: 18, m: "18:30", s: 2 },
  { id: 19, m: "20:45", s: 2 },
  { id: 21, m: "18:00", s: 2 },
  { id: 22, m: "15:00", s: 2 },
  { id: 23, m: "12:30", s: 2 },
  { id: 25, m: "15:30", s: 2 },
  { id: 26, m: "15:30", s: 2 },
  { id: 29, m: "19:00", s: 2 },
  { id: 33, m: "12:30", s: 2 },
  { id: 34, m: "20:15", s: 2 },
];

export const NT: NotificationItem[] = [
  { id: 1, x: "New high-confidence pick: Arsenal v Chelsea, Over 1.5 Goals", m: 1, t: Date.now() - 3e5 },
  { id: 2, x: "Real Madrid v Bayern Munich kicks off tonight at 21:00", m: 4, t: Date.now() - 36e5 },
  { id: 3, x: "Man City v Liverpool: new analysis is ready", m: 2, t: Date.now() - 108e5 },
  { id: 4, x: "Welcome to Spider Picks. Share your first post on the feed.", t: Date.now() - 864e5 },
];

export const LOGOS: Record<string, string> = {
  // Premier League
  "Arsenal": "https://media.api-sports.io/football/teams/42.png",
  "Chelsea": "https://media.api-sports.io/football/teams/49.png",
  "Man City": "https://media.api-sports.io/football/teams/50.png",
  "Liverpool": "https://media.api-sports.io/football/teams/40.png",
  "Man United": "https://media.api-sports.io/football/teams/33.png",
  "Tottenham": "https://media.api-sports.io/football/teams/47.png",
  "Newcastle": "https://media.api-sports.io/football/teams/34.png",
  "Aston Villa": "https://media.api-sports.io/football/teams/66.png",
  "Brighton": "https://media.api-sports.io/football/teams/51.png",
  "West Ham": "https://media.api-sports.io/football/teams/48.png",
  "Wolves": "https://media.api-sports.io/football/teams/39.png",
  "Everton": "https://media.api-sports.io/football/teams/45.png",
  "Crystal Palace": "https://media.api-sports.io/football/teams/52.png",
  "Fulham": "https://media.api-sports.io/football/teams/36.png",

  // Champions League & European Giants
  "Real Madrid": "https://media.api-sports.io/football/teams/541.png",
  "Bayern Munich": "https://media.api-sports.io/football/teams/157.png",
  "Barcelona": "https://media.api-sports.io/football/teams/529.png",
  "Atletico Madrid": "https://media.api-sports.io/football/teams/530.png",
  "Inter Milan": "https://media.api-sports.io/football/teams/505.png",
  "AC Milan": "https://media.api-sports.io/football/teams/489.png",
  "Leverkusen": "https://media.api-sports.io/football/teams/168.png",
  "Dortmund": "https://media.api-sports.io/football/teams/165.png",
  "Paris Saint-Germain": "https://media.api-sports.io/football/teams/85.png",
  "PSG": "https://media.api-sports.io/football/teams/85.png",
  "Marseille": "https://media.api-sports.io/football/teams/81.png",
  "Monaco": "https://media.api-sports.io/football/teams/91.png",
  "Lyon": "https://media.api-sports.io/football/teams/80.png",
  "Lille": "https://media.api-sports.io/football/teams/79.png",
  "Lens": "https://media.api-sports.io/football/teams/116.png",
  "Rennes": "https://media.api-sports.io/football/teams/94.png",
  "Nice": "https://media.api-sports.io/football/teams/84.png",

  // La Liga & Serie A
  "Sevilla": "https://media.api-sports.io/football/teams/536.png",
  "Real Sociedad": "https://media.api-sports.io/football/teams/548.png",
  "Athletic Bilbao": "https://media.api-sports.io/football/teams/531.png",
  "Villarreal": "https://media.api-sports.io/football/teams/533.png",
  "Valencia": "https://media.api-sports.io/football/teams/532.png",
  "Real Betis": "https://media.api-sports.io/football/teams/543.png",
  "Girona": "https://media.api-sports.io/football/teams/547.png",
  "Juventus": "https://media.api-sports.io/football/teams/496.png",
  "Napoli": "https://media.api-sports.io/football/teams/492.png",
  "Roma": "https://media.api-sports.io/football/teams/497.png",
  "Lazio": "https://media.api-sports.io/football/teams/487.png",
  "Atalanta": "https://media.api-sports.io/football/teams/499.png",
  "Fiorentina": "https://media.api-sports.io/football/teams/502.png",
  "Bologna": "https://media.api-sports.io/football/teams/500.png",
  "Torino": "https://media.api-sports.io/football/teams/503.png",

  // Bundesliga
  "RB Leipzig": "https://media.api-sports.io/football/teams/173.png",
  "Stuttgart": "https://media.api-sports.io/football/teams/172.png",
  "Frankfurt": "https://media.api-sports.io/football/teams/169.png",
  "Wolfsburg": "https://media.api-sports.io/football/teams/161.png",
  "Gladbach": "https://media.api-sports.io/football/teams/163.png",

  // World / International
  "Al Hilal": "https://media.api-sports.io/football/teams/1021.png",
  "Al Nassr": "https://media.api-sports.io/football/teams/1022.png",
  "Inter Miami": "https://media.api-sports.io/football/teams/1614.png",
  "LA Galaxy": "https://media.api-sports.io/football/teams/1608.png",
  "Ajax": "https://media.api-sports.io/football/teams/194.png",
  "Feyenoord": "https://media.api-sports.io/football/teams/197.png",
  "Celtic": "https://media.api-sports.io/football/teams/247.png",
  "Rangers": "https://media.api-sports.io/football/teams/257.png",
  "Porto": "https://media.api-sports.io/football/teams/212.png",
  "Sporting CP": "https://media.api-sports.io/football/teams/228.png",
  "Benfica": "https://media.api-sports.io/football/teams/211.png",
};

export const col = (n: string): string => {
  let x = 0;
  for (const c of n) x = (x * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${x} 55% 38%)`;
};

export const seed = (id: number, k: number): number => {
  const x = Math.sin(id * 97 + k * 13) * 1e4;
  return x - Math.floor(x);
};

export const form = (id: number, k: number): ('W' | 'D' | 'L')[] => {
  return [0, 1, 2, 3, 4]
    .map((i) => ("WWDLW"[Math.floor(seed(id, k * 5 + i) * 5) % 5] || "W") as 'W' | 'D' | 'L')
    .map((x) => (x === 'W' || x === 'D' || x === 'L' ? x : 'W'));
};

export const ago = (t: number): string => {
  const m = Math.floor((Date.now() - t) / 6e4);
  return m < 1 ? "now" : m < 60 ? m + "m" : m < 1440 ? Math.floor(m / 60) + "h" : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const pic = (a: string, b: string): string => {
  return "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="200" cy="150" r="60" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4"/><path d="M200 0V300M0 150H400" stroke="#fff" stroke-opacity=".3" stroke-width="4"/></svg>`
  );
};

export const INITIAL_POSTS: PostItem[] = [];

export const generateEndlessFeedPosts = (_page: number): PostItem[] => {
  return [];
};

export const LEGAL_CONTENT = {
  privacy: [
    "Privacy Policy",
    [
      ["Information we collect", "When you create an account we collect your email address and the name you choose. If you post, we store your text, photos, booking codes, likes and comments."],
      ["How we use it", "We use your information to run your account, show your posts, send the notifications you allow, and improve the app. We do not sell your personal information."],
      ["Sharing", "Posts you publish are visible to other users. We share other data only with providers who help us run the app, or when the law requires it."],
      ["Security", "We take reasonable steps to protect your data. No online service is completely secure, so please use a strong password."],
      ["Your choices", "You can delete your posts, turn off notifications, or ask us to delete your account and data."],
      ["Age", "Spider Picks is for people aged 18 and over. We do not knowingly collect data from anyone under 18."],
      ["Changes and contact", "We may update this policy and will change the date above when we do. Questions: support@spiderpicks.com."],
    ],
  ],
  terms: [
    "Terms of Service",
    [
      ["Using the app", "You must be 18 or older. Give accurate details, keep your password private, and use one account."],
      ["Predictions", "Our picks are statistical analysis only. They are not guaranteed and are not financial advice. You decide what to do with them."],
      ["Your content", "You own what you post, and you let us display it in the app. Do not post anything illegal, abusive, misleading or spam. Booking codes are shared at your own risk. We may remove content or accounts that break these rules."],
      ["VIP plan", "Membership club features will be available. Prices and terms will be shown clearly before you pay."],
      ["Liability", "The app is provided as is. To the extent the law allows, we are not responsible for losses, including betting losses, that follow from using it."],
      ["Changes and contact", "We may update these terms and will change the date above when we do. Questions: support@spiderpicks.com."],
    ],
  ],
  responsible: [
    "Responsible Betting",
    [
      ["Play for fun", "Betting is entertainment, not a way to make money. Only stake what you can afford to lose."],
      ["Set limits", "Decide your budget and time before you play, and stick to them. Never chase losses."],
      ["18 and over", "Betting is for adults only. Never let anyone under 18 use your betting accounts."],
      ["Get help", "If gambling is causing you stress or money problems, talk to someone you trust or contact a gambling support service in your country."],
      ["Our picks", "No pick is certain. A high confidence score is not a promise of a win."],
    ],
  ],
};
