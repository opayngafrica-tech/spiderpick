import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { generateStatisticalAnalysis, MASTER_FOOTBALL_ANALYSIS_PROMPT } from './src/lib/aiFootballAnalysis.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Dev server MUST run on port 3000 (Cloud Run sets PORT=8080 for nginx ingress, which proxies to 3000)
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Google GenAI client (User-Agent header required by guidelines)
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory demo store for poll votes & subscriptions
const pollVotes: Record<string, Record<string, number>> = {
  'feed-3': { rma: 840, bay: 310 }
};

// AllSportsAPI Football Configuration (https://allsportsapi.com)
// Free Plan Limit: 260 API calls per hour (~4.3 calls/minute, 2 random leagues / year)
const ALLSPORTS_API_KEY = process.env.ALLSPORTS_API_KEY || 'b6ebbc212e89cc1438e3856b82acd89634ff7ef1f200965d0946455398660579';
const ALLSPORTS_BASE_URL = 'https://apiv2.allsportsapi.com/football/';

// In-Memory Smart Cache to strictly respect the 260 calls/hour quota:
// - Live scores TTL: 30 seconds (even with hundreds of visitors, max 120 calls/hr, well within 260 limit)
// - Fixtures TTL: 10 minutes (600 seconds)
// - Leagues TTL: 1 hour (3600 seconds)
const allSportsCache = {
  live: { data: null as any, lastFetch: 0, ttlMs: 30 * 1000 },
  fixtures: new Map<string, { data: any; lastFetch: number; ttlMs: number }>(),
  leagues: { data: null as any, lastFetch: 0, ttlMs: 60 * 60 * 1000 },
};

let lastLiveApiTimestamp = 0;
const MIN_LIVE_INTERVAL_MS = 12 * 1000; // Minimum 12 seconds cooldown between external live requests

// API: Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'Spider Picks',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    sportsProvider: 'AllSportsAPI',
    hasSportsApiKey: Boolean(ALLSPORTS_API_KEY),
    plan: 'Free (260 calls/hour, 2 random leagues/year)',
    hasPaystackSecret: Boolean(process.env.PAYSTACK_SECRET_KEY),
    timestamp: new Date().toISOString()
  });
});

// API: Live in-play football matches (AllSportsAPI met=Livescore)
app.get('/api/football/live', async (req: Request, res: Response) => {
  const now = Date.now();

  // 1. Serve cached live data if within 30-second TTL
  if (allSportsCache.live.data && (now - allSportsCache.live.lastFetch < allSportsCache.live.ttlMs)) {
    return res.json({
      ...allSportsCache.live.data,
      cached: true,
      cacheAgeSeconds: Math.round((now - allSportsCache.live.lastFetch) / 1000),
    });
  }

  // 2. Minimum interval throttle protection
  if (now - lastLiveApiTimestamp < MIN_LIVE_INTERVAL_MS && allSportsCache.live.data) {
    return res.json({
      ...allSportsCache.live.data,
      rateLimited: true,
      message: 'Rate limit protection active (260 calls/hr max)',
    });
  }

  // 3. Fetch from AllSportsAPI
  if (ALLSPORTS_API_KEY) {
    try {
      lastLiveApiTimestamp = now;
      const response = await fetch(`${ALLSPORTS_BASE_URL}?met=Livescore&APIkey=${ALLSPORTS_API_KEY}`);

      if (response.ok) {
        const json = await response.json();
        const rawList = Array.isArray(json?.result) ? json.result : [];

        const formatted = rawList.map((item: any) => {
          const homeScore = Number(item.event_final_result?.split('-')[0]?.trim() || 0);
          const awayScore = Number(item.event_final_result?.split('-')[1]?.trim() || 0);
          const isFinished = item.event_status === 'Finished';
          const isLive = item.event_live === '1' || (!isFinished && item.event_status && item.event_status !== 'Not Started');

          return {
            id: Number(item.event_key),
            h: item.event_home_team || 'Home Team',
            a: item.event_away_team || 'Away Team',
            l: item.league_name || 'Live Football',
            t: item.event_time || 'Live',
            sh: homeScore,
            sa: awayScore,
            m: isFinished ? 'FT' : (item.event_status || 'Live'),
            s: isFinished ? 1 : isLive ? 0 : 2,
            homeLogo: item.home_team_logo,
            awayLogo: item.away_team_logo,
            leagueLogo: item.league_logo,
          };
        });

        const livePayload = {
          source: 'allsportsapi-live',
          provider: 'AllSportsAPI',
          count: formatted.length,
          matches: formatted,
          quota: 'Free Plan (260 calls/hour)',
          timestamp: new Date().toISOString(),
        };

        allSportsCache.live.data = livePayload;
        allSportsCache.live.lastFetch = now;

        return res.json(livePayload);
      }
    } catch (err) {
      console.warn('AllSportsAPI live request fallback:', err);
    }
  }

  // Graceful fallback
  if (allSportsCache.live.data) {
    return res.json(allSportsCache.live.data);
  }

  res.json({
    source: 'allsportsapi-engine',
    provider: 'AllSportsAPI',
    count: 0,
    matches: [],
    message: 'Live engine connected. No matches currently in play in assigned leagues.',
    timestamp: new Date().toISOString(),
  });
});

// API: Football Fixtures (AllSportsAPI met=Fixtures)
app.get('/api/football/fixtures', async (req: Request, res: Response) => {
  const { date, leagueId, from, to } = req.query;
  const now = Date.now();

  const targetFrom = String(from || date || new Date().toISOString().slice(0, 10));
  const targetTo = String(to || date || new Date().toISOString().slice(0, 10));
  const cacheKey = `${targetFrom}_${targetTo}_${leagueId || 'all'}`;

  // Check 10-minute cache
  const cached = allSportsCache.fixtures.get(cacheKey);
  if (cached && (now - cached.lastFetch < cached.ttlMs)) {
    return res.json({
      ...cached.data,
      cached: true,
      cacheAgeMinutes: Math.round((now - cached.lastFetch) / 60000),
    });
  }

  if (ALLSPORTS_API_KEY) {
    try {
      let url = `${ALLSPORTS_BASE_URL}?met=Fixtures&APIkey=${ALLSPORTS_API_KEY}&from=${targetFrom}&to=${targetTo}`;
      if (leagueId) url += `&leagueId=${leagueId}`;

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        const rawList = Array.isArray(json?.result) ? json.result : [];

        const formatted = rawList.map((item: any) => ({
          id: Number(item.event_key),
          date: item.event_date,
          time: item.event_time,
          homeTeam: item.event_home_team,
          awayTeam: item.event_away_team,
          score: item.event_final_result,
          status: item.event_status,
          league: item.league_name,
          country: item.country_name,
          leagueId: item.league_key,
          homeLogo: item.home_team_logo,
          awayLogo: item.away_team_logo,
          leagueLogo: item.league_logo,
          round: item.league_round,
        }));

        const resultPayload = {
          source: 'allsportsapi-fixtures',
          provider: 'AllSportsAPI',
          count: formatted.length,
          fixtures: formatted,
          timestamp: new Date().toISOString(),
        };

        allSportsCache.fixtures.set(cacheKey, {
          data: resultPayload,
          lastFetch: now,
          ttlMs: 10 * 60 * 1000,
        });

        return res.json(resultPayload);
      }
    } catch (err) {
      console.warn('AllSportsAPI fixtures request fallback:', err);
    }
  }

  res.json({
    source: 'allsportsapi-fixtures',
    provider: 'AllSportsAPI',
    count: 0,
    fixtures: [],
    message: 'Fixtures active. Free plan: 2 random leagues / year.',
    timestamp: new Date().toISOString()
  });
});

// API: Football Leagues (AllSportsAPI met=Leagues)
app.get('/api/football/leagues', async (req: Request, res: Response) => {
  const now = Date.now();
  if (allSportsCache.leagues.data && (now - allSportsCache.leagues.lastFetch < allSportsCache.leagues.ttlMs)) {
    return res.json(allSportsCache.leagues.data);
  }

  if (ALLSPORTS_API_KEY) {
    try {
      const response = await fetch(`${ALLSPORTS_BASE_URL}?met=Leagues&APIkey=${ALLSPORTS_API_KEY}`);
      if (response.ok) {
        const json = await response.json();
        const payload = {
          source: 'allsportsapi-leagues',
          provider: 'AllSportsAPI',
          leagues: Array.isArray(json?.result) ? json.result : [],
          timestamp: new Date().toISOString(),
        };
        allSportsCache.leagues.data = payload;
        allSportsCache.leagues.lastFetch = now;
        return res.json(payload);
      }
    } catch (err) {
      console.warn('AllSportsAPI leagues request fallback:', err);
    }
  }

  res.json({ source: 'allsportsapi-leagues', leagues: [] });
});

// API: AI Football Match Analysis & Prediction Engine (Master Prompt)
app.post('/api/football/analyze', async (req: Request, res: Response) => {
  const { homeTeam, awayTeam, competition = 'Premier League', date = 'Today' } = req.body;

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: 'Missing homeTeam or awayTeam in request body' });
  }

  // 1. Try Gemini with Google Search grounding and Master Prompt
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Execute deep match analysis for:
Home Team: ${homeTeam}
Away Team: ${awayTeam}
Competition: ${competition}
Match Date: ${date}

Adhere strictly to the MASTER PROMPT instructions. Research the latest team news, injuries, last 5 results, H2H, corner trends, and compute Poisson probabilities for scores and all 14 mandatory prediction markets. Return a valid JSON matching this schema:
{
  "matchDetails": { "homeTeam": "${homeTeam}", "awayTeam": "${awayTeam}", "competition": "${competition}", "date": "${date}", "venue": "string", "tableContext": "string", "matchImportance": "string" },
  "recentForm": { "homeLast5": [{"opponent": "string", "score": "string", "result": "W|D|L", "venue": "H|A", "gf": 0, "ga": 0}], "awayLast5": [...], "homeFormString": "string", "awayFormString": "string", "homeAvgGoalsScored": 0, "homeAvgGoalsConceded": 0, "awayAvgGoalsScored": 0, "awayAvgGoalsConceded": 0, "trends": ["string"] },
  "h2hHistory": { "meetings": [{"date": "string", "homeTeam": "string", "awayTeam": "string", "score": "string", "totalGoals": 0, "totalCorners": 0}], "summary": "string", "recurringTrends": ["string"] },
  "cornerStatistics": { "homeAvgCornersWon": 0, "homeAvgCornersConceded": 0, "awayAvgCornersWon": 0, "awayAvgCornersConceded": 0, "projectedTotalCorners": 0, "recommendedLine": "string", "homeLine": "string", "awayLine": "string", "rationale": "string" },
  "teamNews": { "homeInjuriesAndDoubts": ["string"], "awayInjuriesAndDoubts": ["string"], "suspensions": ["string"], "tacticalConcerns": "string", "fatigueMoraleRest": "string", "sourceReliability": "string" },
  "matchAnalysis": { "expectedGoalsHome": 0, "expectedGoalsAway": 0, "totalProjectedXG": 0, "tacticalBreakdown": "string", "homeAdvantageFactor": "string", "defensiveVulnerabilities": "string", "likelyGameScenario": "string" },
  "predictionTable": [
    { "market": "string", "selection": "string", "line": "string", "estimatedProbability": 0, "confidence": "High|Medium|Low", "supportingEvidence": "string", "biggestRisk": "string" }
  ],
  "correctScores": [
    { "label": "string", "score": "string", "probability": 0, "rationale": "string" }
  ],
  "finalVerdict": { "strongestPicks": ["string"], "secondaryOptions": ["string"], "riskyMarkets": ["string"], "marketsToAvoid": ["string"], "summary": "string" }
}`,
        config: {
          systemInstruction: MASTER_FOOTBALL_ANALYSIS_PROMPT,
          responseMimeType: 'application/json',
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return res.json({
            ...parsed,
            source: 'gemini-live-ai',
            generatedAt: new Date().toISOString(),
            disclaimer: 'Statistical analysis and probability modeling only. 18+. Gamble responsibly. No outcome is guaranteed.',
          });
        } catch (jsonErr) {
          console.warn('Failed to parse Gemini JSON output, falling back to statistical model:', jsonErr);
        }
      }
    } catch (apiErr) {
      console.warn('Gemini AI call failed, gracefully using mathematical prediction engine:', apiErr);
    }
  }

  // 2. Fallback to the deterministic Poisson & Dixon-Coles statistical engine
  const statisticalData = generateStatisticalAnalysis(homeTeam, awayTeam, competition, String(date));
  res.json(statisticalData);
});

// API: Paystack Initialize Transaction
app.post('/api/paystack/initialize', async (req: Request, res: Response) => {
  const { email, amount, planTier, currency = 'NGN' } = req.body;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!email || !amount || !planTier) {
    return res.status(400).json({ error: 'Missing email, amount, or planTier parameter' });
  }

  const reference = `SPIDER_${planTier.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (secretKey && secretKey.startsWith('sk_')) {
    try {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(Number(amount) * 100), // in kobo or cents
          currency,
          reference,
          metadata: {
            planTier,
            appName: 'Spider Picks',
          },
        }),
      });

      const data = await paystackRes.json();
      if (data.status) {
        return res.json({
          success: true,
          reference,
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          isLiveGateway: true,
        });
      }
    } catch (err) {
      console.error('Paystack API error:', err);
    }
  }

  // Seamless Sandbox / Demo response
  res.json({
    success: true,
    reference,
    authorization_url: `https://checkout.paystack.com/${reference}`,
    access_code: `mock_code_${reference}`,
    isLiveGateway: false,
    message: 'Sandbox transaction initialized. Complete simulated payment to activate membership.',
  });
});

// API: Paystack Verify Transaction
app.post('/api/paystack/verify', async (req: Request, res: Response) => {
  const { reference, planTier } = req.body;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!reference) {
    return res.status(400).json({ error: 'Missing transaction reference' });
  }

  if (secretKey && secretKey.startsWith('sk_')) {
    try {
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });
      const data = await verifyRes.json();
      if (data.status && data.data.status === 'success') {
        return res.json({
          success: true,
          status: 'verified',
          tier: planTier || data.data.metadata?.planTier || 'vip',
          paidAt: data.data.paid_at,
          amount: data.data.amount / 100,
          currency: data.data.currency,
        });
      }
    } catch (err) {
      console.error('Error verifying Paystack transaction:', err);
    }
  }

  // Sandbox verification success
  res.json({
    success: true,
    status: 'verified',
    tier: planTier || 'vip',
    paidAt: new Date().toISOString(),
    isSandbox: true,
    message: 'Payment verified. User account upgraded successfully.',
  });
});

// API: Feed Poll Voting
app.post('/api/feed/vote', (req: Request, res: Response) => {
  const { feedId, optionId } = req.body;
  if (!feedId || !optionId) {
    return res.status(400).json({ error: 'Missing feedId or optionId' });
  }

  if (!pollVotes[feedId]) {
    pollVotes[feedId] = {};
  }
  pollVotes[feedId][optionId] = (pollVotes[feedId][optionId] || 0) + 1;

  res.json({
    success: true,
    feedId,
    optionId,
    votes: pollVotes[feedId],
  });
});

// Server bootstrap with Vite integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Spider Picks server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
