## PolyEdge

AI‑driven prediction market analytics. PolyEdge ingests real‑time data from multiple exchanges via the PolyRouter API, normalizes it into Supabase (PostgreSQL), computes actionable analytics, and presents curated "Top Picks" with LLM‑generated explanations. A Sports module (NBA first) is scaffolded for player/game predictions using the balldontlie API (will be implemented after analytics algorithm is refined).

### Purpose
- Unify prediction market data across platforms (Polymarket, Kalshi, Manifold, Limitless, …)
- Detect value opportunities with analytics (probability movement, liquidity, volatility, arbitrage)
- Generate short, high‑signal explanations using LLMs
- Provide modular architecture for future Sports forecasting (NBA → NFL/MLB)

### MVP Scope
- Next.js 14+ (App Router), TypeScript, Tailwind (dark theme)
- Supabase as primary DB with RLS; server writes via service role
- Data ingestion via Vercel Cron: markets, outcomes, price history
- Analytics engine to rank markets and generate Top Picks
- LLM endpoint for pick explanations with provider selection (OpenAI/Anthropic/OpenRouter via Vercel AI SDK)
- Mobile‑optimized dashboard and detail pages

### What’s Implemented (current)
- Database schema (`supabase-schema.sql`) for markets/outcomes/price_history/top_picks and Sports tables
- Supabase clients (`supabase`/`supabaseAdmin`) wired via env
- PolyRouter client with rate‑limiting; normalizers for markets/outcomes/price history
- Cron routes
  - `/api/cron/sync-markets` (open markets; multi‑platform)
  - `/api/cron/sync-price-history`
  - `/api/cron/generate-top-picks`
- Public API routes
  - `/api/markets` (includes outcomes)
  - `/api/markets/[id]` (detail + outcomes)
  - `/api/top-picks` and `/api/top-picks/[id]` (includes joined market)
- Analytics utilities (`src/lib/analytics/*`) with metrics and Top Picks generator
- LLM plumbing (`/api/llm/explain-pick`) + admin test page
- Realtime polling hook with visibility/backoff
- UI: Dashboard, Market cards/detail, Top Pick cards/detail, mobile nav, carousels, collapsible filters
- Caching: in‑memory LRU for API responses
- Vercel config: cron schedules for ingestion and pick generation

### Current Behavior
- Real markets synced into Supabase (multiple platforms)
- Price history syncing in place (availability varies per market)
- Top Picks generated automatically; UI currently shows placeholder "Yes/No" until analytics side‑selection is finalized
- Clickthrough pages for market and pick details

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
