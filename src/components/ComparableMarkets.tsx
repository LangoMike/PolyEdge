"use client";

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
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Market } from "@/types";
import Link from "next/link";

interface ComparableMarketsProps {
  markets: Market[];
  currentMarket: Market;
}

export function ComparableMarkets({ markets, currentMarket }: ComparableMarketsProps) {
  if (markets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Similar Markets</CardTitle>
          <CardDescription>
            Markets in the same category or platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No similar markets found
          </p>
        </CardContent>
      </Card>
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

  // Mock price changes for display
  const getMockPriceChange = () => {
    const change = (Math.random() - 0.5) * 0.1; // ±5% change
    return {
      change: Number(change.toFixed(3)),
      percentage: Number((change * 100).toFixed(1)),
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar Markets</CardTitle>
        <CardDescription>
          Markets in the same category or platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {markets.map((market) => {
          const priceChange = getMockPriceChange();
          return (
            <div
              key={market.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium text-sm line-clamp-2">
                      {market.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {market.platform}
                      </Badge>
                      <Badge
                        className={`text-xs ${getStatusColor(market.status)}`}
                      >
                        {market.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <a
                      href={getPlatformUrl(market.platform, market.market_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">
                        ${(0.3 + Math.random() * 0.4).toFixed(2)}
                      </span>
                      <div
                        className={`flex items-center space-x-1 ${
                          priceChange.change >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {priceChange.change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="text-xs font-medium">
                          {priceChange.change >= 0 ? "+" : ""}
                          {priceChange.percentage}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vol: ${(market.volume_24h / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/markets/${market.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <Button variant="outline" className="w-full" asChild>
          <Link href="/">
            View All Markets
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function ComparableMarketsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
