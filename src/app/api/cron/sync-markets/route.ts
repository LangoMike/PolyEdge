import { NextRequest, NextResponse } from 'next/server';
import { PolyRouterClient } from '@/lib/api/polyrouter-client';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeMarkets, normalizeOutcomes, validateMarketData } from '@/lib/data/normalizer';
import { Platform } from '@/types';

// Platforms to sync
const PLATFORMS: Platform[] = ['polymarket', 'kalshi', 'manifold', 'limitless', 'prophetx', 'novig', 'sxbet'];

export async function GET(request: NextRequest) {
  try {
    console.log('Starting market sync...');
    
    const polyRouterClient = new PolyRouterClient(process.env.POLYROUTER_API_KEY || '');
    
    const syncResults = {
      totalMarkets: 0,
      newMarkets: 0,
      updatedMarkets: 0,
      errors: 0,
      platforms: {} as Record<string, any>,
    };

    // Sync each platform
    for (const platform of PLATFORMS) {
      try {
        console.log(`Syncing ${platform}...`);
        
        // Fetch markets from platform (only open markets)
        const response = await polyRouterClient.getMarkets(platform, 100, 0, 'open');
        
        if (!response.data || response.data.length === 0) {
          console.log(`No markets found for ${platform}`);
          syncResults.platforms[platform] = { markets: 0, errors: 0 };
          continue;
        }

        // Filter and validate markets
        const validMarkets = response.data.filter(validateMarketData);
        syncResults.totalMarkets += validMarkets.length;

        // Normalize markets
        const { markets: normalizedMarkets } = normalizeMarkets({
          data: validMarkets,
          pagination: response.pagination,
        });

        // Upsert markets to database
        let platformNewMarkets = 0;
        let platformUpdatedMarkets = 0;

        for (let i = 0; i < normalizedMarkets.length; i++) {
          const market = normalizedMarkets[i];
          const rawMarket = validMarkets[i]; // Get raw data for outcomes
          
          try {
            // Check if market exists
            const { data: existingMarket } = await supabaseAdmin
              .from('markets')
              .select('id, market_id')
              .eq('market_id', market.market_id)
              .eq('platform', market.platform)
              .single();

            if (existingMarket) {
              // Update existing market
              const { error: updateError } = await supabaseAdmin
                .from('markets')
                .update({
                  title: market.title,
                  description: market.description,
                  category: market.category,
                  status: market.status,
                  volume_24h: market.volume_24h,
                  liquidity: market.liquidity,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingMarket.id);

              if (updateError) {
                console.error(`Error updating market ${market.market_id}:`, updateError);
                syncResults.errors++;
              } else {
                platformUpdatedMarkets++;
                syncResults.updatedMarkets++;
              }

              // Update outcomes using raw market data
              await updateMarketOutcomesFromRaw(existingMarket.id, rawMarket);
            } else {
              // Insert new market
              const { data: newMarket, error: insertError } = await supabaseAdmin
                .from('markets')
                .insert({
                  market_id: market.market_id,
                  platform: market.platform,
                  title: market.title,
                  description: market.description,
                  category: market.category,
                  status: market.status,
                  volume_24h: market.volume_24h,
                  liquidity: market.liquidity,
                })
                .select()
                .single();

              if (insertError) {
                console.error(`Error inserting market ${market.market_id}:`, insertError);
                syncResults.errors++;
              } else {
                platformNewMarkets++;
                syncResults.newMarkets++;
                
                // Insert outcomes for new market using raw data
                if (newMarket) {
                  await updateMarketOutcomesFromRaw(newMarket.id, rawMarket);
                }
              }
            }
          } catch (marketError) {
            console.error(`Error processing market ${market.market_id}:`, marketError);
            syncResults.errors++;
          }
        }

        syncResults.platforms[platform] = {
          markets: validMarkets.length,
          newMarkets: platformNewMarkets,
          updatedMarkets: platformUpdatedMarkets,
          errors: 0,
        };

        console.log(`Completed ${platform}: ${validMarkets.length} markets processed`);
      } catch (platformError) {
        console.error(`Error syncing platform ${platform}:`, platformError);
        syncResults.errors++;
        syncResults.platforms[platform] = { markets: 0, errors: 1 };
      }
    }

    console.log('Market sync completed:', syncResults);
    
    return NextResponse.json({
      success: true,
      message: 'Market sync completed',
      results: syncResults,
    });
  } catch (error) {
    console.error('Market sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Market sync failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to update market outcomes from raw API data (no additional API call needed)
async function updateMarketOutcomesFromRaw(marketId: string, rawMarket: any) {
  try {
    const { normalizeOutcomes } = await import('@/lib/data/normalizer');
    
    // Normalize outcomes from raw market data
    const outcomes = normalizeOutcomes(rawMarket, marketId);
    
    if (outcomes.length === 0) {
      console.log(`[updateMarketOutcomesFromRaw] No outcomes to insert for market ${marketId}`);
      return;
    }
    
    // Delete existing outcomes
    await supabaseAdmin
      .from('outcomes')
      .delete()
      .eq('market_id', marketId);
    
    // Insert new outcomes
    const { error: insertError } = await supabaseAdmin
      .from('outcomes')
      .insert(outcomes.map(outcome => ({
        market_id: marketId,
        outcome_label: outcome.outcome_label,
        current_price: outcome.current_price,
        previous_price: outcome.previous_price,
        price_change_24h: outcome.price_change_24h,
      })));
    
    if (insertError) {
      console.error(`[updateMarketOutcomesFromRaw] Error inserting outcomes:`, insertError);
    } else {
      console.log(`[updateMarketOutcomesFromRaw] Successfully inserted ${outcomes.length} outcomes for market ${marketId}`);
    }
  } catch (error) {
    console.error(`[updateMarketOutcomesFromRaw] Error updating outcomes:`, error);
  }
}

// Helper function to update market outcomes
async function updateMarketOutcomes(marketId: string, marketIdStr: string, platform: Platform) {
  try {
    console.log(`[updateMarketOutcomes] Updating outcomes for market ${marketIdStr} (${marketId})`);
    
    // Get current outcomes from PolyRouter
    const marketDetails = await polyRouterClient.getMarketDetails(marketIdStr);
    console.log(`[updateMarketOutcomes] Market details received, current_prices exists:`, !!(marketDetails as any).current_prices);
    
    const outcomes = normalizeOutcomes(marketDetails, marketId);
    console.log(`[updateMarketOutcomes] Normalized ${outcomes.length} outcomes`);

    // Delete existing outcomes
    const { error: deleteError } = await supabaseAdmin
      .from('outcomes')
      .delete()
      .eq('market_id', marketId);
    
    if (deleteError) {
      console.error(`[updateMarketOutcomes] Error deleting outcomes:`, deleteError);
    }

    // Insert new outcomes
    if (outcomes.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('outcomes')
        .insert(outcomes.map(outcome => ({
          market_id: marketId,
          outcome_label: outcome.outcome_label,
          current_price: outcome.current_price,
          previous_price: outcome.previous_price,
          price_change_24h: outcome.price_change_24h,
        })));
      
      if (insertError) {
        console.error(`[updateMarketOutcomes] Error inserting outcomes:`, insertError);
      } else {
        console.log(`[updateMarketOutcomes] Successfully inserted ${outcomes.length} outcomes`);
      }
    } else {
      console.log(`[updateMarketOutcomes] No outcomes to insert for market ${marketIdStr}`);
    }
  } catch (error) {
    console.error(`[updateMarketOutcomes] Error updating outcomes for market ${marketIdStr}:`, error);
  }
}

// Helper function to insert market outcomes
async function insertMarketOutcomes(marketId: string, marketIdStr: string, platform: Platform) {
  try {
    // Get current outcomes from PolyRouter
    const marketDetails = await polyRouterClient.getMarketDetails(marketIdStr);
    const outcomes = normalizeOutcomes(marketDetails, marketId);

    // Insert outcomes
    if (outcomes.length > 0) {
      await supabaseAdmin
        .from('outcomes')
        .insert(outcomes.map(outcome => ({
          market_id: marketId,
          outcome_label: outcome.outcome_label,
          current_price: outcome.current_price,
          previous_price: outcome.previous_price,
          price_change_24h: outcome.price_change_24h,
        })));
    }
  } catch (error) {
    console.error(`Error inserting outcomes for market ${marketIdStr}:`, error);
  }
}
