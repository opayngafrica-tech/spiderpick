# Saviour Analysis — Professional Football Intelligence & Predictions Platform

A high-performance, mobile-first football analysis and prediction platform designed with a dark pitch interface, vibrant emerald branding, and real statistical prediction models (Poisson distribution, xG trends, head-to-head dynamics).

---

## ⚡ Key Features

1. **Daily Algorithmic Picks**:
   - Filter by date (Yesterday, Today, Tomorrow, Weekend) and top competitions (Premier League, UEFA Champions League, La Liga, Serie A, Bundesliga, Ligue 1).
   - Market recommendations: **Match Result (1X2)**, **Double Chance**, **Over/Under Goals**, and **Both Teams to Score (BTTS)**.
   - High-confidence **Banker of the Day** (80%+ threshold).
   - Value bets, odds comparisons, and calculated probability distributions.
   - Save/bookmark picks with offline & Supabase persistence.

2. **Accumulator Slip Builder**:
   - Interactive accumulator slip with multi-match compounding odds calculation.
   - Dynamic stake presets (NGN ₦, USD $, EUR €, GBP £) with estimated payouts.
   - Unique Saviour Booking Code generator (`SAV-XXXX-X`) with one-click copy.

3. **Live Match Center & In-Play Telemetry**:
   - Real-time score ticker, elapsed minute counters (`2H 68'`), and live match events (goals, cards, substitutions).
   - Attacking momentum visualization and in-play shot statistics.
   - Algorithmic in-play prediction signals.

4. **Deep Statistical Hub & Analysis**:
   - League standings with goal differences and 5-match form badges.
   - Goal scoring minute distribution charts (15-minute intervals).
   - Historical Head-to-Head (H2H) matrix.
   - Expected goals (xG), clean sheets, and Over 2.5 / BTTS rates.

5. **Community Feed & Tactical Briefings**:
   - In-depth tactical previews from certified analysts.
   - Interactive community voting polls with instant percentage feedback.
   - Curated 3-Fold and 4-Fold Banker Accumulator drops with 1-click "Load to Slip".

6. **VIP Membership & Paystack Payment Integration**:
   - Tier system: **Free Trial**, **Pro Analyst**, and **VIP Elite Club**.
   - Server-side Paystack transaction initialization (`/api/paystack/initialize`) and verification (`/api/paystack/verify`).
   - Card, USSD, and Bank Transfer checkout simulation and live production readiness.
   - Instant unlock of VIP Banker picks and Telegram channel hotline.

7. **Authentication & User Management**:
   - Supabase Auth integration with local fallback session support.
   - Email/password registration, sign in, and password recovery.
   - Instant demo role switcher (Free, Pro, VIP) for seamless product evaluation.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
- **Backend**: Node.js & Express server-side API proxy with Vite middleware integration
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies
- **Football Data**: API-Football (`https://v3.football.api-sports.io`) with server-side proxying and caching
- **Payments**: Paystack gateway integration with reference verification

---

## 🚀 Environment Variables

Copy `.env.example` to `.env`:

```bash
# Supabase Configuration (from Supabase Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# API-Football Credentials (from RapidAPI or api-football.com)
API_FOOTBALL_KEY="your-api-football-key"
API_FOOTBALL_BASE_URL="https://v3.football.api-sports.io"

# Paystack Gateway (from Paystack Dashboard -> Settings -> API Keys)
PAYSTACK_PUBLIC_KEY="pk_test_your_public_key"
PAYSTACK_SECRET_KEY="sk_test_your_secret_key"
```

*Note: If external keys are not provided, Saviour Analysis automatically operates in high-fidelity demonstration mode using realistic top-tier football data without crashing.*

---

## 🗄️ Database Setup & Supabase Migrations

To apply the database schema to your Supabase project:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Paste the contents of `/supabase/migrations/001_initial_schema.sql` and click **Run**.
4. The migration automatically provisions `profiles`, `leagues`, `teams`, `fixtures`, `predictions`, `saved_picks`, `subscriptions`, and `notifications` tables along with hardened RLS security policies.

---

## 💻 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev
```

Visit `http://localhost:3000` to interact with the platform.
