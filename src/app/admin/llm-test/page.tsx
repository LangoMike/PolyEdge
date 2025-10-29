"use client";

import { useState } from "react";

export default function LlmTestPage() {
  const [marketTitle, setMarketTitle] = useState(
    "Will Bitcoin be above $80k on Dec 31?"
  );
  const [platform, setPlatform] = useState("Polymarket");
  const [currentProbabilityPct, setCurrentProbabilityPct] = useState(62);
  const [change24hPct, setChange24hPct] = useState(4.7);
  const [volume24hUsd, setVolume24hUsd] = useState(1250000);
  const [valueSignals, setValueSignals] = useState(
    "High liquidity; Positive momentum; Divergence from comparable markets"
  );
  const [provider, setProvider] = useState<
    "openai" | "anthropic" | "openrouter" | ""
  >("openai");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    setError("");
    try {
      const res = await fetch("/api/llm/explain-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketTitle,
          platform,
          currentProbabilityPct: Number(currentProbabilityPct),
          change24hPct: Number(change24hPct),
          volume24hUsd: Number(volume24hUsd),
          valueSignals: valueSignals
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean),
          provider: provider || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Request failed");
      } else {
        setResult(json.explanation as string);
      }
    } catch (err) {
      setError("Network or server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">LLM Explain Pick – Admin Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Market Title</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={marketTitle}
            onChange={(e) => setMarketTitle(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Platform</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Current Prob %</label>
            <input
              type="number"
              step="0.1"
              className="mt-1 w-full border rounded px-3 py-2"
              value={currentProbabilityPct}
              onChange={(e) => setCurrentProbabilityPct(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">24h Change %</label>
            <input
              type="number"
              step="0.1"
              className="mt-1 w-full border rounded px-3 py-2"
              value={change24hPct}
              onChange={(e) => setChange24hPct(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">24h Volume USD</label>
            <input
              type="number"
              className="mt-1 w-full border rounded px-3 py-2"
              value={volume24hUsd}
              onChange={(e) => setVolume24hUsd(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">
              Signals (semicolon-separated)
            </label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={valueSignals}
              onChange={(e) => setValueSignals(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Provider</label>
          <select
            className="mt-1 w-full border rounded px-3 py-2"
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
          >
            <option value="openai">openai</option>
            <option value="anthropic">anthropic</option>
            <option value="openrouter">openrouter</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Only OpenAI needs to be configured for this test.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Explanation"}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {result && (
        <div className="border rounded p-4 bg-gray-50 whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
