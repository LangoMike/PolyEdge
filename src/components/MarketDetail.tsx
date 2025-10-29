"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  Users,
  Star,
  Wifi,
  WifiOff,
  BarChart3,
  Target,
  AlertCircle,
} from "lucide-react";
import { useMarketDetail } from "@/hooks/useMarketDetail";
import { useMarkets } from "@/hooks/useMarkets";
import { Market } from "@/types";
import Link from "next/link";
import { PriceChart } from "@/components/PriceChart";
import { ComparableMarkets } from "@/components/ComparableMarkets";

interface MarketDetailProps {
  marketId: string;
}

export function MarketDetail({ marketId }: MarketDetailProps) {
  const { market, loading, error, isPolling } = useMarketDetail(marketId);
  const { markets: comparableMarkets } = useMarkets({
    filters: {
      categories: market?.category ? [market.category] : [],
      platforms: market?.platform ? [market.platform] : [],
    },
    pagination: { page: 1, limit: 4 },
  });

  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  if (loading) {
    return <MarketDetailSkeleton />;
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Market Not Found</h2>
                <p className="text-muted-foreground">
                  {error || "This market could not be found."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getPlatformUrl = (platform: string, marketId: string) => {
    const baseUrls: Record<string, string> = {
      polymarket: `https://polymarket.com/event/${marketId}`,
      kalshi: `https://kalshi.com/events/${marketId}`,
      manifold: `https://manifold.markets/${marketId}`,
      limitless: `https://limitless.markets/market/${marketId}`,
      prophetx: `https://prophetx.io/market/${marketId}`,
      novig: `https://novig.com/market/${marketId}`,
      sxbet: `https://sx.bet/market/${marketId}`,
    };
    return baseUrls[platform] || "#";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded bg-primary"></div>
                <h1 className="text-2xl font-bold">PolyEdge</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isPolling ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm text-muted-foreground">
                {isPolling ? "Live" : "Paused"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{market.platform}</Badge>
                      <Badge className={getStatusColor(market.status)}>
                        {market.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{market.title}</CardTitle>
                    {market.description && (
                      <CardDescription className="text-base">
                        {market.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button asChild>
                    <a
                      href={getPlatformUrl(market.platform, market.market_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on {market.platform}
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">24h Volume</span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${(market.volume_24h / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Liquidity</span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${(market.liquidity / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">End Date</span>
                    </div>
                    <p className="text-sm">
                      {market.end_date
                        ? new Date(market.end_date).toLocaleDateString()
                        : "TBD"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Category</span>
                    </div>
                    <p className="text-sm capitalize">
                      {market.category || "Uncategorized"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Price History</span>
                </CardTitle>
                <CardDescription>
                  Historical price movements for this market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PriceChart marketId={marketId} />
              </CardContent>
            </Card>

            {/* Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>Market Outcomes</CardTitle>
                <CardDescription>
                  Current prices and probabilities for each outcome
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock outcomes - in real app, these would come from the API */}
                  {[
                    { label: "Yes", price: 0.65, change: 0.05 },
                    { label: "No", price: 0.35, change: -0.05 },
                  ].map((outcome, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedOutcome === outcome.label
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedOutcome(outcome.label)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{outcome.label}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold">
                              ${outcome.price.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {(outcome.price * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`flex items-center space-x-1 ${
                              outcome.change > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {outcome.change > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">
                              {outcome.change > 0 ? "+" : ""}
                              {(outcome.change * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            24h change
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </Button>
                <Button className="w-full" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Set Alert
                </Button>
                <Button className="w-full" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Comparable Markets */}
            <ComparableMarkets
              markets={comparableMarkets.filter((m) => m.id !== market.id)}
              currentMarket={market}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function MarketDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
