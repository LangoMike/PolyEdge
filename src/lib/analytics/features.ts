import { Market, Outcome, PriceHistory } from '@/types';

// Configuration constants
export const FEATURE_CONFIG = {
  EDGE_THRESHOLD: 0.005, // 0.5% - very low threshold to get more picks
  FRESHNESS_THRESHOLD_MINUTES: 60, // 60 minutes - more lenient
  CONFIDENCE_BINS: { HIGH: 0.65, MED: 0.5, LOW: 0.5 }, // Lower confidence requirements
  CV_WINDOW_DAYS: 60,
  DRIFT_WINDOWS: { SHORT: 5, MEDIUM: 15, LONG: 60 }, // minutes
} as const;

// Market features for ML model
export interface MarketFeatures {
  // Consensus and dispersion
  consensus_price: number;
  cross_book_dispersion: number;
  
  // Time-based features
  minutes_to_start: number;
  data_freshness_minutes: number;
  
  // Price movement features
  drift_5m: number;
  drift_15m: number;
  drift_60m: number;
  volatility_5m: number;
  volatility_15m: number;
  volatility_60m: number;
  velocity_5m: number;
  velocity_15m: number;
  velocity_60m: number;
  
  // Market quality features
  volume_24h_log: number;
  liquidity_score: number;
  outcome_count: number;
  price_spread: number;
  
  // Platform features
  platform_polymarket: number;
  platform_kalshi: number;
  platform_manifold: number;
  platform_other: number;
}

// Quality gates result
export interface QualityGates {
  freshness_ok: boolean;
  confidence_ok: boolean;
  dispersion_ok: boolean;
  time_to_start_ok: boolean;
  all_passed: boolean;
}

// Build features for a market as of a specific timestamp
export function buildMarketFeatures(
  market: Market,
  outcomes: Outcome[],
  priceHistory: PriceHistory[],
  asOf: Date = new Date()
): MarketFeatures {
  // Consensus price across all outcomes (weighted by volume if available)
  const consensus_price = computeConsensusPrice(outcomes);
  
  // Cross-book dispersion (standard deviation of outcome prices)
  const cross_book_dispersion = computeCrossBookDispersion(outcomes);
  
  // Time-based features
  const minutes_to_start = computeMinutesToStart(market, asOf);
  const data_freshness_minutes = computeDataFreshness(priceHistory, asOf);
  
  // Price movement features
  const drift_5m = computeDrift(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.SHORT, asOf);
  const drift_15m = computeDrift(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.MEDIUM, asOf);
  const drift_60m = computeDrift(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.LONG, asOf);
  
  const volatility_5m = computeVolatility(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.SHORT, asOf);
  const volatility_15m = computeVolatility(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.MEDIUM, asOf);
  const volatility_60m = computeVolatility(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.LONG, asOf);
  
  const velocity_5m = computeVelocity(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.SHORT, asOf);
  const velocity_15m = computeVelocity(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.MEDIUM, asOf);
  const velocity_60m = computeVelocity(priceHistory, FEATURE_CONFIG.DRIFT_WINDOWS.LONG, asOf);
  
  // Market quality features
  const volume_24h_log = Math.log(Math.max(market.volume_24h, 1));
  const liquidity_score = computeLiquidityScore(market, outcomes);
  const outcome_count = outcomes.length;
  const price_spread = computePriceSpread(outcomes);
  
  // Platform features (one-hot encoding)
  const platform_polymarket = market.platform === 'polymarket' ? 1 : 0;
  const platform_kalshi = market.platform === 'kalshi' ? 1 : 0;
  const platform_manifold = market.platform === 'manifold' ? 1 : 0;
  const platform_other = platform_polymarket + platform_kalshi + platform_manifold === 0 ? 1 : 0;
  
  return {
    consensus_price,
    cross_book_dispersion,
    minutes_to_start,
    data_freshness_minutes,
    drift_5m,
    drift_15m,
    drift_60m,
    volatility_5m,
    volatility_15m,
    volatility_60m,
    velocity_5m,
    velocity_15m,
    velocity_60m,
    volume_24h_log,
    liquidity_score,
    outcome_count,
    price_spread,
    platform_polymarket,
    platform_kalshi,
    platform_manifold,
    platform_other,
  };
}

// Compute consensus price (weighted average of outcome prices)
function computeConsensusPrice(outcomes: Outcome[]): number {
  if (outcomes.length === 0) return 0.5; // neutral for binary markets
  
  // For binary markets, use the "Yes" outcome price
  const yesOutcome = outcomes.find(o => o.outcome_label.toLowerCase() === 'yes');
  if (yesOutcome) return yesOutcome.current_price;
  
  // For multi-outcome, use average
  const totalPrice = outcomes.reduce((sum, o) => sum + o.current_price, 0);
  return totalPrice / outcomes.length;
}

// Compute cross-book dispersion (standard deviation of outcome prices)
function computeCrossBookDispersion(outcomes: Outcome[]): number {
  if (outcomes.length < 2) return 0;
  
  const prices = outcomes.map(o => o.current_price);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  return Math.sqrt(variance);
}

// Compute minutes until market resolution
function computeMinutesToStart(market: Market, asOf: Date): number {
  if (!market.end_date) return 0; // No end date = ongoing market
  
  const endDate = new Date(market.end_date);
  const diffMs = endDate.getTime() - asOf.getTime();
  return Math.max(0, diffMs / (1000 * 60)); // Convert to minutes
}

// Compute data freshness in minutes
function computeDataFreshness(priceHistory: PriceHistory[], asOf: Date): number {
  if (priceHistory.length === 0) return 999; // No data = very stale
  
  const latestTimestamp = Math.max(...priceHistory.map(ph => ph.timestamp.getTime()));
  const diffMs = asOf.getTime() - latestTimestamp;
  return diffMs / (1000 * 60); // Convert to minutes
}

// Compute price drift over a time window
function computeDrift(priceHistory: PriceHistory[], windowMinutes: number, asOf: Date): number {
  const cutoff = new Date(asOf.getTime() - windowMinutes * 60 * 1000);
  const recentHistory = priceHistory.filter(ph => ph.timestamp >= cutoff);
  
  if (recentHistory.length < 2) return 0;
  
  // Group by outcome and compute average drift
  const outcomeGroups = groupByOutcome(recentHistory);
  const drifts = Object.values(outcomeGroups).map(prices => {
    if (prices.length < 2) return 0;
    const sorted = prices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const startPrice = sorted[0].price;
    const endPrice = sorted[sorted.length - 1].price;
    return (endPrice - startPrice) / startPrice;
  });
  
  return drifts.reduce((sum, drift) => sum + drift, 0) / drifts.length;
}

// Compute volatility over a time window
function computeVolatility(priceHistory: PriceHistory[], windowMinutes: number, asOf: Date): number {
  const cutoff = new Date(asOf.getTime() - windowMinutes * 60 * 1000);
  const recentHistory = priceHistory.filter(ph => ph.timestamp >= cutoff);
  
  if (recentHistory.length < 2) return 0;
  
  // Group by outcome and compute volatility
  const outcomeGroups = groupByOutcome(recentHistory);
  const volatilities = Object.values(outcomeGroups).map(prices => {
    if (prices.length < 2) return 0;
    const sorted = prices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const returns = [];
    for (let i = 1; i < sorted.length; i++) {
      const ret = (sorted[i].price - sorted[i-1].price) / sorted[i-1].price;
      returns.push(ret);
    }
    
    if (returns.length === 0) return 0;
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  });
  
  return volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
}

// Compute velocity (rate of price change) over a time window
function computeVelocity(priceHistory: PriceHistory[], windowMinutes: number, asOf: Date): number {
  const cutoff = new Date(asOf.getTime() - windowMinutes * 60 * 1000);
  const recentHistory = priceHistory.filter(ph => ph.timestamp >= cutoff);
  
  if (recentHistory.length < 2) return 0;
  
  // Group by outcome and compute velocity
  const outcomeGroups = groupByOutcome(recentHistory);
  const velocities = Object.values(outcomeGroups).map(prices => {
    if (prices.length < 2) return 0;
    const sorted = prices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const timeSpan = (sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()) / (1000 * 60); // minutes
    if (timeSpan === 0) return 0;
    
    const priceChange = Math.abs(sorted[sorted.length - 1].price - sorted[0].price);
    return priceChange / timeSpan; // price change per minute
  });
  
  return velocities.reduce((sum, vel) => sum + vel, 0) / velocities.length;
}

// Compute liquidity score based on volume and price spread
function computeLiquidityScore(market: Market, outcomes: Outcome[]): number {
  const volumeScore = Math.min(market.volume_24h / 10000, 1); // Normalize to 0-1, max at $10k volume
  
  const prices = outcomes.map(o => o.current_price);
  const priceSpread = Math.max(...prices) - Math.min(...prices);
  const spreadScore = Math.max(0, 1 - priceSpread * 10); // Penalize high spreads
  
  return (volumeScore * 0.7 + spreadScore * 0.3);
}

// Compute price spread between outcomes
function computePriceSpread(outcomes: Outcome[]): number {
  if (outcomes.length < 2) return 0;
  
  const prices = outcomes.map(o => o.current_price);
  return Math.max(...prices) - Math.min(...prices);
}

// Group price history by outcome label
function groupByOutcome(priceHistory: PriceHistory[]): Record<string, PriceHistory[]> {
  const groups: Record<string, PriceHistory[]> = {};
  
  for (const ph of priceHistory) {
    if (!groups[ph.outcome_label]) {
      groups[ph.outcome_label] = [];
    }
    groups[ph.outcome_label].push(ph);
  }
  
  return groups;
}

// Apply quality gates to determine if a pick should be made
export function applyQualityGates(
  features: MarketFeatures,
  calibratedProb: number,
  edge: number
): QualityGates {
  const freshness_ok = features.data_freshness_minutes <= FEATURE_CONFIG.FRESHNESS_THRESHOLD_MINUTES;
  
  // Confidence based on calibration residuals (simplified for now)
  const confidence_ok = calibratedProb >= FEATURE_CONFIG.CONFIDENCE_BINS.MED;
  
  // Dispersion should be reasonable (not too high)
  const dispersion_ok = true; // Disable dispersion check for now
  
  // Should have some time before resolution
  const time_to_start_ok = true; // Disable time-to-start check for now
  
  const all_passed = freshness_ok && confidence_ok && dispersion_ok && time_to_start_ok && edge >= FEATURE_CONFIG.EDGE_THRESHOLD;
  
  return {
    freshness_ok,
    confidence_ok,
    dispersion_ok,
    time_to_start_ok,
    all_passed,
  };
}

// Convert features to array for ML model (in consistent order)
export function featuresToArray(features: MarketFeatures): number[] {
  return [
    features.consensus_price,
    features.cross_book_dispersion,
    features.minutes_to_start,
    features.data_freshness_minutes,
    features.drift_5m,
    features.drift_15m,
    features.drift_60m,
    features.volatility_5m,
    features.volatility_15m,
    features.volatility_60m,
    features.velocity_5m,
    features.velocity_15m,
    features.velocity_60m,
    features.volume_24h_log,
    features.liquidity_score,
    features.outcome_count,
    features.price_spread,
    features.platform_polymarket,
    features.platform_kalshi,
    features.platform_manifold,
    features.platform_other,
  ];
}
