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
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ExternalLink,
  Star,
} from "lucide-react";
import { Market, Outcome } from "@/types";
import { useState } from "react";
import Link from "next/link";

interface MarketCardProps {
  market: Market;
  outcomes: Outcome[];
  onWatch?: (marketId: string) => void;
  isWatched?: boolean;
  showDetails?: boolean;
}

export function MarketCard({
  market,
  outcomes,
  onWatch,
  isWatched = false,
  showDetails = true,
}: MarketCardProps) {
  const [isWatching, setIsWatching] = useState(isWatched);

  // Calculate primary outcome (usually YES or first outcome)
  const primaryOutcome =
    outcomes.find((o) => o.outcome_label.toLowerCase() === "yes") ||
    outcomes[0];
  const currentPrice = primaryOutcome?.current_price || 0;
  const priceChange = primaryOutcome?.price_change_24h || 0;

  // Get Yes/No prices for colored progress bar
  const yesOutcome = outcomes.find(
    (o) => o.outcome_label.toLowerCase() === "yes"
  );
  const noOutcome = outcomes.find(
    (o) => o.outcome_label.toLowerCase() === "no"
  );
  const yesPrice = yesOutcome?.current_price || 0;
  const noPrice = noOutcome?.current_price || 0;

  // Calculate liquidity if not available (fallback for existing data)
  const calculatedLiquidity =
    market.liquidity > 0
      ? market.liquidity
      : (() => {
          const volumeScore = Math.min(market.volume_24h / 10000, 1);
          const priceSpread =
            Math.max(yesPrice, noPrice) - Math.min(yesPrice, noPrice);
          const spreadScore = Math.max(0, 1 - priceSpread * 10);
          return Math.max(
            0,
            Math.min(1, volumeScore * 0.7 + spreadScore * 0.3)
          );
        })();

  // Get platform color
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      polymarket: "bg-blue-100 text-blue-800",
      kalshi: "bg-green-100 text-green-800",
      manifold: "bg-purple-100 text-purple-800",
      limitless: "bg-orange-100 text-orange-800",
      prophetx: "bg-red-100 text-red-800",
      novig: "bg-yellow-100 text-yellow-800",
      sxbet: "bg-gray-100 text-gray-800",
    };
    return colors[platform] || "bg-gray-100 text-gray-800";
  };

  // Get platform URL
  const getPlatformUrl = (platform: string, marketId: string) => {
    const urls: Record<string, string> = {
      polymarket: `https://polymarket.com/event/${marketId}`,
      kalshi: `https://kalshi.com/events/${marketId}`,
      manifold: `https://manifold.markets/${marketId}`,
      limitless: `https://limitless.markets/${marketId}`,
      prophetx: `https://prophetx.com/markets/${marketId}`,
      novig: `https://novig.com/markets/${marketId}`,
      sxbet: `https://sx.bet/markets/${marketId}`,
    };
    return urls[platform] || "#";
  };

  const handleWatch = () => {
    setIsWatching(!isWatching);
    onWatch?.(market.id);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <Badge className={getPlatformColor(market.platform)}>
                {market.platform}
              </Badge>
              {market.category && (
                <Badge variant="outline" className="text-xs">
                  {market.category}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight line-clamp-2">
              <Link
                href={`/markets/${market.id}`}
                className="hover:text-primary transition-colors"
              >
                {market.title}
              </Link>
            </CardTitle>
            {market.description && showDetails && (
              <CardDescription className="line-clamp-2">
                {market.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWatch}
              className={`p-2 ${
                isWatching ? "text-yellow-500" : "text-muted-foreground"
              }`}
            >
              <Star className={`h-4 w-4 ${isWatching ? "fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" asChild className="p-2">
              <a
                href={getPlatformUrl(market.platform, market.market_id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Current Price
            </span>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {(currentPrice * 100).toFixed(1)}%
              </div>
              <div
                className={`text-sm flex items-center justify-end ${
                  priceChange > 0
                    ? "text-green-600"
                    : priceChange < 0
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {priceChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : priceChange < 0 ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : null}
                {priceChange > 0 ? "+" : ""}
                {(priceChange * 100).toFixed(1)}%
                <span className="ml-1 text-xs text-muted-foreground">24h</span>
              </div>
            </div>
          </div>

          {/* Price Progress Bar with Colors */}
          <div className="space-y-1">
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              {/* No (Red) portion */}
              <div
                className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(1 - currentPrice) * 100}%` }}
              />
              {/* Yes (Green) portion */}
              <div
                className="absolute right-0 top-0 h-full bg-green-500 transition-all duration-300"
                style={{ width: `${currentPrice * 100}%` }}
              />
              {/* Price indicator line */}
              <div
                className="absolute top-0 h-full w-0.5 bg-white shadow-sm"
                style={{ left: `${currentPrice * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>No: {(noPrice * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Yes: {(yesPrice * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Metrics */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">24h Volume</div>
              <div className="font-medium">
                ${(market.volume_24h / 1000).toFixed(0)}k
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Liquidity</div>
              <div className="font-medium">
                {calculatedLiquidity > 0
                  ? `${(calculatedLiquidity * 100).toFixed(0)}%`
                  : "Low"}
              </div>
            </div>
          </div>
        )}

        {/* All Outcomes */}
        {outcomes.length > 1 && showDetails && (
          <div className="space-y-3 pt-3 border-t">
            <div className="text-sm font-medium text-muted-foreground">
              All Outcomes
            </div>
            <div className="space-y-2">
              {outcomes.map((outcome) => {
                const isYes = outcome.outcome_label.toLowerCase() === "yes";
                const isNo = outcome.outcome_label.toLowerCase() === "no";
                return (
                  <div
                    key={outcome.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isYes
                            ? "bg-green-500"
                            : isNo
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <span className="text-sm font-medium truncate">
                        {outcome.outcome_label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">
                        {(outcome.current_price * 100).toFixed(1)}%
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {outcome.current_price.toFixed(4)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Market Status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <div
              className={`h-2 w-2 rounded-full ${
                market.status === "open"
                  ? "bg-green-500"
                  : market.status === "closed"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
            />
            <span className="text-sm text-muted-foreground capitalize">
              {market.status}
            </span>
          </div>
          {market.end_date && (
            <span className="text-xs text-muted-foreground">
              Ends {new Date(market.end_date).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-3">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/markets/${market.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
          <Button
            variant={isWatching ? "default" : "outline"}
            size="sm"
            onClick={handleWatch}
            className="flex-1"
          >
            <Star
              className={`h-4 w-4 mr-2 ${isWatching ? "fill-current" : ""}`}
            />
            {isWatching ? "Watching" : "Watch"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
