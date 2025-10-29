// Core types for PolyEdge application

// Platform types
export type Platform = 'polymarket' | 'kalshi' | 'manifold' | 'limitless' | 'prophetx' | 'novig' | 'sxbet';
export type MarketStatus = 'open' | 'closed' | 'resolved';
export type RecommendationType = 'buy' | 'sell' | 'watch';
export type LeagueType = 'nba' | 'nfl' | 'mlb';
export type PlayerStatus = 'active' | 'inactive' | 'injured';
export type GameStatus = 'scheduled' | 'live' | 'completed';
export type PriceInterval = '1m' | '5m' | '1h' | '4h' | '1d';
export type PickType = 'over' | 'under' | 'exact';

// Prediction Market Types
export interface Market {
  id: string;
  market_id: string;
  platform: Platform;
  title: string;
  description?: string;
  category?: string;
  status: MarketStatus;
  end_date?: Date;
  volume_24h: number;
  liquidity: number;
  created_at: Date;
  updated_at: Date;
}

export interface Outcome {
  id: string;
  market_id: string;
  outcome_label: string;
  current_price: number;
  previous_price?: number;
  price_change_24h: number;
  updated_at: Date;
}

export interface PriceHistory {
  id: string;
  market_id: string;
  outcome_label: string;
  price: number;
  timestamp: Date;
  interval: PriceInterval;
  volume: number;
}

export interface TopPick {
  id: string;
  market_id: string;
  recommendation: RecommendationType;
  confidence_score: number;
  reasoning?: string;
  value_score: number;
  created_at: Date;
  expires_at?: Date;
  // Joined data
  market?: Market;
}

// Sports Types
export interface Player {
  id: string;
  player_id: string;
  first_name: string;
  last_name: string;
  team?: string;
  position?: string;
  league: LeagueType;
  status: PlayerStatus;
  updated_at: Date;
}

export interface Game {
  id: string;
  game_id: string;
  league: LeagueType;
  home_team: string;
  away_team: string;
  game_date: Date;
  status: GameStatus;
  home_score?: number;
  away_score?: number;
  created_at: Date;
  updated_at: Date;
}

export interface StatLine {
  id: string;
  player_id: string;
  game_id: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  three_pointers?: number;
  minutes_played?: number;
  created_at: Date;
}

export interface Projection {
  id: string;
  player_id: string;
  game_id: string;
  projected_points: number;
  projected_rebounds: number;
  projected_assists: number;
  projected_three_pointers: number;
  confidence_score: number;
  model_version: string;
  created_at: Date;
  // Joined data
  player?: Player;
  game?: Game;
}

export interface InjuryNote {
  id: string;
  player_id: string;
  league: LeagueType;
  injury_status?: string;
  description?: string;
  source: string;
  fetched_at: Date;
  expires_at: Date;
}

export interface SportsTopPick {
  id: string;
  player_id: string;
  game_id: string;
  projection_id: string;
  pick_type: PickType;
  stat_category: string;
  projected_value: number;
  confidence_score: number;
  reasoning?: string;
  value_score: number;
  created_at: Date;
  expires_at: Date;
  // Joined data
  player?: Player;
  game?: Game;
  projection?: Projection;
}

// API Response Types
export interface PolyRouterMarket {
  id: string;
  platform: Platform;
  title: string;
  current_prices: Record<string, { price: number }>;
  volume_24h: number;
  status: string;
}

export interface PolyRouterResponse<T> {
  data: T[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Analytics Types
export interface MarketMetrics {
  implied_probability: number;
  probability_movement_1h: number;
  probability_movement_24h: number;
  volatility_index: number;
  divergence_score: number;
  arbitrage_opportunity: boolean;
  liquidity_score: number;
  volume_velocity: number;
  sharp_movement: boolean;
}

export interface SportsMetrics {
  pace_adjustment: number;
  opponent_defense_rating: number;
  home_away_factor: number;
  injury_impact: number;
  recent_form: number;
  matchup_advantage: number;
}

// UI Types
export interface FilterOptions {
  platforms?: Platform[];
  categories?: string[];
  status?: MarketStatus[];
  leagues?: LeagueType[];
  sortBy?: 'volume' | 'price_change' | 'liquidity' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Hook return types
export interface UseMarketsReturn {
  markets: Market[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
}

export interface UseMarketDetailReturn {
  market: Market | null;
  outcomes: Outcome[];
  priceHistory: PriceHistory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseTopPicksReturn {
  picks: TopPick[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseSportsTopPicksReturn {
  picks: SportsTopPick[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Configuration types
export interface AppConfig {
  features: {
    sportsEnabled: boolean;
    nbaEnabled: boolean;
    nflEnabled: boolean;
    mlbEnabled: boolean;
  };
  api: {
    polyrouterRateLimit: number;
    pollingInterval: number;
    cacheTimeout: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    defaultPageSize: number;
  };
}
