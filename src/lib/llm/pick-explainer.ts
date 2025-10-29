import { generateText } from "ai";
import { getProvider, ProviderName } from "./providers";

export type PickExplainInput = {
	marketTitle: string;
	platform: string;
	currentProbabilityPct: number;
	change24hPct: number;
	volume24hUsd: number;
	valueSignals: string[];
};

export async function generatePickExplanation(
	input: PickExplainInput,
	opts?: { provider?: ProviderName; maxTokens?: number }
) {
	const { model } = getProvider(opts?.provider);
	const system =
		"You are a prediction market analyst. Write a concise, data-driven 2-3 sentence explanation for why this market is a Top Pick. Avoid hype. Focus on probability, movement, liquidity, divergence, and actionable insight.";
	const user = `Market: ${input.marketTitle}
Platform: ${input.platform}
Current Probability: ${input.currentProbabilityPct.toFixed(1)}%
24h Change: ${input.change24hPct.toFixed(1)}%
24h Volume: $${Math.round(input.volume24hUsd).toLocaleString()}
Signals: ${input.valueSignals.filter(Boolean).join("; ")}`;

	const { text } = await generateText({
		model,
		system,
		prompt: user,
		maxTokens: opts?.maxTokens ?? 160,
		temperature: 0.4,
	});

	return text.trim();
}
