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
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Eye,
  Star,
  Wifi,
  WifiOff,
  Heart,
} from "lucide-react";
import { useTopPicks } from "@/hooks/useTopPicks";
import { useMarkets } from "@/hooks/useMarkets";
import { useStats } from "@/hooks/useStats";
import { MarketCard } from "@/components/MarketCard";
import { MobileNav } from "@/components/MobileNav";
import { SwipeableCarousel } from "@/components/SwipeableCarousel";
import { CollapsibleFilters } from "@/components/CollapsibleFilters";
import { TopPickCard } from "@/components/TopPickCard";
import type { TopPick } from "@/types";
import Link from "next/link";

export function Dashboard() {
  const {
    picks: topPicks,
    loading: picksLoading,
    isPolling: picksPolling,
  } = useTopPicks({ limit: 6 });
  const {
    markets: recentMarkets,
    loading: marketsLoading,
    isPolling: marketsPolling,
  } = useMarkets({
    pagination: { page: 1, limit: 6 },
  });
  const { stats, loading: statsLoading } = useStats();

  const isPolling = picksPolling || marketsPolling;

  // Use real top picks
  const displayPicks: TopPick[] = topPicks || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNav isPolling={isPolling} />

      {/* Desktop Header */}
      <header className="hidden lg:block border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded accent-gradient"></div>
              <h1 className="text-2xl font-bold">PolyEdge</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition"
              >
                Prediction Markets
              </Link>
              <Link
                href="/for-you"
                className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition flex items-center gap-1"
              >
                <Heart className="h-4 w-4" />
                For You
              </Link>
              <Link
                href="/sports"
                className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition"
              >
                Sports
              </Link>
              <Link
                href="/analytics"
                className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition"
              >
                Analytics
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 lg:py-8">
        {/* Mobile Filters */}
        <CollapsibleFilters
          platforms={[
            { id: "polymarket", label: "Polymarket", count: 450 },
            { id: "kalshi", label: "Kalshi", count: 320 },
            { id: "manifold", label: "Manifold", count: 280 },
          ]}
          categories={[
            { id: "politics", label: "Politics", count: 148 },
            { id: "economics", label: "Economics", count: 101 },
            { id: "culture", label: "Culture", count: 247 },
            { id: "sports", label: "Sports", count: 64 },
          ]}
          statuses={[
            { id: "open", label: "Open", count: 1200 },
            { id: "closed", label: "Closed", count: 47 },
          ]}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <Card className="card-gradient-border hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Markets
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.totalMarkets.toLocaleString() || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Active prediction markets
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient-border hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  ${stats ? (stats.totalVolume / 1000000).toFixed(1) : "0.0"}M
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Across all platforms
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient-border hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Movers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.topMovers || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Markets with &gt;10% movement
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient-border hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Picks
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.activePicks || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Curated recommendations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Picks Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold">Top Picks</h2>
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {picksPolling ? (
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--success)] live-pulse" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {picksPolling ? "Live" : "Paused"}
                  </span>
                </div>
                <Badge variant="secondary">Updated 2 minutes ago</Badge>
              </div>
              <Link href="/for-you">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">For You</span>
                </Button>
              </Link>
            </div>
          </div>

          {picksLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
            <>
              {/* Mobile: Swipeable Carousel */}
              <div className="lg:hidden">
                <SwipeableCarousel
                  itemsPerView={{ mobile: 1, tablet: 1, desktop: 3 }}
                  showArrows={false}
                  showDots={true}
                >
                  {displayPicks.map((pick) => (
                    <TopPickCard key={pick.id} pick={pick} />
                  ))}
                </SwipeableCarousel>
              </div>

              {/* Desktop: Grid Layout */}
              <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayPicks.map((pick) => (
                  <TopPickCard key={pick.id} pick={pick} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Markets */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold">Recent Markets</h2>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {marketsPolling ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm text-muted-foreground">
                  {marketsPolling ? "Live" : "Paused"}
                </span>
              </div>
              <button className="text-sm text-primary hover:underline">
                View All
              </button>
            </div>
          </div>

          {marketsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
            <>
              {/* Mobile: Swipeable Carousel */}
              <div className="lg:hidden">
                <SwipeableCarousel
                  itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
                  showArrows={false}
                  showDots={true}
                >
                  {recentMarkets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      outcomes={market.outcomes || []}
                      showDetails={false}
                    />
                  ))}
                </SwipeableCarousel>
              </div>

              {/* Desktop: Grid Layout */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    outcomes={market.outcomes || []}
                    showDetails={false}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Market Categories */}
        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">
            Market Categories
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              { name: "Politics", count: 148 },
              { name: "Economics", count: 101 },
              { name: "Culture", count: 247 },
              { name: "Sports", count: 64 },
            ].map((category) => (
              <Card
                key={category.name}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4 lg:p-6 text-center">
                  <h3 className="font-semibold text-base lg:text-lg">
                    {category.name}
                  </h3>
                  <p className="text-xs lg:text-sm text-muted-foreground mt-1">
                    {category.count} markets
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
