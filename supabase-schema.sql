-- PolyEdge Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE platform_type AS ENUM ('polymarket', 'kalshi', 'manifold', 'limitless', 'prophetx', 'novig', 'sxbet');
CREATE TYPE market_status AS ENUM ('open', 'closed', 'resolved');
CREATE TYPE recommendation_type AS ENUM ('buy', 'sell', 'watch');
CREATE TYPE league_type AS ENUM ('nba', 'nfl', 'mlb');
CREATE TYPE player_status AS ENUM ('active', 'inactive', 'injured');
CREATE TYPE game_status AS ENUM ('scheduled', 'live', 'completed');
CREATE TYPE price_interval AS ENUM ('1m', '5m', '1h', '4h', '1d');
CREATE TYPE pick_type AS ENUM ('over', 'under', 'exact');

-- Prediction Markets Tables

-- Markets table
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id TEXT UNIQUE NOT NULL,
    platform platform_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status market_status DEFAULT 'open',
    end_date TIMESTAMP WITH TIME ZONE,
    volume_24h NUMERIC DEFAULT 0,
    liquidity NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outcomes table
CREATE TABLE outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    outcome_label TEXT NOT NULL,
    current_price NUMERIC NOT NULL CHECK (current_price >= 0 AND current_price <= 1),
    previous_price NUMERIC,
    price_change_24h NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price history table
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    outcome_label TEXT NOT NULL,
    price NUMERIC NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    interval price_interval NOT NULL,
    volume NUMERIC DEFAULT 0
);

-- Top picks table
CREATE TABLE top_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    recommendation recommendation_type NOT NULL,
    confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    reasoning TEXT,
    value_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- User watchlist table
CREATE TABLE user_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- For future auth implementation
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sports Module Tables

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    team TEXT,
    position TEXT,
    league league_type NOT NULL,
    status player_status DEFAULT 'active',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT UNIQUE NOT NULL,
    league league_type NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    game_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status game_status DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stat lines table
CREATE TABLE stat_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    points NUMERIC,
    rebounds NUMERIC,
    assists NUMERIC,
    steals NUMERIC,
    blocks NUMERIC,
    turnovers NUMERIC,
    three_pointers NUMERIC,
    minutes_played NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projections table
CREATE TABLE projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    projected_points NUMERIC NOT NULL,
    projected_rebounds NUMERIC NOT NULL,
    projected_assists NUMERIC NOT NULL,
    projected_three_pointers NUMERIC NOT NULL,
    confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injury notes table
CREATE TABLE injury_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    league league_type NOT NULL,
    injury_status TEXT,
    description TEXT,
    source TEXT DEFAULT 'llm_search',
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Sports top picks table
CREATE TABLE sports_top_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    projection_id UUID REFERENCES projections(id) ON DELETE CASCADE,
    pick_type pick_type NOT NULL,
    stat_category TEXT NOT NULL,
    projected_value NUMERIC NOT NULL,
    confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    reasoning TEXT,
    value_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_markets_platform ON markets(platform);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_markets_created_at ON markets(created_at);
CREATE INDEX idx_markets_volume_24h ON markets(volume_24h DESC);

CREATE INDEX idx_outcomes_market_id ON outcomes(market_id);
CREATE INDEX idx_outcomes_updated_at ON outcomes(updated_at);

CREATE INDEX idx_price_history_market_id ON price_history(market_id);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX idx_price_history_interval ON price_history(interval);

CREATE INDEX idx_top_picks_market_id ON top_picks(market_id);
CREATE INDEX idx_top_picks_created_at ON top_picks(created_at);
CREATE INDEX idx_top_picks_expires_at ON top_picks(expires_at);

CREATE INDEX idx_players_league ON players(league);
CREATE INDEX idx_players_team ON players(team);
CREATE INDEX idx_players_status ON players(status);

CREATE INDEX idx_games_league ON games(league);
CREATE INDEX idx_games_game_date ON games(game_date);
CREATE INDEX idx_games_status ON games(status);

CREATE INDEX idx_stat_lines_player_id ON stat_lines(player_id);
CREATE INDEX idx_stat_lines_game_id ON stat_lines(game_id);
CREATE INDEX idx_stat_lines_created_at ON stat_lines(created_at);

CREATE INDEX idx_projections_player_id ON projections(player_id);
CREATE INDEX idx_projections_game_id ON projections(game_id);
CREATE INDEX idx_projections_created_at ON projections(created_at);

CREATE INDEX idx_injury_notes_player_id ON injury_notes(player_id);
CREATE INDEX idx_injury_notes_league ON injury_notes(league);
CREATE INDEX idx_injury_notes_expires_at ON injury_notes(expires_at);

CREATE INDEX idx_sports_top_picks_player_id ON sports_top_picks(player_id);
CREATE INDEX idx_sports_top_picks_game_id ON sports_top_picks(game_id);
CREATE INDEX idx_sports_top_picks_created_at ON sports_top_picks(created_at);
CREATE INDEX idx_sports_top_picks_expires_at ON sports_top_picks(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_top_picks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on markets" ON markets FOR ALL USING (true);
CREATE POLICY "Allow all operations on outcomes" ON outcomes FOR ALL USING (true);
CREATE POLICY "Allow all operations on price_history" ON price_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on top_picks" ON top_picks FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_watchlist" ON user_watchlist FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on stat_lines" ON stat_lines FOR ALL USING (true);
CREATE POLICY "Allow all operations on projections" ON projections FOR ALL USING (true);
CREATE POLICY "Allow all operations on injury_notes" ON injury_notes FOR ALL USING (true);
CREATE POLICY "Allow all operations on sports_top_picks" ON sports_top_picks FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_outcomes_updated_at BEFORE UPDATE ON outcomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
