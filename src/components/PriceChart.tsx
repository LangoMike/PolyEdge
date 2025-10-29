"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceChartProps {
  marketId: string;
}

interface PriceData {
  timestamp: string;
  price: number;
  volume: number;
}

export function PriceChart({ marketId }: PriceChartProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "7d">("1d");

  // Mock data generator - in real app, this would fetch from API
  useEffect(() => {
    const generateMockData = () => {
      const now = new Date();
      const data: PriceData[] = [];
      const intervals = {
        "1h": 5, // 5-minute intervals
        "4h": 15, // 15-minute intervals
        "1d": 60, // 1-hour intervals
        "7d": 240, // 4-hour intervals
      };

      const intervalMinutes = intervals[timeframe];
      const points = timeframe === "7d" ? 42 : 24; // 7 days = 42 points, others = 24 points

      let basePrice = 0.5 + Math.random() * 0.3; // Random starting price between 0.5-0.8

      for (let i = points; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
        
        // Add some realistic price movement
        const change = (Math.random() - 0.5) * 0.02; // ±1% change
        basePrice = Math.max(0.01, Math.min(0.99, basePrice + change));
        
        data.push({
          timestamp: timestamp.toISOString(),
          price: Number(basePrice.toFixed(3)),
          volume: Math.random() * 10000 + 1000,
        });
      }

      return data;
    };

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 500);
  }, [marketId, timeframe]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (timeframe === "1h" || timeframe === "4h") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatTooltip = (value: number, name: string) => {
    if (name === "price") {
      return [`$${value.toFixed(3)}`, "Price"];
    }
    if (name === "volume") {
      return [`$${value.toLocaleString()}`, "Volume"];
    }
    return [value, name];
  };

  const getPriceChange = () => {
    if (data.length < 2) return { change: 0, percentage: 0 };
    const first = data[0].price;
    const last = data[data.length - 1].price;
    const change = last - first;
    const percentage = (change / first) * 100;
    return { change, percentage };
  };

  const priceChange = getPriceChange();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <div className="flex space-x-2">
            {["1h", "4h", "1d", "7d"].map((tf) => (
              <Skeleton key={tf} className="h-8 w-12" />
            ))}
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              ${data[data.length - 1]?.price.toFixed(3) || "0.000"}
            </span>
            <div
              className={`flex items-center space-x-1 ${
                priceChange.change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {priceChange.change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {priceChange.change >= 0 ? "+" : ""}
                {priceChange.percentage.toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {timeframe === "1h" && "Last hour"}
            {timeframe === "4h" && "Last 4 hours"}
            {timeframe === "1d" && "Last 24 hours"}
            {timeframe === "7d" && "Last 7 days"}
          </p>
        </div>
        <div className="flex space-x-2">
          {(["1h", "4h", "1d", "7d"] as const).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={priceChange.change >= 0 ? "#10b981" : "#ef4444"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={priceChange.change >= 0 ? "#10b981" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              className="text-xs"
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              className="text-xs"
            />
            <Tooltip
              formatter={formatTooltip}
              labelFormatter={(value) =>
                new Date(value).toLocaleString()
              }
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={priceChange.change >= 0 ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
