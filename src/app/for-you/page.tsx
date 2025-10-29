"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, SortAsc, Star, TrendingUp, Target, Clock, X, Search, SlidersHorizontal } from "lucide-react";
import { ForYouCard } from "@/components/ForYouCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMarkets } from "@/hooks/useMarkets";
import { useTopPicks } from "@/hooks/useTopPicks";

type SortOption = 'value' | 'probability' | 'trending' | 'confidence';
type FilterType = 'platform' | 'category' | 'confidence' | 'volatility';

interface FilterState {
  platform: string[];
  category: string[];
  confidence: string[];
  volatility: string[];
  search: string;
}

export default function ForYouPage() {
  const { markets, loading: marketsLoading, error: marketsError } = useMarkets({ 
    pagination: { page: 1, limit: 100 } // Get more markets
  });
  const { picks: topPicks, loading: picksLoading } = useTopPicks({ limit: 100 });
  const [sortBy, setSortBy] = useState<SortOption>('value');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    platform: [],
    category: [],
    confidence: [],
    volatility: [],
    search: '',
  });

  const loading = marketsLoading || picksLoading;
  const error = marketsError;

  const sortOptions = [
    { value: 'value', label: 'Best Value', icon: Star, description: 'Highest edge %' },
    { value: 'probability', label: 'Win Probability', icon: Target, description: 'Highest P(win)' },
    { value: 'trending', label: 'Trending', icon: TrendingUp, description: 'Most recent' },
    { value: 'confidence', label: 'Confidence', icon: Star, description: 'Highest confidence' },
  ];

  // Extract unique values for filters
  const availablePlatforms = useMemo(() => {
    const platforms = new Set(markets?.map(market => market.platform).filter(Boolean) || []);
    return Array.from(platforms);
  }, [markets]);

  const availableCategories = useMemo(() => {
    const categories = new Set(markets?.map(market => market.category).filter(Boolean) || []);
    return Array.from(categories);
  }, [markets]);

  const availableConfidenceLevels = ['HIGH', 'MED', 'LOW'];

  const volatilityRanges = [
    { value: 'low', label: 'Low (0-2%)' },
    { value: 'medium', label: 'Medium (2-5%)' },
    { value: 'high', label: 'High (5%+)' },
  ];

  // Create a map of picks by market ID for quick lookup
  const picksByMarketId = useMemo(() => {
    const map = new Map();
    topPicks?.forEach(pick => {
      if (pick.market_id) {
        map.set(pick.market_id, pick);
      }
    });
    return map;
  }, [topPicks]);

  // Filter and sort markets with their associated picks
  const filteredAndSortedMarkets = useMemo(() => {
    if (!markets) return [];

    // Show all markets, with optional picks
    let filtered = markets.filter(market => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const title = market.title?.toLowerCase() || '';
        const description = market.description?.toLowerCase() || '';
        const pick = picksByMarketId.get(market.id);
        const reasoning = pick?.reasoning?.toLowerCase() || '';
        if (!title.includes(searchTerm) && !description.includes(searchTerm) && !reasoning.includes(searchTerm)) {
          return false;
        }
      }

      // Platform filter
      if (filters.platform.length > 0) {
        if (!filters.platform.includes(market.platform)) {
          return false;
        }
      }

      // Category filter
      if (filters.category.length > 0 && market.category) {
        if (!filters.category.includes(market.category)) {
          return false;
        }
      }

      // Confidence filter (only applies to markets with picks)
      if (filters.confidence.length > 0) {
        const pick = picksByMarketId.get(market.id);
        if (!pick) return false; // Only show markets with picks if confidence filter is active
        
        const confidenceLevel = (pick as any).confidence_level || 
          (pick.confidence_score >= 70 ? 'HIGH' : pick.confidence_score >= 55 ? 'MED' : 'LOW');
        if (!filters.confidence.includes(confidenceLevel)) {
          return false;
        }
      }

      // Volatility filter (only applies to markets with picks)
      if (filters.volatility.length > 0) {
        const pick = picksByMarketId.get(market.id);
        if (!pick) return false; // Only show markets with picks if volatility filter is active
        
        const valueScore = pick.value_score || 0;
        let volatilityRange = 'low';
        if (valueScore > 80) volatilityRange = 'high';
        else if (valueScore > 50) volatilityRange = 'medium';
        
        if (!filters.volatility.includes(volatilityRange)) {
          return false;
        }
      }

      return true;
    });

    // Sort markets
    filtered.sort((a, b) => {
      const pickA = picksByMarketId.get(a.id);
      const pickB = picksByMarketId.get(b.id);
      
      switch (sortBy) {
        case 'value':
          const valueA = pickA?.value_score || 0;
          const valueB = pickB?.value_score || 0;
          return valueB - valueA;
        case 'probability':
          const probA = pickA?.confidence_score || 0;
          const probB = pickB?.confidence_score || 0;
          return probB - probA;
        case 'trending':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'confidence':
          const confA = pickA?.confidence_score || 0;
          const confB = pickB?.confidence_score || 0;
          return confB - confA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [markets, picksByMarketId, filters, sortBy]);

  const handleFilterChange = (type: FilterType, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      platform: [],
      category: [],
      confidence: [],
      volatility: [],
      search: '',
    });
  };

  const activeFiltersCount = Object.values(filters).reduce((count, filterArray) => {
    return count + (Array.isArray(filterArray) ? filterArray.length : 0);
  }, 0) + (filters.search ? 1 : 0);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:underline inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            <span className="text-xs text-muted-foreground">For You</span>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your personalized picks...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:underline inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            <span className="text-xs text-muted-foreground">For You</span>
          </div>
          <Card className="card-gradient-border">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Error loading picks: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:underline inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            <span className="text-xs text-muted-foreground">For You</span>
          </div>
          <Card className="card-gradient-border">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No markets available at the moment.</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-muted-foreground hover:underline inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold">For You</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedMarkets.length} markets to explore
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Sort */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search picks by title or reasoning..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isActive = sortBy === option.value;
              
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={`flex items-center gap-2 ${
                    isActive ? 'accent-gradient text-background' : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6 card-gradient-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Platform</h4>
                <div className="flex flex-wrap gap-2">
                  {availablePlatforms.map(platform => (
                    <Button
                      key={platform}
                      variant={filters.platform.includes(platform) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('platform', platform)}
                      className="capitalize"
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(category => (
                    <Button
                      key={category}
                      variant={filters.category.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('category', category)}
                      className="capitalize"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Confidence Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Confidence Level</h4>
                <div className="flex flex-wrap gap-2">
                  {availableConfidenceLevels.map(level => (
                    <Button
                      key={level}
                      variant={filters.confidence.includes(level) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('confidence', level)}
                      className={
                        level === 'HIGH' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        level === 'MED' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Volatility Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Volatility</h4>
                <div className="flex flex-wrap gap-2">
                  {volatilityRanges.map(range => (
                    <Button
                      key={range.value}
                      variant={filters.volatility.includes(range.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('volatility', range.value)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Markets List */}
        <div className="space-y-4">
          {filteredAndSortedMarkets.length === 0 ? (
            <Card className="card-gradient-border">
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No markets found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms.
                </p>
                {activeFiltersCount > 0 && (
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAndSortedMarkets.map((market) => {
                const pick = picksByMarketId.get(market.id);
                return (
                  <ForYouCard
                    key={market.id}
                    market={market}
                    outcomes={market.outcomes || []}
                    pick={pick}
                    showDetails={true}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredAndSortedMarkets.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Load More Markets
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}