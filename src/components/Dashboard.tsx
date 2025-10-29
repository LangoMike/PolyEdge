"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Eye,
  Star,
} from "lucide-react";
import { useTopPicks } from "@/hooks/useTopPicks";
import { useMarkets } from "@/hooks/useMarkets";
import { MarketCard } from "@/components/MarketCard";

// Mock data for stats - will be replaced with real data
const mockStats = {
  totalMarkets: 1247,
  totalVolume: 2847392,
  topMovers: 23,
  activePicks: 18,
};

export function Dashboard() {
  const { picks: topPicks, loading: picksLoading } = useTopPicks({ limit: 6 });
  const { markets: recentMarkets, loading: marketsLoading } = useMarkets({
    pagination: { page: 1, limit: 6 },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary"></div>
              <h1 className="text-2xl font-bold">PolyEdge</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <a
                href="#"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Prediction Markets
              </a>
              <a
                href="#"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sports
              </a>
              <a
                href="#"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Analytics
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Markets
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockStats.totalMarkets.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Active prediction markets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(mockStats.totalVolume / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                Across all platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Movers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.topMovers}</div>
              <p className="text-xs text-muted-foreground">
                Markets with &gt;10% movement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Picks
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activePicks}</div>
              <p className="text-xs text-muted-foreground">
                Curated recommendations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Picks Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Top Picks</h2>
            <Badge variant="secondary">Updated 2 minutes ago</Badge>
          </div>

          {picksLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {topPicks.map((pick) => (
                <Card
                  key={pick.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {pick.market?.title}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {pick.market?.platform}
                          </Badge>
                          <Badge
                            variant={
                              pick.recommendation === "buy"
                                ? "default"
                                : pick.recommendation === "sell"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {pick.recommendation}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {pick.confidence_score}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Confidence
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Value Score</span>
                        <span className="font-medium">
                          {pick.value_score}/100
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pick.reasoning}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <button className="text-sm text-primary hover:underline">
                          View Details
                        </button>
                        <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground">
                          <Eye className="h-3 w-3" />
                          <span>Watch</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Markets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Recent Markets</h2>
            <button className="text-sm text-primary hover:underline">
              View All
            </button>
          </div>

          {marketsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  outcomes={market.outcomes || []}
                  showDetails={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Market Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Market Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Politics", "Economics", "Culture", "Sports"].map((category) => (
              <Card
                key={category}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg">{category}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.floor(Math.random() * 200) + 50} markets
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
