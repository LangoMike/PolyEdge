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

        for (const market of normalizedMarkets) {
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

              // Update outcomes for existing market
              await updateMarketOutcomes(existingMarket.id, market.market_id, platform);
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
                
                // Insert outcomes for new market
                if (newMarket) {
                  await insertMarketOutcomes(newMarket.id, market.market_id, platform);
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

// Helper function to update market outcomes
async function updateMarketOutcomes(marketId: string, marketIdStr: string, platform: Platform) {
  try {
    // Get current outcomes from PolyRouter
    const marketDetails = await polyRouterClient.getMarketDetails(marketIdStr);
    const outcomes = normalizeOutcomes(marketDetails, marketId);

    // Delete existing outcomes
    await supabaseAdmin
      .from('outcomes')
      .delete()
      .eq('market_id', marketId);

    // Insert new outcomes
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
    console.error(`Error updating outcomes for market ${marketIdStr}:`, error);
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
