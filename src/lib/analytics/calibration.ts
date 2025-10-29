import { MarketFeatures } from './features';

// Calibration configuration
export const CALIBRATION_CONFIG = {
  CV_WINDOW_DAYS: 60,
  MIN_SAMPLES: 100,
  PLATT_ALPHA: 0.1, // Regularization for Platt scaling
} as const;

// Calibrated prediction result
export interface CalibratedPrediction {
  raw_prob: number;
  calibrated_prob: number;
  confidence_bin: 'HIGH' | 'MED' | 'LOW';
  calibration_method: 'platt' | 'isotonic' | 'none';
}

// Simple Platt scaling implementation
export class PlattScaling {
  private a: number = 0;
  private b: number = 0;
  private fitted: boolean = false;

  // Fit Platt scaling parameters
  fit(rawProbs: number[], trueLabels: number[]): void {
    if (rawProbs.length !== trueLabels.length || rawProbs.length === 0) {
      throw new Error('Invalid input for Platt scaling');
    }

    // Convert probabilities to log-odds
    const logOdds = rawProbs.map(p => Math.log(Math.max(p, 1e-10) / Math.max(1 - p, 1e-10)));
    
    // Simple linear regression: log-odds = a * raw_log_odds + b
    const n = logOdds.length;
    const sumX = logOdds.reduce((sum, x) => sum + x, 0);
    const sumY = trueLabels.reduce((sum, y) => sum + y, 0);
    const sumXY = logOdds.reduce((sum, x, i) => sum + x * trueLabels[i], 0);
    const sumXX = logOdds.reduce((sum, x) => sum + x * x, 0);

    // Normal equations
    const denominator = n * sumXX - sumX * sumX;
    if (Math.abs(denominator) < 1e-10) {
      // Fallback to identity
      this.a = 1;
      this.b = 0;
    } else {
      this.a = (n * sumXY - sumX * sumY) / denominator;
      this.b = (sumY - this.a * sumX) / n;
    }

    this.fitted = true;
  }

  // Transform raw probability to calibrated probability
  transform(rawProb: number): number {
    if (!this.fitted) {
      throw new Error('Platt scaling not fitted');
    }

    const logOdds = Math.log(Math.max(rawProb, 1e-10) / Math.max(1 - rawProb, 1e-10));
    const calibratedLogOdds = this.a * logOdds + this.b;
    const calibratedProb = 1 / (1 + Math.exp(-calibratedLogOdds));
    
    return Math.max(0, Math.min(1, calibratedProb)); // Clamp to [0,1]
  }
}

// Simple isotonic regression implementation (using PAVA algorithm)
export class IsotonicRegression {
  private thresholds: number[] = [];
  private values: number[] = [];
  private fitted: boolean = false;

  // Fit isotonic regression
  fit(rawProbs: number[], trueLabels: number[]): void {
    if (rawProbs.length !== trueLabels.length || rawProbs.length === 0) {
      throw new Error('Invalid input for isotonic regression');
    }

    // Sort by raw probabilities
    const sorted = rawProbs.map((prob, i) => ({ prob, label: trueLabels[i] }))
      .sort((a, b) => a.prob - b.prob);

    // Pool Adjacent Violators Algorithm (PAVA)
    const n = sorted.length;
    const values = new Array(n).fill(0);
    const weights = new Array(n).fill(1);
    
    for (let i = 0; i < n; i++) {
      values[i] = sorted[i].label;
    }

    // PAVA iterations
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < n - 1; i++) {
        if (values[i] > values[i + 1]) {
          // Pool adjacent violators
          const totalWeight = weights[i] + weights[i + 1];
          const pooledValue = (values[i] * weights[i] + values[i + 1] * weights[i + 1]) / totalWeight;
          
          values[i] = pooledValue;
          values[i + 1] = pooledValue;
          weights[i] = totalWeight;
          weights[i + 1] = totalWeight;
          
          changed = true;
        }
      }
    }

    // Extract unique thresholds and values
    this.thresholds = [];
    this.values = [];
    
    let lastThreshold = -Infinity;
    let lastValue = values[0];
    
    for (let i = 0; i < n; i++) {
      if (sorted[i].prob !== lastThreshold) {
        this.thresholds.push(sorted[i].prob);
        this.values.push(lastValue);
        lastThreshold = sorted[i].prob;
      }
      lastValue = values[i];
    }
    
    // Add final threshold
    this.thresholds.push(Infinity);
    this.values.push(lastValue);

    this.fitted = true;
  }

  // Transform raw probability to calibrated probability
  transform(rawProb: number): number {
    if (!this.fitted) {
      throw new Error('Isotonic regression not fitted');
    }

    // Find the appropriate bin
    for (let i = 0; i < this.thresholds.length - 1; i++) {
      if (rawProb >= this.thresholds[i] && rawProb < this.thresholds[i + 1]) {
        return Math.max(0, Math.min(1, this.values[i]));
      }
    }
    
    return Math.max(0, Math.min(1, this.values[this.values.length - 1]));
  }
}

// Calibration wrapper that chooses the best method
export class CalibrationWrapper {
  private platt: PlattScaling;
  private isotonic: IsotonicRegression;
  private method: 'platt' | 'isotonic' | 'none' = 'none';
  private fitted: boolean = false;

  constructor() {
    this.platt = new PlattScaling();
    this.isotonic = new IsotonicRegression();
  }

  // Fit calibration using validation data
  fit(rawProbs: number[], trueLabels: number[]): void {
    if (rawProbs.length < CALIBRATION_CONFIG.MIN_SAMPLES) {
      console.warn('Insufficient samples for calibration, using raw probabilities');
      this.method = 'none';
      this.fitted = true;
      return;
    }

    // Split data for validation (simple 80/20 split)
    const splitIndex = Math.floor(rawProbs.length * 0.8);
    const trainProbs = rawProbs.slice(0, splitIndex);
    const trainLabels = trueLabels.slice(0, splitIndex);
    const valProbs = rawProbs.slice(splitIndex);
    const valLabels = trueLabels.slice(splitIndex);

    // Fit both methods
    try {
      this.platt.fit(trainProbs, trainLabels);
      this.isotonic.fit(trainProbs, trainLabels);
    } catch (error) {
      console.warn('Calibration fitting failed, using raw probabilities:', error);
      this.method = 'none';
      this.fitted = true;
      return;
    }

    // Evaluate both methods on validation set
    const plattBrier = this.evaluateBrierScore(valProbs, valLabels, (p) => this.platt.transform(p));
    const isotonicBrier = this.evaluateBrierScore(valProbs, valLabels, (p) => this.isotonic.transform(p));

    // Choose the method with better Brier score
    this.method = plattBrier <= isotonicBrier ? 'platt' : 'isotonic';
    this.fitted = true;

    console.log(`Calibration fitted using ${this.method} method (Brier: ${this.method === 'platt' ? plattBrier : isotonicBrier})`);
  }

  // Transform raw probability to calibrated probability
  transform(rawProb: number): CalibratedPrediction {
    if (!this.fitted) {
      throw new Error('Calibration wrapper not fitted');
    }

    let calibratedProb: number;
    
    switch (this.method) {
      case 'platt':
        calibratedProb = this.platt.transform(rawProb);
        break;
      case 'isotonic':
        calibratedProb = this.isotonic.transform(rawProb);
        break;
      default:
        calibratedProb = rawProb;
    }

    // Determine confidence bin
    const confidence_bin = this.getConfidenceBin(calibratedProb);

    return {
      raw_prob: rawProb,
      calibrated_prob: calibratedProb,
      confidence_bin,
      calibration_method: this.method,
    };
  }

  // Get confidence bin based on calibrated probability
  private getConfidenceBin(calibratedProb: number): 'HIGH' | 'MED' | 'LOW' {
    if (calibratedProb >= 0.7 || calibratedProb <= 0.3) {
      return 'HIGH';
    } else if (calibratedProb >= 0.55 || calibratedProb <= 0.45) {
      return 'MED';
    } else {
      return 'LOW';
    }
  }

  // Evaluate Brier score for calibration method
  private evaluateBrierScore(
    rawProbs: number[],
    trueLabels: number[],
    calibrator: (prob: number) => number
  ): number {
    let brierScore = 0;
    
    for (let i = 0; i < rawProbs.length; i++) {
      const calibratedProb = calibrator(rawProbs[i]);
      const error = calibratedProb - trueLabels[i];
      brierScore += error * error;
    }
    
    return brierScore / rawProbs.length;
  }
}

// Compute edge between fair price and platform price
export function computeEdge(calibratedProb: number, platformPrice: number): number {
  const fairPrice = calibratedProb;
  return fairPrice - platformPrice; // Positive edge means platform price is too low
}

// Determine if a pick should be made based on edge and quality gates
export function shouldMakePick(
  calibratedPrediction: CalibratedPrediction,
  edge: number,
  qualityGates: any // QualityGates type from features.ts
): boolean {
  return (
    qualityGates.all_passed &&
    edge >= 0.03 && // 3% minimum edge
    calibratedPrediction.confidence_bin !== 'LOW'
  );
}
