import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Setup endpoint to seed initial training data
 * This simulates historical price movements for model training
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting training data setup...');
    
    // Get a sample of markets to seed with price history
    const { data: markets, error: marketsError } = await supabaseAdmin
      .from('markets')
      .select('id, market_id')
      .eq('status', 'open')
      .limit(50);
    
    if (marketsError || !markets || markets.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No markets found for training data' 
      });
    }
    
    console.log(`Found ${markets.length} markets for training data`);
    
    let totalHistoryEntries = 0;
    
    // For each market, create synthetic price history
    for (const market of markets) {
      const { data: outcomes } = await supabaseAdmin
        .from('outcomes')
        .select('outcome_label, current_price')
        .eq('market_id', market.id)
        .limit(1);
      
      if (!outcomes || outcomes.length === 0) continue;
      
      const yesOutcome = outcomes[0];
      const basePrice = yesOutcome.current_price;
      
      // Generate price history for the last 7 days (simulated)
      const historyEntries = [];
      const now = Date.now();
      
      for (let i = 7; i >= 0; i--) {
        const timestamp = new Date(now - i * 24 * 60 * 60 * 1000);
        
        // Add some realistic price variation
        const variation = (Math.random() - 0.5) * 0.1; // ±5%
        const price = Math.max(0.01, Math.min(0.99, basePrice + variation));
        
        historyEntries.push({
          market_id: market.id,
          outcome_label: yesOutcome.outcome_label,
          price,
          timestamp: timestamp.toISOString(),
          interval: '1d',
          volume: Math.random() * 1000 + 100,
        });
      }
      
      // Insert price history
      const { error: insertError } = await supabaseAdmin
        .from('price_history')
        .insert(historyEntries);
      
      if (!insertError) {
        totalHistoryEntries += historyEntries.length;
      }
    }
    
    console.log(`Inserted ${totalHistoryEntries} price history entries`);
    
    return NextResponse.json({
      success: true,
      message: 'Training data setup complete',
      marketsProcessed: markets.length,
      historyEntriesCreated: totalHistoryEntries,
    });
  } catch (error) {
    console.error('Training data setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





