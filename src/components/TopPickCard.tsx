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
import { Star } from "lucide-react";
import { TopPick } from "@/types";

interface TopPickCardProps {
  pick: TopPick;
}

export function TopPickCard({ pick }: TopPickCardProps) {
  const title = pick.market?.title || "Untitled Market";
  const platform = pick.market?.platform || "";
  const isYes = pick.recommendation === "buy";
  const pickLabel = isYes
    ? "Yes"
    : pick.recommendation === "sell"
    ? "No"
    : "Watch";
  const confidence = Math.round(pick.confidence_score);

  // Enhanced analytics data
  const edgePercentage = (pick as any).edge_percentage || pick.value_score;
  const probabilityPercentage =
    (pick as any).probability_percentage || pick.confidence_score;
  const confidenceLevel =
    (pick as any).confidence_level ||
    (confidence >= 70 ? "HIGH" : confidence >= 55 ? "MED" : "LOW");
  const freshnessMinutes = (pick as any).freshness_minutes || 0;

  // Get current prices from market outcomes
  const outcomes = (pick.market as any)?.outcomes || [];
  const yesOutcome = outcomes.find(
    (o: any) => o.outcome_label?.toLowerCase() === "yes"
  );
  const noOutcome = outcomes.find(
    (o: any) => o.outcome_label?.toLowerCase() === "no"
  );
  const yesPrice = yesOutcome?.current_price || 0;
  const noPrice = noOutcome?.current_price || 0;

  return (
    <Link
      href={`/picks/${pick.id}`}
      className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
    >
      <Card className="card-gradient-border hover-lift bg-card/90">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-3">
              <CardTitle className="text-base line-clamp-2">{title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase text-xs">
                  {platform}
                </Badge>
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
                <Badge variant="outline" className="text-xs">
                  {confidenceLevel}
                </Badge>
              </CardDescription>
            </div>
            <div className="flex flex-col items-end">
              <div className="relative">
                <div className="h-10 w-10 rounded-full accent-gradient" />
                <div className="absolute inset-0 grid place-items-center text-xs font-semibold text-background">
                  {confidence}%
                </div>
              </div>
              <span className="mt-1 text-xs text-muted-foreground">
                Confidence
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {pick.reasoning && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {pick.reasoning}
            </p>
          )}

          {/* Current Prices Display */}
          {(yesPrice > 0 || noPrice > 0) && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Current Prices
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">
                      Yes: {yesPrice.toFixed(4)} ({(yesPrice * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">
                      No: {noPrice.toFixed(4)} ({(noPrice * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-primary" />
                  <span>Edge {edgePercentage}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>P(win) {probabilityPercentage}%</span>
                </div>
              </div>
              <span className="text-xs">
                {freshnessMinutes < 60
                  ? `${freshnessMinutes}m ago`
                  : `${Math.floor(freshnessMinutes / 60)}h ago`}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tap for details →</span>
              {pick.market && (
                <span
                  className="text-primary hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(
                      `https://${
                        platform === "polymarket"
                          ? "polymarket.com"
                          : platform === "kalshi"
                          ? "kalshi.com"
                          : "manifold.markets"
                      }`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                >
                  View on {platform} →
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
