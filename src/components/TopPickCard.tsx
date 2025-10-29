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
  const pickLabel = "Yes/No"; // placeholder until analytics selects a side
  const confidence = Math.round(pick.confidence_score);

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
                <Badge variant="outline">{pickLabel}</Badge>
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
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-primary" />
              <span>Value {pick.value_score}/100</span>
            </div>
            <span>Tap for details →</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
