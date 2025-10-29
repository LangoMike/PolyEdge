"use client";

import Link from "next/link";
import { usePickDetail } from "@/hooks/usePickDetail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ExternalLink, ArrowLeft } from "lucide-react";

export default function PickDetailPage({ params }: { params: { id: string } }) {
  const { pick, loading, error } = usePickDetail(params.id);

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (error || !pick) return <div className="container mx-auto px-4 py-8">Not found</div>;

  const pickLabel = 'Yes/No'; // placeholder until analytics selects a side

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm text-muted-foreground hover:underline inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
        <span className="text-xs text-muted-foreground">Top Pick</span>
      </div>

      <Card className="card-gradient-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{pick.market?.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase text-xs">{pick.market?.platform}</Badge>
                <Badge variant="outline">{pickLabel}</Badge>
                <Badge className="accent-gradient text-background">{Math.round(pick.confidence_score)}% Confidence</Badge>
              </CardDescription>
            </div>
            {pick.market && (
              <Link
                href={`/markets/${pick.market.id}`}
                className="text-sm text-primary hover:underline inline-flex items-center"
              >
                <BarChart3 className="h-4 w-4 mr-1" /> View Market
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pick.reasoning && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pick.reasoning}</p>
          )}
        </CardContent>
      </Card>

      {pick.market && (
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Key Metrics</CardTitle>
            <CardDescription>High-level snapshot for this market</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric label="24h Volume" value={`$${(pick.market.volume_24h/1000).toFixed(1)}K`} />
              <Metric label="Liquidity" value={`$${(pick.market.liquidity/1000).toFixed(1)}K`} />
              <Metric label="Category" value={pick.market.category || '—'} />
              <Metric label="Status" value={pick.market.status} />
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg bg-muted/40 border border-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}


