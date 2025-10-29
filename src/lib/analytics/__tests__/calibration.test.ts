import { PlattScaling, IsotonicRegression, CalibrationWrapper, computeEdge, shouldMakePick } from '../calibration';

describe('Platt Scaling', () => {
  test('fits and transforms probabilities correctly', () => {
    const platt = new PlattScaling();
    
    // Test data: raw probabilities and true labels
    const rawProbs = [0.2, 0.4, 0.6, 0.8];
    const trueLabels = [0, 0, 1, 1];
    
    platt.fit(rawProbs, trueLabels);
    
    // Test transformation
    const calibrated = platt.transform(0.5);
    expect(calibrated).toBeGreaterThanOrEqual(0);
    expect(calibrated).toBeLessThanOrEqual(1);
    
    // Test edge cases
    const calibratedLow = platt.transform(0.1);
    const calibratedHigh = platt.transform(0.9);
    expect(calibratedLow).toBeGreaterThanOrEqual(0);
    expect(calibratedHigh).toBeLessThanOrEqual(1);
  });

  test('handles edge cases gracefully', () => {
    const platt = new PlattScaling();
    
    // Test with identical probabilities
    const rawProbs = [0.5, 0.5, 0.5, 0.5];
    const trueLabels = [0, 1, 0, 1];
    
    expect(() => platt.fit(rawProbs, trueLabels)).not.toThrow();
    
    const calibrated = platt.transform(0.5);
    expect(calibrated).toBeGreaterThanOrEqual(0);
    expect(calibrated).toBeLessThanOrEqual(1);
  });

  test('throws error when not fitted', () => {
    const platt = new PlattScaling();
    
    expect(() => platt.transform(0.5)).toThrow('Platt scaling not fitted');
  });
});

describe('Isotonic Regression', () => {
  test('fits and transforms probabilities correctly', () => {
    const isotonic = new IsotonicRegression();
    
    // Test data: raw probabilities and true labels
    const rawProbs = [0.1, 0.3, 0.5, 0.7, 0.9];
    const trueLabels = [0, 0, 1, 1, 1];
    
    isotonic.fit(rawProbs, trueLabels);
    
    // Test transformation
    const calibrated = isotonic.transform(0.5);
    expect(calibrated).toBeGreaterThanOrEqual(0);
    expect(calibrated).toBeLessThanOrEqual(1);
    
    // Test monotonicity (should be non-decreasing)
    const calibratedLow = isotonic.transform(0.2);
    const calibratedHigh = isotonic.transform(0.8);
    expect(calibratedHigh).toBeGreaterThanOrEqual(calibratedLow);
  });

  test('handles edge cases gracefully', () => {
    const isotonic = new IsotonicRegression();
    
    // Test with single value
    const rawProbs = [0.5];
    const trueLabels = [1];
    
    expect(() => isotonic.fit(rawProbs, trueLabels)).not.toThrow();
    
    const calibrated = isotonic.transform(0.5);
    expect(calibrated).toBeGreaterThanOrEqual(0);
    expect(calibrated).toBeLessThanOrEqual(1);
  });

  test('throws error when not fitted', () => {
    const isotonic = new IsotonicRegression();
    
    expect(() => isotonic.transform(0.5)).toThrow('Isotonic regression not fitted');
  });
});

describe('Calibration Wrapper', () => {
  test('chooses best calibration method', () => {
    const wrapper = new CalibrationWrapper();
    
    // Test data
    const rawProbs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const trueLabels = [0, 0, 0, 0, 1, 1, 1, 1, 1];
    
    wrapper.fit(rawProbs, trueLabels);
    
    // Test transformation
    const result = wrapper.transform(0.5);
    expect(result.raw_prob).toBe(0.5);
    expect(result.calibrated_prob).toBeGreaterThanOrEqual(0);
    expect(result.calibrated_prob).toBeLessThanOrEqual(1);
    expect(['HIGH', 'MED', 'LOW']).toContain(result.confidence_bin);
    expect(['platt', 'isotonic', 'none']).toContain(result.calibration_method);
  });

  test('handles insufficient data gracefully', () => {
    const wrapper = new CalibrationWrapper();
    
    // Test with insufficient data
    const rawProbs = [0.5, 0.6];
    const trueLabels = [0, 1];
    
    wrapper.fit(rawProbs, trueLabels);
    
    const result = wrapper.transform(0.5);
    expect(result.calibration_method).toBe('none');
    expect(result.calibrated_prob).toBe(0.5);
  });

  test('throws error when not fitted', () => {
    const wrapper = new CalibrationWrapper();
    
    expect(() => wrapper.transform(0.5)).toThrow('Calibration wrapper not fitted');
  });
});

describe('Edge Computation', () => {
  test('computes edge correctly', () => {
    const edge1 = computeEdge(0.7, 0.6); // 10% edge
    expect(edge1).toBeCloseTo(0.1, 2);
    
    const edge2 = computeEdge(0.5, 0.6); // -10% edge
    expect(edge2).toBeCloseTo(-0.1, 2);
    
    const edge3 = computeEdge(0.6, 0.6); // No edge
    expect(edge3).toBeCloseTo(0, 2);
  });
});

describe('Pick Decision Logic', () => {
  test('makes pick when all conditions are met', () => {
    const mockQualityGates = {
      all_passed: true,
      freshness_ok: true,
      confidence_ok: true,
      dispersion_ok: true,
      time_to_start_ok: true,
    };
    
    const mockPrediction = {
      calibrated_prob: 0.7,
      confidence_bin: 'HIGH' as const,
    };
    
    const shouldPick = shouldMakePick(mockPrediction, 0.05, mockQualityGates);
    expect(shouldPick).toBe(true);
  });

  test('does not make pick when edge is too low', () => {
    const mockQualityGates = {
      all_passed: true,
      freshness_ok: true,
      confidence_ok: true,
      dispersion_ok: true,
      time_to_start_ok: true,
    };
    
    const mockPrediction = {
      calibrated_prob: 0.7,
      confidence_bin: 'HIGH' as const,
    };
    
    const shouldPick = shouldMakePick(mockPrediction, 0.01, mockQualityGates); // Only 1% edge
    expect(shouldPick).toBe(false);
  });

  test('does not make pick when quality gates fail', () => {
    const mockQualityGates = {
      all_passed: false,
      freshness_ok: false,
      confidence_ok: true,
      dispersion_ok: true,
      time_to_start_ok: true,
    };
    
    const mockPrediction = {
      calibrated_prob: 0.7,
      confidence_bin: 'HIGH' as const,
    };
    
    const shouldPick = shouldMakePick(mockPrediction, 0.05, mockQualityGates);
    expect(shouldPick).toBe(false);
  });

  test('does not make pick when confidence is low', () => {
    const mockQualityGates = {
      all_passed: true,
      freshness_ok: true,
      confidence_ok: true,
      dispersion_ok: true,
      time_to_start_ok: true,
    };
    
    const mockPrediction = {
      calibrated_prob: 0.7,
      confidence_bin: 'LOW' as const,
    };
    
    const shouldPick = shouldMakePick(mockPrediction, 0.05, mockQualityGates);
    expect(shouldPick).toBe(false);
  });
});

