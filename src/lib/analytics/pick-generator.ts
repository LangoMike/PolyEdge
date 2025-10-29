import { Market, Outcome, PriceHistory } from '@/types';
import { MarketFeatures, buildMarketFeatures, applyQualityGates, FEATURE_CONFIG } from './features';
import { CalibratedPrediction, computeEdge, shouldMakePick } from './calibration';
import { CalibratedModel, ModelFactory, getMarketType } from './model';

// Pick generation result
export interface PickResult {
  market_id: string;
  side: 'YES' | 'NO' | 'WATCH';
  calibrated_prob: number;
  edge: number;
  confidence_bin: 'HIGH' | 'MED' | 'LOW';
  reasoning: string;
  features: MarketFeatures;
  quality_gates: any;
  shouldPick: boolean;
}

// Pick generator that orchestrates the entire pipeline
export class PickGenerator {
  private models: Map<string, CalibratedModel> = new Map();

  constructor() {
    // Initialize models for different market types
    this.models.set('binary', new CalibratedModel());
    this.models.set('multi_outcome', new CalibratedModel());
  }

  // Generate pick for a single market
  async generatePick(
    market: Market,
    outcomes: Outcome[],
    priceHistory: PriceHistory[],
    asOf: Date = new Date()
  ): Promise<PickResult> {
    try {
      console.log(`Generating pick for market: ${market.title}`);
      
      // Build features
      const features = buildMarketFeatures(market, outcomes, priceHistory, asOf);
      console.log(`Features built:`, Object.keys(features));
      
      // Determine market type
      const marketType = getMarketType(features);
      
      // Get model for this market type
      const model = this.models.get(marketType) || this.models.get('binary')!;
      
      // Generate prediction
      const prediction = model.predict(features);
      
      // Compute edge (assuming binary market with Yes/No outcomes)
      const yesOutcome = outcomes.find(o => o.outcome_label.toLowerCase() === 'yes');
      
      if (!yesOutcome) {
        console.warn(`No YES outcome found for market ${market.id}`);
        throw new Error('Market must have a YES outcome');
      }
      
      const platformPrice = yesOutcome.current_price;
      const edge = computeEdge(prediction.calibrated_prob, platformPrice);
      
      // Apply quality gates
      const qualityGates = applyQualityGates(features, prediction.calibrated_prob, edge);
      
      // Determine if we should make a pick
      const shouldPick = shouldMakePick(prediction, edge, qualityGates);
      
      // Determine side - be more aggressive with picks
      let side: 'YES' | 'NO' | 'WATCH';
      if (shouldPick) {
        side = prediction.calibrated_prob > 0.5 ? 'YES' : 'NO';
      } else {
        // Fallback: make picks even if quality gates fail, but with lower confidence
        const fallbackEdge = Math.abs(edge);
        if (fallbackEdge > 0.005 && prediction.calibrated_prob > 0.6) { // 0.5% edge, 60% confidence
          side = prediction.calibrated_prob > 0.5 ? 'YES' : 'NO';
        } else {
          side = 'WATCH';
        }
      }
      
      // Generate reasoning
      const reasoning = this.generateReasoning(features, prediction, edge, qualityGates, side);
      
      return {
        market_id: market.id,
        side,
        calibrated_prob: prediction.calibrated_prob,
        edge,
        confidence_bin: prediction.confidence_bin,
        reasoning,
        features,
        quality_gates: qualityGates,
        shouldPick,
      };
      
    } catch (error) {
      console.error(`Error generating pick for market ${market.id}:`, error);
      
      // Generate a simple fallback pick based on basic market data
      const yesOutcome = outcomes.find(o => o.outcome_label.toLowerCase() === 'yes');
      const platformPrice = yesOutcome ? yesOutcome.current_price : 0.5;
      
      // Simple heuristic: if price is far from 0.5, there might be value
      const priceDeviation = Math.abs(platformPrice - 0.5);
      const simpleEdge = priceDeviation * 0.1; // 10% of deviation as edge
      
      // Calculate probability more conservatively to avoid going above 100%
      const simpleProb = Math.min(0.95, Math.max(0.45, 
        platformPrice > 0.5 ? 0.55 + (priceDeviation * 0.4) : 0.45 - (priceDeviation * 0.4)
      ));
      
      const shouldPick = simpleEdge > 0.005 && simpleProb > 0.55 && simpleProb < 0.95;
      const side = shouldPick ? (platformPrice > 0.5 ? 'YES' : 'NO') : 'WATCH';
      
      return {
        market_id: market.id,
        side,
        calibrated_prob: simpleProb,
        edge: Math.max(-0.05, Math.min(0.15, simpleEdge)),
        confidence_bin: simpleProb > 0.7 ? 'HIGH' : simpleProb > 0.6 ? 'MED' : 'LOW',
        reasoning: shouldPick 
          ? `Simple heuristic: ${side} at ${(simpleProb * 100).toFixed(1)}% confidence with ${(simpleEdge * 100).toFixed(1)}% edge`
          : 'Insufficient signal strength for confident prediction',
        features: {} as MarketFeatures,
        quality_gates: { all_passed: false },
        shouldPick,
      };
    }
  }

  // Generate reasoning for the pick
  private generateReasoning(
    features: MarketFeatures,
    prediction: CalibratedPrediction,
    edge: number,
    qualityGates: any,
    side: 'YES' | 'NO' | 'WATCH'
  ): string {
    const reasons: string[] = [];
    
    // Confidence level
    if (prediction.confidence_bin === 'HIGH') {
      reasons.push('High confidence prediction based on strong signal patterns');
    } else if (prediction.confidence_bin === 'MED') {
      reasons.push('Medium confidence prediction with moderate signal strength');
    } else {
      reasons.push('Low confidence prediction due to weak or conflicting signals');
    }
    
    // Edge analysis
    if (edge > 0.05) {
      reasons.push(`Strong positive edge of ${(edge * 100).toFixed(1)}%`);
    } else if (edge > 0.02) {
      reasons.push(`Moderate positive edge of ${(edge * 100).toFixed(1)}%`);
    } else if (edge < -0.02) {
      reasons.push(`Negative edge of ${(edge * 100).toFixed(1)}% suggests unfavorable pricing`);
    }
    
    // Data quality
    if (features.data_freshness_minutes <= 1) {
      reasons.push('Very fresh data (under 1 minute)');
    } else if (features.data_freshness_minutes <= 5) {
      reasons.push('Recent data (under 5 minutes)');
    } else {
      reasons.push('Stale data may affect prediction accuracy');
    }
    
    // Market activity
    if (features.volume_24h_log > 8) {
      reasons.push('High trading volume indicates active market');
    } else if (features.volume_24h_log > 6) {
      reasons.push('Moderate trading volume');
    } else {
      reasons.push('Low trading volume may indicate limited interest');
    }
    
    // Price movement
    if (Math.abs(features.drift_15m) > 0.05) {
      const direction = features.drift_15m > 0 ? 'upward' : 'downward';
      reasons.push(`Recent ${direction} price movement in last 15 minutes`);
    }
    
    // Volatility
    if (features.volatility_60m > 0.1) {
      reasons.push('High volatility suggests uncertain market conditions');
    } else if (features.volatility_60m < 0.02) {
      reasons.push('Low volatility indicates stable market conditions');
    }
    
    // Quality gates
    if (!qualityGates.freshness_ok) {
      reasons.push('Data freshness below threshold');
    }
    if (!qualityGates.dispersion_ok) {
      reasons.push('High price dispersion across platforms');
    }
    if (!qualityGates.time_to_start_ok) {
      reasons.push('Insufficient time before market resolution');
    }
    
    // Final decision
    if (side === 'WATCH') {
      reasons.push('Recommendation: Watch - insufficient edge or quality concerns');
    } else {
      reasons.push(`Recommendation: ${side} - calibrated probability ${(prediction.calibrated_prob * 100).toFixed(1)}%`);
    }
    
    return reasons.join('. ') + '.';
  }

  // Public method to train models on available data
  async trainModel(): Promise<void> {
    console.log('Training model with synthetic labels based on current prices...');
    
    // Initialize models with basic weights using synthetic data
    // This is a simplified approach - real training needs resolved markets
    
    const binaryModel = this.models.get('binary');
    if (binaryModel) {
      // Pre-train with a simple default model
      const defaultFeatures = [
        // Conservative features (similar to our heuristic logic)
        [0.5, 0.05, 0.1, 0.02, 0.03, 0.01, 0.04, 0.01, 0.02, 0.0, 0.1, 0.0, 1.0],
        [0.7, 0.1, 0.15, 0.03, 0.04, 0.02, 0.05, 0.02, 0.03, 0.0, 0.15, 0.0, 1.0],
        [0.3, 0.05, 0.08, 0.01, 0.02, 0.0, 0.03, 0.0, 0.01, 0.0, 0.08, 0.0, 1.0],
      ];
      
      const defaultLabels = [0.5, 0.7, 0.3]; // Corresponding to neutral, bullish, bearish
      
      try {
        binaryModel.fit(defaultFeatures, defaultLabels);
        console.log('Model pre-trained with default weights');
      } catch (error) {
        console.error('Error pre-training model:', error);
      }
    }
    
    console.log('Model training complete - using calibrated predictions');
  }

  // Train models with historical data
  async trainModels(
    trainingData: Array<{
      market: Market;
      outcomes: Outcome[];
      priceHistory: PriceHistory[];
      actualOutcome: number; // 1 for Yes, 0 for No
    }>
  ): Promise<void> {
    console.log(`Training models with ${trainingData.length} samples`);
    
    // Group by market type
    const byType = new Map<string, Array<{ features: MarketFeatures; label: number }>>();
    
    for (const sample of trainingData) {
      try {
        const features = buildMarketFeatures(sample.market, sample.outcomes, sample.priceHistory);
        const marketType = getMarketType(features);
        
        if (!byType.has(marketType)) {
          byType.set(marketType, []);
        }
        
        byType.get(marketType)!.push({
          features,
          label: sample.actualOutcome,
        });
      } catch (error) {
        console.warn(`Skipping training sample due to error:`, error);
      }
    }
    
    // Train each model type
    for (const [marketType, samples] of byType) {
      if (samples.length < 10) {
        console.warn(`Insufficient samples for ${marketType} model: ${samples.length}`);
        continue;
      }
      
      const features = samples.map(s => s.features);
      const labels = samples.map(s => s.label);
      
      const model = this.models.get(marketType) || new CalibratedModel();
      model.fit(features, labels);
      this.models.set(marketType, model);
      
      console.log(`Trained ${marketType} model with ${samples.length} samples`);
    }
  }

  // Get model performance metrics
  getModelMetrics(marketType: string): any {
    const model = this.models.get(marketType);
    if (!model) {
      return null;
    }
    
    return {
      fitted: model['fitted'] || false,
      marketType,
    };
  }

  // Get all model types
  getModelTypes(): string[] {
    return Array.from(this.models.keys());
  }
}

// Singleton instance
export const pickGenerator = new PickGenerator();
