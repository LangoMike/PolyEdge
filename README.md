## PolyEdge

AI‑driven prediction market analytics platform that unifies data from multiple prediction market exchanges, analyzes market dynamics, and provides actionable trading insights. PolyEdge ingests real‑time data from multiple exchanges via the PolyRouter API, normalizes it into Supabase (PostgreSQL), computes sophisticated analytics, and presents curated "Top Picks" with LLM‑generated explanations.

### Purpose
- **Unify Prediction Markets**: Aggregate data from Polymarket, Kalshi, Manifold, Limitless, ProphetX, Novig, and SXBet
- **Detect Value Opportunities**: Advanced analytics identify mispriced markets, arbitrage opportunities, and trending movements
- **Generate Actionable Insights**: AI-powered recommendations with confidence scores and detailed reasoning
- **Provide Trading Intelligence**: Real-time market statistics, liquidity analysis, and risk assessment
- **Modular Architecture**: Extensible design for future Sports forecasting (NBA → NFL/MLB) and additional market types

### MVP Scope
- Next.js 14+ (App Router), TypeScript, Tailwind (dark theme)
- Supabase as primary DB with RLS; server writes via service role
- Data ingestion via Vercel Cron: markets, outcomes, price history
- Analytics engine to rank markets and generate Top Picks
- LLM endpoint for pick explanations with provider selection (OpenAI/Anthropic/OpenRouter via Vercel AI SDK)
- Mobile‑optimized dashboard and detail pages

### What's Implemented (current)
- **Database & Infrastructure**
  - Database schema (`supabase-schema.sql`) for markets/outcomes/price_history/top_picks and Sports tables
  - Supabase clients (`supabase`/`supabaseAdmin`) wired via env
  - PolyRouter client with rate‑limiting and enhanced error handling
  - Data normalizers for markets/outcomes/price history with improved processing

- **Data Pipeline & APIs**
  - Cron routes for automated data ingestion:
    - `/api/cron/sync-markets` (open markets; multi‑platform)
    - `/api/cron/sync-price-history`
    - `/api/cron/generate-top-picks`
  - Public API routes with caching:
    - `/api/markets` (includes outcomes)
    - `/api/markets/[id]` (detail + outcomes)
    - `/api/top-picks` and `/api/top-picks/[id]` (includes joined market)
    - `/api/stats` (real-time market statistics)
  - Model training endpoints:
    - `/api/train-model` (train analytics model)
    - `/api/setup/training-data` (seed synthetic data)

- **Analytics & AI**
  - Advanced analytics utilities (`src/lib/analytics/*`) with comprehensive metrics
  - Machine learning model with training capabilities
  - Top Picks generator with confidence scoring and edge calculation
  - LLM integration (`/api/llm/explain-pick`) + admin test page (`/admin/llm-test`)
  - Calibration system for probability assessment accuracy

- **Frontend & UI**
  - **Dashboard**: Real-time stats, polling indicators, enhanced market display
  - **Market Cards**: Platform-specific styling, improved price visualization, liquidity indicators
  - **For You Cards**: Analytics integration, confidence scoring, edge calculations
  - **Top Pick Cards**: Enhanced analytics display with reasoning
  - **Mobile Navigation**: Responsive design with platform badges
  - **Carousels & Filters**: Swipeable interfaces with collapsible filters
  - **Pages**: Analytics overview (`/analytics`), For You pages (`/for-you`, `/for-you-simple`)

- **Real-time Features**
  - Polling hooks with visibility/backoff (`useTopPicks`, `useTopPicksSimple`, `useStats`)
  - In-memory LRU caching for API responses
  - Real-time market statistics and volume tracking
  - Live price updates with 24h change indicators

- **Deployment & Configuration**
  - Vercel deployment with cron schedules for data ingestion
  - Environment-based configuration for multiple environments
  - Comprehensive error handling and logging

### Current Behavior
- **Data Pipeline**: Real markets synced from 7+ platforms into Supabase with real-time updates
- **Analytics Engine**: Advanced ML model generates Top Picks with confidence scores and edge calculations
- **Market Intelligence**: 
  - Real-time statistics dashboard with volume, liquidity, and market metrics
  - Platform-specific market cards with enhanced visualization
  - For You cards with personalized recommendations and analytics integration
- **Trading Insights**: 
  - Confidence levels (HIGH/MED/LOW) with clear trading guidance
  - Edge percentage calculations for value identification
  - Liquidity scoring for risk assessment
- **User Experience**: 
  - Mobile-optimized interface with responsive design
  - Real-time polling with visual indicators
  - Clickthrough pages for detailed market and pick analysis
  - Platform-specific external links for direct trading

### Routes
- Public pages
  - `/` Home dashboard
  - `/for-you` Personalized picks (experimental)
  - `/for-you-simple` Lightweight picks list (experimental)
  - `/analytics` Analytics overview
  - `/markets/[id]` Market detail
  - `/picks/[id]` Top Pick detail
- API routes
  - `/api/markets`, `/api/markets/[id]`
  - `/api/top-picks`, `/api/top-picks/[id]`
  - `/api/llm/explain-pick`
  - Cron: `/api/cron/sync-markets`, `/api/cron/sync-price-history`, `/api/cron/generate-top-picks`

### Next Steps
- Implement analytics side‑selection (choose Yes/No vs Watch) using computed signals
- Integrate LLM reasoning post‑selection and display on cards
- Backtest/tune weights and confidence mapping
- Sports module data pipeline and NBA prediction model

### Local Development
```bash
npm run dev
# visit http://localhost:3000
```

Set required env in `.env.local`:
```
POLYROUTER_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...    # optional (for LLM explanations)
```

### Deployment
- Vercel (Next.js app). `vercel.json` configures cron jobs.

### Changelog
- See `CHANGELOG.md` for a chronological list of updates.

### Key Concepts & Components

#### Understanding Prediction Markets
Prediction markets are platforms where users can bet on the outcome of future events. Prices represent the market's collective probability assessment:
- **Yes/No Markets**: Binary outcomes where prices range from $0.00 to $1.00
- **Price as Probability**: A $0.65 price means 65% probability of the event occurring
- **Market Efficiency**: Prices reflect collective wisdom and available information

#### Core Analytics Metrics

**Liquidity Percentage**
- **What it means**: Measures how easily you can buy/sell without significantly moving the price
- **Calculation**: Based on 24h volume, price spread, and market depth
- **Interpretation**: 
  - 80%+ = High liquidity (easy to trade large amounts)
  - 50-80% = Medium liquidity (moderate trade sizes)
  - <50% = Low liquidity (small trades only, price impact likely)

**Confidence Levels**
- **HIGH (70%+)**: Strong signal, high conviction recommendation
- **MED (55-70%)**: Moderate signal, consider with caution
- **LOW (<55%)**: Weak signal, watch only or avoid

**Edge Percentage**
- **What it means**: Our model's estimated advantage over market price
- **Calculation**: Difference between our probability assessment and current market price
- **Trading Strategy**: Higher edge = better risk/reward ratio

**Probability Percentage (P(win))**
- **What it means**: Our model's assessment of the true probability
- **Usage**: Compare against market price to identify value opportunities
- **Example**: If market says 60% but we think 75%, that's a 15% edge

#### How Our Prediction Model Works

1. **Data Ingestion**: Real-time market data from multiple exchanges via PolyRouter API
2. **Feature Engineering**: Extract 20+ features including:
   - Price momentum and volatility
   - Volume patterns and liquidity metrics
   - Market age and time-to-resolution
   - Historical performance patterns
3. **Model Training**: Machine learning model trained on historical price movements
4. **Probability Assessment**: Model outputs calibrated probability estimates
5. **Value Detection**: Compare model predictions with current market prices
6. **Risk Scoring**: Assess confidence based on data quality and model certainty

#### Trading Strategy Based on Our Data

**For High Confidence Picks (70%+ confidence)**:
- **Buy Yes** when our probability > market price by 10%+
- **Buy No** when our probability < market price by 10%+
- **Position Size**: 2-5% of portfolio per pick

**For Medium Confidence Picks (55-70% confidence)**:
- **Smaller positions**: 1-2% of portfolio
- **Set stop losses**: Exit if confidence drops below 50%
- **Monitor closely**: Watch for additional signals

**For Low Confidence Picks (<55% confidence)**:
- **Watch only**: Don't trade, just observe
- **Learn**: Use for model improvement and pattern recognition

**Risk Management**:
- **Diversify**: Don't put more than 20% in any single category
- **Time decay**: Markets closer to resolution have higher risk
- **Liquidity**: Only trade markets with >60% liquidity
- **Position sizing**: Scale based on confidence and edge percentage

#### Platform-Specific Features

**Polymarket**: Largest volume, best liquidity, crypto-based
**Kalshi**: US-regulated, traditional finance integration
**Manifold**: Community-driven, unique market types
**Limitless**: Decentralized, permissionless markets
**ProphetX**: Professional trading tools
**Novig**: Sports-focused predictions
**SXBet**: Sports betting integration

