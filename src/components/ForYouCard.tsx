"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Target,
  BarChart3,
  Clock,
  Eye
} from "lucide-react";
import { Market, Outcome, TopPick } from "@/types";

interface ForYouCardProps {
  market: Market;
  outcomes: Outcome[];
  pick?: TopPick; // Optional analytics pick
  onWatch?: (marketId: string) => void;
  isWatched?: boolean;
}

export function ForYouCard({ 
  market, 
  outcomes, 
  pick, 
  onWatch, 
  isWatched = false 
}: ForYouCardProps) {
  // Calculate primary outcome (usually YES or first outcome)
  const primaryOutcome = outcomes.find((o) => o.outcome_label.toLowerCase() === "yes") || outcomes[0];
  const currentPrice = primaryOutcome?.current_price || 0;
  const priceChange = primaryOutcome?.price_change_24h || 0;
  
  // Get Yes/No prices for colored progress bar
  const yesOutcome = outcomes.find((o) => o.outcome_label.toLowerCase() === "yes");
  const noOutcome = outcomes.find((o) => o.outcome_label.toLowerCase() === "no");
  const yesPrice = yesOutcome?.current_price || 0;
  const noPrice = noOutcome?.current_price || 0;

  // Get platform color
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      polymarket: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      kalshi: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      manifold: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      limitless: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      prophetx: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      novig: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      sxbet: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    };
    return colors[platform] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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

  const handleWatch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWatch?.(market.id);
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(getPlatformUrl(market.platform, market.market_id), "_blank", "noopener,noreferrer");
  };

  // Pick analytics data
  const pickLabel = pick?.recommendation === "buy" ? "Yes" : 
                   pick?.recommendation === "sell" ? "No" : "Watch";
  const confidence = Math.round(pick?.confidence_score || 0);
  const confidenceLevel = confidence >= 70 ? "HIGH" : confidence >= 55 ? "MED" : "LOW";
  const edgePercentage = (pick as any)?.edge_percentage || pick?.value_score || 0;
  const probabilityPercentage = (pick as any)?.probability_percentage || pick?.confidence_score || 0;

  // Calculate liquidity if not available (fallback for existing data)
  const calculatedLiquidity = market.liquidity > 0 ? market.liquidity : (() => {
    const volumeScore = Math.min(market.volume_24h / 10000, 1);
    const priceSpread = Math.max(yesPrice, noPrice) - Math.min(yesPrice, noPrice);
    const spreadScore = Math.max(0, 1 - priceSpread * 10);
    return Math.max(0, Math.min(1, volumeScore * 0.7 + spreadScore * 0.3));
  })();

  return (
    <Link
      href={`/markets/${market.id}`}
      className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
    >
      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 pr-2">
              <div className="flex items-center space-x-2">
                <Badge className={getPlatformColor(market.platform)}>
                  {market.platform}
                </Badge>
                {market.category && (
                  <Badge variant="outline" className="text-xs">
                    {market.category}
                  </Badge>
                )}
                {pick && (
                  <Badge
                    variant="outline"
                    className={
                      confidenceLevel === "HIGH"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : confidenceLevel === "MED"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }
                  >
                    {pickLabel}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {market.title}
              </CardTitle>
              {market.description && (
                <CardDescription className="line-clamp-2">
                  {market.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWatch}
                className={`p-2 ${
                  isWatched ? "text-yellow-500" : "text-muted-foreground"
                }`}
              >
                <Star className={`h-4 w-4 ${isWatched ? "fill-current" : ""}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExternalLink}
                className="p-2"
              >
                <ExternalLink className="h-4 w-4" />
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
                <div className="text-2xl font-bold text-primary">
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
              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                  className="absolute top-0 h-full w-0.5 bg-white dark:bg-gray-900 shadow-sm"
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

          {/* Analytics Pick Section */}
          {pick && (
            <div className="p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Analytics Pick</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={
                      confidenceLevel === "HIGH"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : confidenceLevel === "MED"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }
                  >
                    {confidenceLevel}
                  </Badge>
                  <div className="text-sm font-bold text-primary">
                    {confidence}%
                  </div>
                </div>
              </div>
              
              {pick.reasoning && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {pick.reasoning}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-primary" />
                    <span>Edge {edgePercentage}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3 text-blue-400" />
                    <span>P(win) {probabilityPercentage}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {pick.created_at ? 
                      new Date(pick.created_at).toLocaleDateString() : 
                      'Recent'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Market Metrics */}
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
          <div className="flex items-center space-x-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/markets/${market.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </Button>
            <Button
              variant={isWatched ? "default" : "outline"}
              size="sm"
              onClick={handleWatch}
              className="flex-1"
            >
              <Star
                className={`h-4 w-4 mr-2 ${isWatched ? "fill-current" : ""}`}
              />
              {isWatched ? "Watching" : "Watch"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
