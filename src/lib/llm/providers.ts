import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export type ProviderName = "openai" | "anthropic" | "openrouter";

export function getProvider(preferred?: ProviderName) {
	const choice: ProviderName = preferred || (process.env.PREFERRED_LLM as ProviderName) || "openai";

	if (choice === "anthropic") {
		if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
		const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
		return {
			name: "anthropic" as const,
			model: anthropic("claude-3-5-sonnet-latest"),
		};
	}

	if (choice === "openrouter") {
		if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set");
		const openrouter = createOpenAI({
			apiKey: process.env.OPENROUTER_API_KEY,
			baseURL: "https://openrouter.ai/api/v1",
			headers: {
				"HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
				"X-Title": "PolyEdge",
			},
		});
		return {
			name: "openrouter" as const,
			model: openrouter("google/gemini-1.5-pro-002"),
		};
	}

	if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
	const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
	return {
		name: "openai" as const,
		model: openai("gpt-4o-mini"),
	};
}
