import { buildMarketFeatures, applyQualityGates, FEATURE_CONFIG } from '../features';
import { Market, Outcome, PriceHistory } from '@/types';

// Mock data for testing
const mockMarket: Market = {
  id: 'test-market-1',
  market_id: 'test-market-1',
  platform: 'polymarket',
  title: 'Will Bitcoin reach $100k by end of 2024?',
  description: 'Bitcoin price prediction',
  category: 'crypto',
  status: 'open',
  volume_24h: 1000000,
  liquidity: 500000,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
};

const mockOutcomes: Outcome[] = [
  {
    id: 'outcome-1',
    market_id: 'test-market-1',
    outcome_label: 'Yes',
    current_price: 0.65,
    volume_24h: 600000,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
  {
    id: 'outcome-2',
    market_id: 'test-market-1',
    outcome_label: 'No',
    current_price: 0.35,
    volume_24h: 400000,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
];

const mockPriceHistory: PriceHistory[] = [
  {
    id: 'ph-1',
    market_id: 'test-market-1',
    outcome_label: 'Yes',
    price: 0.60,
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: 'ph-2',
    market_id: 'test-market-1',
    outcome_label: 'Yes',
    price: 0.65,
    timestamp: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
  },
  {
    id: 'ph-3',
    market_id: 'test-market-1',
    outcome_label: 'No',
    price: 0.40,
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: 'ph-4',
    market_id: 'test-market-1',
    outcome_label: 'No',
    price: 0.35,
    timestamp: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
  },
];

describe('Feature Building', () => {
  test('builds features correctly for binary market', () => {
    const features = buildMarketFeatures(mockMarket, mockOutcomes, mockPriceHistory);
    
    // Test consensus price (should be Yes outcome price)
    expect(features.consensus_price).toBe(0.65);
    
    // Test cross-book dispersion
    expect(features.cross_book_dispersion).toBeCloseTo(0.15, 2); // std dev of [0.65, 0.35]
    
    // Test platform features
    expect(features.platform_polymarket).toBe(1);
    expect(features.platform_kalshi).toBe(0);
    expect(features.platform_manifold).toBe(0);
    expect(features.platform_other).toBe(0);
    
    // Test market quality features
    expect(features.outcome_count).toBe(2);
    expect(features.volume_24h_log).toBeCloseTo(Math.log(1000000), 2);
  });

  test('handles empty price history gracefully', () => {
    const features = buildMarketFeatures(mockMarket, mockOutcomes, []);
    
    // Should still compute basic features
    expect(features.consensus_price).toBe(0.65);
    expect(features.outcome_count).toBe(2);
    
    // Drift and volatility should be 0 with no history
    expect(features.drift_5m).toBe(0);
    expect(features.volatility_5m).toBe(0);
  });

  test('computes data freshness correctly', () => {
    const oldPriceHistory = mockPriceHistory.map(ph => ({
      ...ph,
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    }));
    
    const features = buildMarketFeatures(mockMarket, mockOutcomes, oldPriceHistory);
    
    // Freshness should be around 10 minutes
    expect(features.data_freshness_minutes).toBeCloseTo(10, 1);
  });

  test('computes drift correctly', () => {
    const features = buildMarketFeatures(mockMarket, mockOutcomes, mockPriceHistory);
    
    // Yes outcome: 0.60 -> 0.65 = +8.33% drift
    // No outcome: 0.40 -> 0.35 = -12.5% drift
    // Average drift should be around -2%
    expect(features.drift_5m).toBeCloseTo(-0.02, 2);
  });
});

describe('Quality Gates', () => {
  test('passes all gates for good data', () => {
    const features = buildMarketFeatures(mockMarket, mockOutcomes, mockPriceHistory);
    const gates = applyQualityGates(features, 0.7, 0.05); // 70% prob, 5% edge
    
    expect(gates.freshness_ok).toBe(true);
    expect(gates.confidence_ok).toBe(true);
    expect(gates.dispersion_ok).toBe(true);
    expect(gates.time_to_start_ok).toBe(true);
    expect(gates.all_passed).toBe(true);
  });

  test('fails freshness gate for stale data', () => {
    const stalePriceHistory = mockPriceHistory.map(ph => ({
      ...ph,
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    }));
    
    const features = buildMarketFeatures(mockMarket, mockOutcomes, stalePriceHistory);
    const gates = applyQualityGates(features, 0.7, 0.05);
    
    expect(gates.freshness_ok).toBe(false);
    expect(gates.all_passed).toBe(false);
  });

  test('fails confidence gate for low probability', () => {
    const features = buildMarketFeatures(mockMarket, mockOutcomes, mockPriceHistory);
    const gates = applyQualityGates(features, 0.5, 0.05); // 50% prob
    
    expect(gates.confidence_ok).toBe(false);
    expect(gates.all_passed).toBe(false);
  });

  test('fails dispersion gate for high dispersion', () => {
    const highDispersionOutcomes: Outcome[] = [
      { ...mockOutcomes[0], current_price: 0.9 },
      { ...mockOutcomes[1], current_price: 0.1 },
    ];
    
    const features = buildMarketFeatures(mockMarket, highDispersionOutcomes, mockPriceHistory);
    const gates = applyQualityGates(features, 0.7, 0.05);
    
    expect(gates.dispersion_ok).toBe(false);
    expect(gates.all_passed).toBe(false);
  });

  test('fails edge gate for insufficient edge', () => {
    const features = buildMarketFeatures(mockMarket, mockOutcomes, mockPriceHistory);
    const gates = applyQualityGates(features, 0.7, 0.01); // Only 1% edge
    
    expect(gates.all_passed).toBe(false);
  });
});

describe('Configuration Constants', () => {
  test('has correct configuration values', () => {
    expect(FEATURE_CONFIG.EDGE_THRESHOLD).toBe(0.03); // 3%
    expect(FEATURE_CONFIG.FRESHNESS_THRESHOLD_MINUTES).toBe(2);
    expect(FEATURE_CONFIG.CONFIDENCE_BINS.HIGH).toBe(0.7);
    expect(FEATURE_CONFIG.CONFIDENCE_BINS.MED).toBe(0.55);
    expect(FEATURE_CONFIG.CV_WINDOW_DAYS).toBe(60);
  });
});

