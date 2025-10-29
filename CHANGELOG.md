## Changelog

All notable changes to this project will be documented in this file.

### 2025-10-29 (Latest Updates)
- **New For You Card Component**: `src/components/ForYouCard.tsx` - Enhanced market cards with analytics integration, liquidity calculations, and platform-specific styling
- **Stats Dashboard**: Added `src/hooks/useStats.ts` and `src/app/api/stats/route.ts` for real-time market statistics
- **Model Training Infrastructure**: 
  - `src/app/api/train-model/route.ts` - Train analytics model on historical data
  - `src/app/api/setup/training-data/route.ts` - Seed synthetic training data for model development
- **Enhanced Analytics**: Updated `src/lib/analytics/pick-generator.ts` with model training capabilities
- **UI Improvements**: 
  - Enhanced `src/components/Dashboard.tsx` with stats integration and better polling indicators
  - Updated `src/components/MarketCard.tsx` with improved price visualization and platform badges
  - Refined `src/components/TopPickCard.tsx` with better analytics display
- **Data Pipeline Updates**: 
  - Enhanced `src/lib/api/polyrouter-client.ts` with better error handling
  - Updated `src/lib/data/normalizer.ts` for improved data processing
  - Refined `src/types/index.ts` with additional type definitions
- **API Enhancements**: Updated cron routes and top picks API with better error handling and caching

### 2025-10-29 (Initial Documentation)
- Add For You pages: `src/app/for-you/page.tsx` and `src/app/for-you-simple/`
- Add Analytics page: `src/app/analytics/page.tsx`
- Enhance Dashboard and Top Pick UI: `src/components/Dashboard.tsx`, `src/components/TopPickCard.tsx`, `src/components/MobileNav.tsx`
- Create simple input UI component: `src/components/ui/input.tsx`
- Add polling hooks: `src/hooks/useTopPicks.ts`, `src/hooks/useTopPicksSimple.ts`
- Expand analytics module and tests: `src/lib/analytics/*` and `src/lib/analytics/__tests__/*`
- Update Top Picks generation and API routes: `src/app/api/cron/generate-top-picks/route.ts`, `src/app/api/top-picks/route.ts`, `src/app/api/top-picks/[id]/route.ts`
- Minor fixes and content for pick detail page: `src/app/picks/[id]/page.tsx`

Notes:
- Realtime strategy remains hybrid (polling now, websockets planned later) [[memory:10467141]].

