import { MarketFeatures, featuresToArray } from './features';
import { CalibratedPrediction, CalibrationWrapper } from './calibration';

// Simple logistic regression implementation
export class LogisticRegression {
  private weights: number[] = [];
  private bias: number = 0;
  private fitted: boolean = false;
  private featureNames: string[] = [];

  constructor() {
    // Initialize feature names for consistency
    this.featureNames = [
      'consensus_price', 'cross_book_dispersion', 'minutes_to_start', 'data_freshness_minutes',
      'drift_5m', 'drift_15m', 'drift_60m', 'volatility_5m', 'volatility_15m', 'volatility_60m',
      'velocity_5m', 'velocity_15m', 'velocity_60m', 'volume_24h_log', 'liquidity_score',
      'outcome_count', 'price_spread', 'platform_polymarket', 'platform_kalshi', 'platform_manifold', 'platform_other'
    ];
  }

  // Fit logistic regression using gradient descent
  fit(features: MarketFeatures[], labels: number[], learningRate: number = 0.01, maxIterations: number = 1000): void {
    if (features.length !== labels.length || features.length === 0) {
      throw new Error('Invalid input for logistic regression');
    }

    const nFeatures = this.featureNames.length;
    this.weights = new Array(nFeatures).fill(0);
    this.bias = 0;

    // Convert features to arrays
    const X = features.map(f => featuresToArray(f));
    const y = labels;

    // Gradient descent
    for (let iter = 0; iter < maxIterations; iter++) {
      let totalLoss = 0;
      const weightGradients = new Array(nFeatures).fill(0);
      let biasGradient = 0;

      for (let i = 0; i < X.length; i++) {
        const prediction = this.predictProbability(X[i]);
        const error = prediction - y[i];
        totalLoss += error * error;

        // Compute gradients
        for (let j = 0; j < nFeatures; j++) {
          weightGradients[j] += error * X[i][j];
        }
        biasGradient += error;
      }

      // Update weights
      for (let j = 0; j < nFeatures; j++) {
        this.weights[j] -= learningRate * weightGradients[j] / X.length;
      }
      this.bias -= learningRate * biasGradient / X.length;

      // Check convergence
      if (iter % 100 === 0) {
        const avgLoss = totalLoss / X.length;
        if (avgLoss < 0.001) break;
      }
    }

    this.fitted = true;
    console.log(`Logistic regression fitted with ${X.length} samples`);
  }

  // Predict probability for a single feature vector
  predictProbability(featureArray: number[]): number {
    if (!this.fitted) {
      throw new Error('Logistic regression not fitted');
    }

    if (featureArray.length !== this.weights.length) {
      throw new Error('Feature dimension mismatch');
    }

    // Compute linear combination
    let linearCombination = this.bias;
    for (let i = 0; i < featureArray.length; i++) {
      linearCombination += this.weights[i] * featureArray[i];
    }

    // Apply sigmoid function
    return 1 / (1 + Math.exp(-linearCombination));
  }

  // Predict probability for market features
  predict(features: MarketFeatures): number {
    const featureArray = featuresToArray(features);
    return this.predictProbability(featureArray);
  }
}

// Model wrapper that handles calibration
export class CalibratedModel {
  private model: LogisticRegression;
  private calibrator: CalibrationWrapper;
  private fitted: boolean = false;

  constructor() {
    this.model = new LogisticRegression();
    this.calibrator = new CalibrationWrapper();
  }

  // Fit model and calibration
  fit(features: MarketFeatures[], labels: number[]): void {
    if (features.length !== labels.length || features.length === 0) {
      throw new Error('Invalid input for model fitting');
    }

    // Fit the base model
    this.model.fit(features, labels);

    // Get raw predictions for calibration
    const rawProbs = features.map(f => this.model.predict(f));
    
    // Fit calibration
    this.calibrator.fit(rawProbs, labels);

    this.fitted = true;
    console.log(`Calibrated model fitted with ${features.length} samples`);
  }

  // Predict calibrated probability
  predict(features: MarketFeatures): CalibratedPrediction {
    if (!this.fitted) {
      // Return a default calibrated prediction when model is not fitted
      // This allows the system to work even without training data
      console.warn('Model not fitted - returning default prediction');
      return {
        calibrated_prob: 0.5,
        confidence_bin: 'LOW',
        raw_prob: 0.5,
        calibration_method: 'none',
      };
    }

    const rawProb = this.model.predict(features);
    return this.calibrator.transform(rawProb);
  }

  // Get model performance metrics
  getPerformanceMetrics(features: MarketFeatures[], labels: number[]): {
    accuracy: number;
    brierScore: number;
    logLoss: number;
  } {
    if (!this.fitted) {
      throw new Error('Model not fitted');
    }

    let correct = 0;
    let brierScore = 0;
    let logLoss = 0;

    for (let i = 0; i < features.length; i++) {
      const prediction = this.predict(features[i]);
      const trueLabel = labels[i];
      const predictedLabel = prediction.calibrated_prob > 0.5 ? 1 : 0;

      // Accuracy
      if (predictedLabel === trueLabel) {
        correct++;
      }

      // Brier score
      const error = prediction.calibrated_prob - trueLabel;
      brierScore += error * error;

      // Log loss
      const prob = Math.max(prediction.calibrated_prob, 1e-10);
      const logProb = trueLabel === 1 ? Math.log(prob) : Math.log(1 - prob);
      logLoss -= logProb;
    }

    return {
      accuracy: correct / features.length,
      brierScore: brierScore / features.length,
      logLoss: logLoss / features.length,
    };
  }
}

// Model factory for different market types
export class ModelFactory {
  private static models: Map<string, CalibratedModel> = new Map();

  // Get or create model for market type
  static getModel(marketType: string): CalibratedModel {
    if (!this.models.has(marketType)) {
      this.models.set(marketType, new CalibratedModel());
    }
    return this.models.get(marketType)!;
  }

  // Train model for market type
  static trainModel(marketType: string, features: MarketFeatures[], labels: number[]): void {
    const model = this.getModel(marketType);
    model.fit(features, labels);
  }

  // Get all trained models
  static getTrainedModels(): Map<string, CalibratedModel> {
    const trained = new Map<string, CalibratedModel>();
    for (const [type, model] of this.models) {
      if (model['fitted']) {
        trained.set(type, model);
      }
    }
    return trained;
  }
}

// Determine market type from market features
export function getMarketType(features: MarketFeatures): string {
  // Simple heuristic based on features
  if (features.outcome_count === 2) {
    return 'binary';
  } else if (features.outcome_count > 2) {
    return 'multi_outcome';
  } else {
    return 'unknown';
  }
}

// Cross-validation helper
export function crossValidate(
  features: MarketFeatures[],
  labels: number[],
  nFolds: number = 5
): {
  meanAccuracy: number;
  meanBrierScore: number;
  meanLogLoss: number;
  stdAccuracy: number;
  stdBrierScore: number;
  stdLogLoss: number;
} {
  if (features.length !== labels.length || features.length === 0) {
    throw new Error('Invalid input for cross-validation');
  }

  const foldSize = Math.floor(features.length / nFolds);
  const accuracies: number[] = [];
  const brierScores: number[] = [];
  const logLosses: number[] = [];

  for (let fold = 0; fold < nFolds; fold++) {
    const startIdx = fold * foldSize;
    const endIdx = fold === nFolds - 1 ? features.length : (fold + 1) * foldSize;

    // Split data
    const trainFeatures = [...features.slice(0, startIdx), ...features.slice(endIdx)];
    const trainLabels = [...labels.slice(0, startIdx), ...labels.slice(endIdx)];
    const testFeatures = features.slice(startIdx, endIdx);
    const testLabels = labels.slice(startIdx, endIdx);

    // Train model
    const model = new CalibratedModel();
    model.fit(trainFeatures, trainLabels);

    // Evaluate
    const metrics = model.getPerformanceMetrics(testFeatures, testLabels);
    accuracies.push(metrics.accuracy);
    brierScores.push(metrics.brierScore);
    logLosses.push(metrics.logLoss);
  }

  // Compute statistics
  const meanAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  const meanBrierScore = brierScores.reduce((sum, score) => sum + score, 0) / brierScores.length;
  const meanLogLoss = logLosses.reduce((sum, loss) => sum + loss, 0) / logLosses.length;

  const stdAccuracy = Math.sqrt(accuracies.reduce((sum, acc) => sum + Math.pow(acc - meanAccuracy, 2), 0) / accuracies.length);
  const stdBrierScore = Math.sqrt(brierScores.reduce((sum, score) => sum + Math.pow(score - meanBrierScore, 2), 0) / brierScores.length);
  const stdLogLoss = Math.sqrt(logLosses.reduce((sum, loss) => sum + Math.pow(loss - meanLogLoss, 2), 0) / logLosses.length);

  return {
    meanAccuracy,
    meanBrierScore,
    meanLogLoss,
    stdAccuracy,
    stdBrierScore,
    stdLogLoss,
  };
}
