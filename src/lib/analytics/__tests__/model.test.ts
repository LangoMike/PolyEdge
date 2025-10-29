import { LogisticRegression, CalibratedModel, ModelFactory, getMarketType, crossValidate } from '../model';
import { MarketFeatures } from '../features';

// Mock features for testing
const mockFeatures: MarketFeatures = {
  consensus_price: 0.6,
  cross_book_dispersion: 0.05,
  minutes_to_start: 1440, // 24 hours
  data_freshness_minutes: 1,
  drift_5m: 0.02,
  drift_15m: 0.03,
  drift_60m: 0.05,
  volatility_5m: 0.01,
  volatility_15m: 0.02,
  volatility_60m: 0.03,
  velocity_5m: 0.001,
  velocity_15m: 0.002,
  velocity_60m: 0.003,
  volume_24h_log: 8.0,
  liquidity_score: 0.8,
  outcome_count: 2,
  price_spread: 0.1,
  platform_polymarket: 1,
  platform_kalshi: 0,
  platform_manifold: 0,
  platform_other: 0,
};

const mockFeaturesArray: MarketFeatures[] = [
  { ...mockFeatures, consensus_price: 0.3, drift_5m: -0.02 },
  { ...mockFeatures, consensus_price: 0.7, drift_5m: 0.02 },
  { ...mockFeatures, consensus_price: 0.4, drift_5m: -0.01 },
  { ...mockFeatures, consensus_price: 0.8, drift_5m: 0.03 },
  { ...mockFeatures, consensus_price: 0.2, drift_5m: -0.03 },
];

const mockLabels = [0, 1, 0, 1, 0]; // Binary labels

describe('Logistic Regression', () => {
  test('fits model correctly', () => {
    const model = new LogisticRegression();
    
    expect(() => model.fit(mockFeaturesArray, mockLabels)).not.toThrow();
  });

  test('predicts probabilities correctly', () => {
    const model = new LogisticRegression();
    model.fit(mockFeaturesArray, mockLabels);
    
    const prediction = model.predict(mockFeatures);
    expect(prediction).toBeGreaterThanOrEqual(0);
    expect(prediction).toBeLessThanOrEqual(1);
  });

  test('throws error when not fitted', () => {
    const model = new LogisticRegression();
    
    expect(() => model.predict(mockFeatures)).toThrow('Logistic regression not fitted');
  });

  test('handles feature dimension mismatch', () => {
    const model = new LogisticRegression();
    model.fit(mockFeaturesArray, mockLabels);
    
    const wrongFeatures = { ...mockFeatures, extra_feature: 1 };
    expect(() => model.predict(wrongFeatures as any)).toThrow('Feature dimension mismatch');
  });
});

describe('Calibrated Model', () => {
  test('fits and predicts correctly', () => {
    const model = new CalibratedModel();
    
    expect(() => model.fit(mockFeaturesArray, mockLabels)).not.toThrow();
    
    const prediction = model.predict(mockFeatures);
    expect(prediction.raw_prob).toBeGreaterThanOrEqual(0);
    expect(prediction.raw_prob).toBeLessThanOrEqual(1);
    expect(prediction.calibrated_prob).toBeGreaterThanOrEqual(0);
    expect(prediction.calibrated_prob).toBeLessThanOrEqual(1);
    expect(['HIGH', 'MED', 'LOW']).toContain(prediction.confidence_bin);
    expect(['platt', 'isotonic', 'none']).toContain(prediction.calibration_method);
  });

  test('computes performance metrics', () => {
    const model = new CalibratedModel();
    model.fit(mockFeaturesArray, mockLabels);
    
    const metrics = model.getPerformanceMetrics(mockFeaturesArray, mockLabels);
    expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(metrics.accuracy).toBeLessThanOrEqual(1);
    expect(metrics.brierScore).toBeGreaterThanOrEqual(0);
    expect(metrics.logLoss).toBeGreaterThanOrEqual(0);
  });

  test('throws error when not fitted', () => {
    const model = new CalibratedModel();
    
    expect(() => model.predict(mockFeatures)).toThrow('Model not fitted');
    expect(() => model.getPerformanceMetrics(mockFeaturesArray, mockLabels)).toThrow('Model not fitted');
  });
});

describe('Model Factory', () => {
  test('creates and manages models by type', () => {
    const binaryModel = ModelFactory.getModel('binary');
    const multiOutcomeModel = ModelFactory.getModel('multi_outcome');
    
    expect(binaryModel).toBeDefined();
    expect(multiOutcomeModel).toBeDefined();
    expect(binaryModel).not.toBe(multiOutcomeModel);
  });

  test('trains models correctly', () => {
    expect(() => ModelFactory.trainModel('binary', mockFeaturesArray, mockLabels)).not.toThrow();
    expect(() => ModelFactory.trainModel('multi_outcome', mockFeaturesArray, mockLabels)).not.toThrow();
  });

  test('gets trained models', () => {
    ModelFactory.trainModel('binary', mockFeaturesArray, mockLabels);
    
    const trainedModels = ModelFactory.getTrainedModels();
    expect(trainedModels.has('binary')).toBe(true);
  });
});

describe('Market Type Detection', () => {
  test('detects binary market', () => {
    const binaryFeatures = { ...mockFeatures, outcome_count: 2 };
    expect(getMarketType(binaryFeatures)).toBe('binary');
  });

  test('detects multi-outcome market', () => {
    const multiFeatures = { ...mockFeatures, outcome_count: 3 };
    expect(getMarketType(multiFeatures)).toBe('multi_outcome');
  });

  test('detects unknown market', () => {
    const unknownFeatures = { ...mockFeatures, outcome_count: 1 };
    expect(getMarketType(unknownFeatures)).toBe('unknown');
  });
});

describe('Cross Validation', () => {
  test('performs cross validation correctly', () => {
    const cvResults = crossValidate(mockFeaturesArray, mockLabels, 3);
    
    expect(cvResults.meanAccuracy).toBeGreaterThanOrEqual(0);
    expect(cvResults.meanAccuracy).toBeLessThanOrEqual(1);
    expect(cvResults.meanBrierScore).toBeGreaterThanOrEqual(0);
    expect(cvResults.meanLogLoss).toBeGreaterThanOrEqual(0);
    expect(cvResults.stdAccuracy).toBeGreaterThanOrEqual(0);
    expect(cvResults.stdBrierScore).toBeGreaterThanOrEqual(0);
    expect(cvResults.stdLogLoss).toBeGreaterThanOrEqual(0);
  });

  test('handles insufficient data gracefully', () => {
    const smallFeatures = mockFeaturesArray.slice(0, 2);
    const smallLabels = mockLabels.slice(0, 2);
    
    expect(() => crossValidate(smallFeatures, smallLabels, 2)).not.toThrow();
  });

  test('throws error for invalid input', () => {
    expect(() => crossValidate([], [])).toThrow('Invalid input for cross-validation');
    expect(() => crossValidate(mockFeaturesArray, [])).toThrow('Invalid input for cross-validation');
  });
});

