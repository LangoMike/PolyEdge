import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser usage (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database type definitions (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      markets: {
        Row: {
          id: string;
          market_id: string;
          platform: string;
          title: string;
          description: string | null;
          category: string | null;
          status: string;
          end_date: string | null;
          volume_24h: number;
          liquidity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          market_id: string;
          platform: string;
          title: string;
          description?: string | null;
          category?: string | null;
          status?: string;
          end_date?: string | null;
          volume_24h?: number;
          liquidity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          market_id?: string;
          platform?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          status?: string;
          end_date?: string | null;
          volume_24h?: number;
          liquidity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      outcomes: {
        Row: {
          id: string;
          market_id: string;
          outcome_label: string;
          current_price: number;
          previous_price: number | null;
          price_change_24h: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          market_id: string;
          outcome_label: string;
          current_price: number;
          previous_price?: number | null;
          price_change_24h?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          market_id?: string;
          outcome_label?: string;
          current_price?: number;
          previous_price?: number | null;
          price_change_24h?: number;
          updated_at?: string;
        };
      };
      price_history: {
        Row: {
          id: string;
          market_id: string;
          outcome_label: string;
          price: number;
          timestamp: string;
          interval: string;
          volume: number;
        };
        Insert: {
          id?: string;
          market_id: string;
          outcome_label: string;
          price: number;
          timestamp: string;
          interval: string;
          volume?: number;
        };
        Update: {
          id?: string;
          market_id?: string;
          outcome_label?: string;
          price?: number;
          timestamp?: string;
          interval?: string;
          volume?: number;
        };
      };
      top_picks: {
        Row: {
          id: string;
          market_id: string;
          recommendation: string;
          confidence_score: number;
          reasoning: string | null;
          value_score: number;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          market_id: string;
          recommendation: string;
          confidence_score: number;
          reasoning?: string | null;
          value_score?: number;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          market_id?: string;
          recommendation?: string;
          confidence_score?: number;
          reasoning?: string | null;
          value_score?: number;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      players: {
        Row: {
          id: string;
          player_id: string;
          first_name: string;
          last_name: string;
          team: string | null;
          position: string | null;
          league: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          first_name: string;
          last_name: string;
          team?: string | null;
          position?: string | null;
          league: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          first_name?: string;
          last_name?: string;
          team?: string | null;
          position?: string | null;
          league?: string;
          status?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          game_id: string;
          league: string;
          home_team: string;
          away_team: string;
          game_date: string;
          status: string;
          home_score: number | null;
          away_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          league: string;
          home_team: string;
          away_team: string;
          game_date: string;
          status?: string;
          home_score?: number | null;
          away_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          league?: string;
          home_team?: string;
          away_team?: string;
          game_date?: string;
          status?: string;
          home_score?: number | null;
          away_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stat_lines: {
        Row: {
          id: string;
          player_id: string;
          game_id: string;
          points: number | null;
          rebounds: number | null;
          assists: number | null;
          steals: number | null;
          blocks: number | null;
          turnovers: number | null;
          three_pointers: number | null;
          minutes_played: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          game_id: string;
          points?: number | null;
          rebounds?: number | null;
          assists?: number | null;
          steals?: number | null;
          blocks?: number | null;
          turnovers?: number | null;
          three_pointers?: number | null;
          minutes_played?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_id?: string;
          points?: number | null;
          rebounds?: number | null;
          assists?: number | null;
          steals?: number | null;
          blocks?: number | null;
          turnovers?: number | null;
          three_pointers?: number | null;
          minutes_played?: number | null;
          created_at?: string;
        };
      };
      projections: {
        Row: {
          id: string;
          player_id: string;
          game_id: string;
          projected_points: number;
          projected_rebounds: number;
          projected_assists: number;
          projected_three_pointers: number;
          confidence_score: number;
          model_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          game_id: string;
          projected_points: number;
          projected_rebounds: number;
          projected_assists: number;
          projected_three_pointers: number;
          confidence_score: number;
          model_version?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_id?: string;
          projected_points?: number;
          projected_rebounds?: number;
          projected_assists?: number;
          projected_three_pointers?: number;
          confidence_score?: number;
          model_version?: string;
          created_at?: string;
        };
      };
      injury_notes: {
        Row: {
          id: string;
          player_id: string;
          league: string;
          injury_status: string | null;
          description: string | null;
          source: string;
          fetched_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          league: string;
          injury_status?: string | null;
          description?: string | null;
          source?: string;
          fetched_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          league?: string;
          injury_status?: string | null;
          description?: string | null;
          source?: string;
          fetched_at?: string;
          expires_at?: string;
        };
      };
      sports_top_picks: {
        Row: {
          id: string;
          player_id: string;
          game_id: string;
          projection_id: string;
          pick_type: string;
          stat_category: string;
          projected_value: number;
          confidence_score: number;
          reasoning: string | null;
          value_score: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          game_id: string;
          projection_id: string;
          pick_type: string;
          stat_category: string;
          projected_value: number;
          confidence_score: number;
          reasoning?: string | null;
          value_score?: number;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_id?: string;
          projection_id?: string;
          pick_type?: string;
          stat_category?: string;
          projected_value?: number;
          confidence_score?: number;
          reasoning?: string | null;
          value_score?: number;
          created_at?: string;
          expires_at?: string;
        };
      };
    };
  };
};
