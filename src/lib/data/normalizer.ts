import { 
  Market, 
  Outcome, 
  PriceHistory, 
  Platform, 
  MarketStatus,
  PolyRouterMarket,
  PolyRouterResponse 
} from '@/types';

// Platform-specific category mapping
const PLATFORM_CATEGORIES: Record<Platform, Record<string, string>> = {
  polymarket: {
    'politics': 'politics',
    'economics': 'economics',
    'culture': 'culture',
    'sports': 'sports',
    'crypto': 'crypto',
    'weather': 'weather',
  },
  kalshi: {
    'politics': 'politics',
    'economics': 'economics',
    'sports': 'sports',
    'weather': 'weather',
  },
  manifold: {
    'politics': 'politics',
    'economics': 'economics',
    'culture': 'culture',
    'sports': 'sports',
    'crypto': 'crypto',
  },
  limitless: {
    'politics': 'politics',
    'economics': 'economics',
    'culture': 'culture',
    'sports': 'sports',
  },
  prophetx: {
    'sports': 'sports',
  },
  novig: {
    'sports': 'sports',
  },
  sxbet: {
    'politics': 'politics',
    'economics': 'economics',
    'culture': 'culture',
    'sports': 'sports',
  },
};

// Normalize platform status to internal status
function normalizeStatus(platformStatus: string): MarketStatus {
  const statusMap: Record<string, MarketStatus> = {
    'open': 'open',
    'active': 'open',
    'trading': 'open',
    'closed': 'closed',
    'inactive': 'closed',
    'resolved': 'resolved',
    'settled': 'resolved',
  };
  
  return statusMap[platformStatus.toLowerCase()] || 'open';
}

// Extract category from title or description
function extractCategory(title: string, platform: Platform, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Platform-specific category extraction
  if (platform === 'polymarket' || platform === 'manifold' || platform === 'kalshi') {
    if (text.includes('election') || text.includes('president') || text.includes('trump') || text.includes('biden')) {
      return 'politics';
    }
    if (text.includes('recession') || text.includes('inflation') || text.includes('fed') || text.includes('economy')) {
      return 'economics';
    }
    if (text.includes('nba') || text.includes('nfl') || text.includes('mlb') || text.includes('soccer') || text.includes('football')) {
      return 'sports';
    }
    if (text.includes('bitcoin') || text.includes('crypto') || text.includes('ethereum')) {
      return 'crypto';
    }
    if (text.includes('weather') || text.includes('temperature') || text.includes('rain')) {
      return 'weather';
    }
    return 'culture';
  }
  
  if (platform === 'prophetx' || platform === 'novig') {
    return 'sports';
  }
  
  return 'culture';
}

// Normalize price to 0-1 range
function normalizePrice(price: number, platform: Platform): number {
  // Most platforms already use 0-1 range, but some might use 0-100 or other ranges
  if (price > 1) {
    return price / 100; // Convert percentage to decimal
  }
  return Math.max(0, Math.min(1, price)); // Clamp to 0-1 range
}

// Calculate liquidity score based on volume and price spread
function calculateLiquidityScore(polyMarket: PolyRouterMarket): number {
  const volume = polyMarket.volume_24h || 0;
  
  // Calculate price spread from current prices
  const prices = Object.values(polyMarket.current_prices || {}).map((p: any) => p.price || 0);
  const priceSpread = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0;
  
  // Volume score (0-1, max at $100k volume)
  const volumeScore = Math.min(volume / 100000, 1);
  
  // Spread score (0-1, penalize high spreads)
  const spreadScore = Math.max(0, 1 - priceSpread * 10);
  
  // Weighted combination (70% volume, 30% spread)
  return Math.max(0, Math.min(1, volumeScore * 0.7 + spreadScore * 0.3));
}

// Normalize PolyRouter market to internal Market format
export function normalizeMarket(polyMarket: PolyRouterMarket): Market {
  const platform = polyMarket.platform as Platform;
  
  return {
    id: '', // Will be set by database
    market_id: polyMarket.id,
    platform,
    title: polyMarket.title,
    description: '', // PolyRouter doesn't provide description in basic response
    category: extractCategory(polyMarket.title, platform, undefined),
    status: normalizeStatus(polyMarket.status),
    end_date: undefined, // Would need to fetch from market details
    volume_24h: polyMarket.volume_24h || 0,
    liquidity: calculateLiquidityScore(polyMarket),
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// Normalize PolyRouter market to internal Outcome format
export function normalizeOutcomes(polyMarket: any, marketId: string): Outcome[] {
  const outcomes: Outcome[] = [];
  
  // Check if current_prices exists
  if (!polyMarket.current_prices) {
    console.warn(`[normalizeOutcomes] No current_prices found for market ${marketId}`);
    return outcomes;
  }
  
  Object.entries(polyMarket.current_prices).forEach(([label, priceData]: [string, any]) => {
    if (!priceData || typeof priceData !== 'object') {
      console.warn(`[normalizeOutcomes] Invalid price data for label ${label}:`, priceData);
      return;
    }
    
    outcomes.push({
      id: '', // Will be set by database
      market_id: marketId,
      outcome_label: label,
      current_price: normalizePrice(priceData.price || 0, polyMarket.platform as Platform),
      previous_price: undefined, // Would need historical data
      price_change_24h: 0, // Would need to calculate
      updated_at: new Date(),
    });
  });
  
  return outcomes;
}

// Normalize price history data
export function normalizePriceHistory(
  historyData: any[],
  marketId: string,
  outcomeLabel: string,
  interval: '1m' | '5m' | '1h' | '4h' | '1d'
): PriceHistory[] {
  return historyData.map((item, index) => ({
    id: '', // Will be set by database
    market_id: marketId,
    outcome_label: outcomeLabel,
    price: normalizePrice(item.price || item.close || 0, 'polymarket'), // Default to polymarket normalization
    timestamp: new Date(item.timestamp || item.time || Date.now()),
    interval,
    volume: item.volume || 0,
  }));
}

// Batch normalize multiple markets
export function normalizeMarkets(polyResponse: PolyRouterResponse<PolyRouterMarket>): {
  markets: Market[];
  outcomes: Outcome[];
} {
  const markets: Market[] = [];
  const outcomes: Outcome[] = [];
  
  polyResponse.data.forEach((polyMarket) => {
    const normalizedMarket = normalizeMarket(polyMarket);
    markets.push(normalizedMarket);
    
    // Note: We can't create outcomes here since we don't have the database ID yet
    // This will be handled in the sync process
  });
  
  return { markets, outcomes };
}

// Validate market data before normalization
export function validateMarketData(polyMarket: PolyRouterMarket): boolean {
  if (!polyMarket.id || !polyMarket.title || !polyMarket.platform) {
    return false;
  }
  
  if (!polyMarket.current_prices || Object.keys(polyMarket.current_prices).length === 0) {
    return false;
  }
  
  // Validate prices are numbers between 0 and 1
  for (const [label, priceData] of Object.entries(polyMarket.current_prices)) {
    if (typeof priceData.price !== 'number' || priceData.price < 0 || priceData.price > 1) {
      return false;
    }
  }
  
  return true;
}

// Calculate derived metrics
export function calculateMarketMetrics(market: Market, outcomes: Outcome[]): {
  totalVolume: number;
  averagePrice: number;
  priceSpread: number;
  liquidityScore: number;
} {
  const totalVolume = market.volume_24h;
  const prices = outcomes.map(o => o.current_price);
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  // Calculate price spread (difference between highest and lowest prices)
  const priceSpread = Math.max(...prices) - Math.min(...prices);
  
  // Calculate liquidity score using the same logic as normalizeMarket
  const volumeScore = Math.min(totalVolume / 10000, 1);
  const spreadScore = Math.max(0, 1 - priceSpread * 10);
  const liquidityScore = Math.max(0, Math.min(1, volumeScore * 0.7 + spreadScore * 0.3));
  
  return {
    totalVolume,
    averagePrice,
    priceSpread,
    liquidityScore,
  };
}

// Platform-specific data transformations
export function transformPlatformData(data: any, platform: Platform): any {
  switch (platform) {
    case 'polymarket':
      // Polymarket data is already well-structured
      return data;
      
    case 'kalshi':
      // Kalshi might have different field names
      return {
        ...data,
        current_prices: data.outcomes || data.current_prices,
      };
      
    case 'manifold':
      // Manifold might use different structure
      return {
        ...data,
        current_prices: data.options || data.current_prices,
      };
      
    default:
      return data;
  }
}
