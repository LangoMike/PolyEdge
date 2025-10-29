import { Market, Outcome, PriceHistory, MarketMetrics, SportsMetrics } from '@/types';

// Calculate market metrics for prediction markets
export function calculateMarketMetrics(
  market: Market,
  outcomes: Outcome[],
  priceHistory: PriceHistory[] = []
): MarketMetrics {
  // Implied probability (average of all outcome prices)
  const impliedProbability = outcomes.length > 0 
    ? outcomes.reduce((sum, outcome) => sum + outcome.current_price, 0) / outcomes.length 
    : 0;

  // Calculate price movements
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentHistory = priceHistory.filter(ph => 
    ph.timestamp >= oneHourAgo && ph.timestamp <= now
  );
  const dailyHistory = priceHistory.filter(ph => 
    ph.timestamp >= oneDayAgo && ph.timestamp <= now
  );

  // Calculate probability movements
  const probabilityMovement1h = calculatePriceMovement(outcomes, recentHistory, 1);
  const probabilityMovement24h = calculatePriceMovement(outcomes, dailyHistory, 24);

  // Calculate volatility (standard deviation of price changes)
  const volatilityIndex = calculateVolatility(priceHistory);

  // Calculate divergence score (placeholder - would need cross-platform comparison)
  const divergenceScore = 0; // TODO: Implement cross-platform comparison

  // Check for arbitrage opportunities
  const arbitrageOpportunity = checkArbitrageOpportunity(outcomes);

  // Calculate liquidity score
  const liquidityScore = calculateLiquidityScore(market, outcomes);

  // Calculate volume velocity (rate of volume change)
  const volumeVelocity = calculateVolumeVelocity(priceHistory);

  // Check for sharp movements (>10% in 1 hour)
  const sharpMovement = Math.abs(probabilityMovement1h) > 0.1;

  return {
    implied_probability: impliedProbability,
    probability_movement_1h: probabilityMovement1h,
    probability_movement_24h: probabilityMovement24h,
    volatility_index: volatilityIndex,
    divergence_score: divergenceScore,
    arbitrage_opportunity: arbitrageOpportunity,
    liquidity_score: liquidityScore,
    volume_velocity: volumeVelocity,
    sharp_movement: sharpMovement,
  };
}

// Calculate price movement over a time period
function calculatePriceMovement(
  outcomes: Outcome[],
  history: PriceHistory[],
  hours: number
): number {
  if (history.length === 0 || outcomes.length === 0) return 0;

  // Get the earliest and latest prices for each outcome
  const outcomeMovements = outcomes.map(outcome => {
    const outcomeHistory = history
      .filter(ph => ph.outcome_label === outcome.outcome_label)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (outcomeHistory.length < 2) return 0;

    const earliestPrice = outcomeHistory[0].price;
    const latestPrice = outcomeHistory[outcomeHistory.length - 1].price;
    
    return (latestPrice - earliestPrice) / earliestPrice;
  });

  // Return average movement across all outcomes
  return outcomeMovements.reduce((sum, movement) => sum + movement, 0) / outcomeMovements.length;
}

// Calculate volatility (standard deviation of price changes)
function calculateVolatility(priceHistory: PriceHistory[]): number {
  if (priceHistory.length < 2) return 0;

  // Calculate price changes
  const priceChanges: number[] = [];
  const sortedHistory = priceHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (let i = 1; i < sortedHistory.length; i++) {
    const change = (sortedHistory[i].price - sortedHistory[i - 1].price) / sortedHistory[i - 1].price;
    priceChanges.push(change);
  }

  if (priceChanges.length === 0) return 0;

  // Calculate mean
  const mean = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;

  // Calculate variance
  const variance = priceChanges.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / priceChanges.length;

  // Return standard deviation
  return Math.sqrt(variance);
}

// Check for arbitrage opportunities
function checkArbitrageOpportunity(outcomes: Outcome[]): boolean {
  if (outcomes.length < 2) return false;

  // Simple arbitrage check: sum of all outcome prices should be close to 1
  const totalProbability = outcomes.reduce((sum, outcome) => sum + outcome.current_price, 0);
  const arbitrageThreshold = 0.05; // 5% deviation from 1.0

  return Math.abs(totalProbability - 1.0) > arbitrageThreshold;
}

// Calculate liquidity score based on volume and price spread
function calculateLiquidityScore(market: Market, outcomes: Outcome[]): number {
  const volumeScore = Math.min(market.volume_24h / 10000, 1); // Normalize to 0-1, max at $10k volume
  
  // Calculate price spread (difference between highest and lowest prices)
  const prices = outcomes.map(o => o.current_price);
  const priceSpread = Math.max(...prices) - Math.min(...prices);
  const spreadScore = Math.max(0, 1 - priceSpread * 10); // Penalize high spreads

  // Weighted combination
  return (volumeScore * 0.7 + spreadScore * 0.3);
}

// Calculate volume velocity (rate of volume change)
function calculateVolumeVelocity(priceHistory: PriceHistory[]): number {
  if (priceHistory.length < 2) return 0;

  // Group by time periods and calculate volume changes
  const sortedHistory = priceHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Calculate volume changes between consecutive periods
  const volumeChanges: number[] = [];
  for (let i = 1; i < sortedHistory.length; i++) {
    const prevVolume = sortedHistory[i - 1].volume;
    const currVolume = sortedHistory[i].volume;
    
    if (prevVolume > 0) {
      const change = (currVolume - prevVolume) / prevVolume;
      volumeChanges.push(change);
    }
  }

  if (volumeChanges.length === 0) return 0;

  // Return average volume change
  return volumeChanges.reduce((sum, change) => sum + change, 0) / volumeChanges.length;
}

// Sports-specific metrics calculation
export function calculateSportsMetrics(
  playerId: string,
  gameId: string,
  recentStats: any[],
  opponentStats: any[],
  injuryData: any
): SportsMetrics {
  // Calculate pace adjustment (team pace vs league average)
  const paceAdjustment = calculatePaceAdjustment(recentStats);

  // Calculate opponent defense rating
  const opponentDefenseRating = calculateOpponentDefenseRating(opponentStats);

  // Calculate home/away factor
  const homeAwayFactor = calculateHomeAwayFactor(gameId);

  // Calculate injury impact
  const injuryImpact = calculateInjuryImpact(injuryData);

  // Calculate recent form (last 5 games performance)
  const recentForm = calculateRecentForm(recentStats);

  // Calculate matchup advantage
  const matchupAdvantage = calculateMatchupAdvantage(recentStats, opponentStats);

  return {
    pace_adjustment: paceAdjustment,
    opponent_defense_rating: opponentDefenseRating,
    home_away_factor: homeAwayFactor,
    injury_impact: injuryImpact,
    recent_form: recentForm,
    matchup_advantage: matchupAdvantage,
  };
}

// Calculate pace adjustment factor
function calculatePaceAdjustment(recentStats: any[]): number {
  if (recentStats.length === 0) return 1.0;

  // Calculate average pace from recent games
  const avgPace = recentStats.reduce((sum, game) => sum + (game.pace || 100), 0) / recentStats.length;
  const leagueAvgPace = 100; // NBA average pace

  return avgPace / leagueAvgPace;
}

// Calculate opponent defense rating
function calculateOpponentDefenseRating(opponentStats: any[]): number {
  if (opponentStats.length === 0) return 1.0;

  // Calculate opponent's defensive efficiency
  const avgDefRating = opponentStats.reduce((sum, game) => sum + (game.defensive_rating || 110), 0) / opponentStats.length;
  const leagueAvgDefRating = 110; // NBA average defensive rating

  return avgDefRating / leagueAvgDefRating;
}

// Calculate home/away factor
function calculateHomeAwayFactor(gameId: string): number {
  // Simple implementation - would need actual game data
  // Home teams typically have 3-5% advantage
  return gameId.includes('home') ? 1.05 : 0.95;
}

// Calculate injury impact
function calculateInjuryImpact(injuryData: any): number {
  if (!injuryData || !injuryData.injury_status) return 1.0;

  const status = injuryData.injury_status.toLowerCase();
  
  switch (status) {
    case 'out':
      return 0.0;
    case 'doubtful':
      return 0.3;
    case 'questionable':
      return 0.7;
    case 'probable':
      return 0.9;
    default:
      return 1.0;
  }
}

// Calculate recent form (last 5 games)
function calculateRecentForm(recentStats: any[]): number {
  if (recentStats.length === 0) return 1.0;

  // Calculate average performance vs season average
  const recentAvg = recentStats.reduce((sum, game) => sum + (game.points || 0), 0) / recentStats.length;
  const seasonAvg = 15; // Placeholder - would need actual season average

  return recentAvg / seasonAvg;
}

// Calculate matchup advantage
function calculateMatchupAdvantage(playerStats: any[], opponentStats: any[]): number {
  if (playerStats.length === 0 || opponentStats.length === 0) return 1.0;

  // Simple matchup calculation - would need more sophisticated analysis
  const playerAvg = playerStats.reduce((sum, game) => sum + (game.points || 0), 0) / playerStats.length;
  const opponentDefAvg = opponentStats.reduce((sum, game) => sum + (game.points_allowed || 110), 0) / opponentStats.length;

  return playerAvg / opponentDefAvg;
}

// Calculate value score for top picks
export function calculateValueScore(
  marketMetrics: MarketMetrics,
  sportsMetrics?: SportsMetrics
): number {
  let score = 0;

  // Base score from market metrics
  score += marketMetrics.divergence_score * 0.3;
  score += (marketMetrics.arbitrage_opportunity ? 1 : 0) * 0.2;
  score += marketMetrics.liquidity_score * 0.2;
  score += (marketMetrics.sharp_movement ? 1 : 0) * 0.1;
  score += Math.abs(marketMetrics.probability_movement_24h) * 0.2;

  // Add sports-specific metrics if available
  if (sportsMetrics) {
    score += sportsMetrics.recent_form * 0.1;
    score += sportsMetrics.matchup_advantage * 0.1;
    score += (1 - sportsMetrics.injury_impact) * 0.1;
  }

  // Normalize to 0-100
  return Math.min(Math.max(score * 100, 0), 100);
}

// Calculate confidence score for predictions
export function calculateConfidenceScore(
  marketMetrics: MarketMetrics,
  historicalAccuracy?: number
): number {
  let confidence = 50; // Base confidence

  // Adjust based on liquidity
  confidence += marketMetrics.liquidity_score * 20;

  // Adjust based on volatility (lower volatility = higher confidence)
  confidence -= marketMetrics.volatility_index * 30;

  // Adjust based on historical accuracy if available
  if (historicalAccuracy) {
    confidence += historicalAccuracy * 20;
  }

  // Penalize for arbitrage opportunities (indicates uncertainty)
  if (marketMetrics.arbitrage_opportunity) {
    confidence -= 10;
  }

  // Normalize to 0-100
  return Math.min(Math.max(confidence, 0), 100);
}
