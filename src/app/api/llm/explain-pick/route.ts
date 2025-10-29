import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generatePickExplanation } from "@/lib/llm/pick-explainer";

const BodySchema = z.object({
	marketTitle: z.string().min(4),
	platform: z.string().min(2),
	currentProbabilityPct: z.number().min(0).max(100),
	change24hPct: z.number().min(-100).max(100),
	volume24hUsd: z.number().min(0),
	valueSignals: z.array(z.string()).default([]),
	provider: z.enum(["openai", "anthropic", "openrouter"]).optional(),
});

export async function POST(req: NextRequest) {
	try {
		const json = await req.json();
		const parsed = BodySchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
		}
		const body = parsed.data;

		const explanation = await generatePickExplanation({
			marketTitle: body.marketTitle,
			platform: body.platform,
			currentProbabilityPct: body.currentProbabilityPct,
			change24hPct: body.change24hPct,
			volume24hUsd: body.volume24hUsd,
			valueSignals: body.valueSignals,
		}, { provider: body.provider });

    return NextResponse.json({ success: true, explanation });
	} catch (err) {
    // Log and propagate a meaningful error back to the client
    // eslint-disable-next-line no-console
    console.error("/api/llm/explain-pick error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    const isQuotaOrRate = /quota|rate|limit/i.test(message);
    const status = isQuotaOrRate ? 429 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
	}
}

