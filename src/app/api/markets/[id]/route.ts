import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Market ID is required" },
        { status: 400 }
      );
    }

    // Fetch market with outcomes
    const { data: market, error: marketError } = await supabaseAdmin
      .from("markets")
      .select(`
        *,
        outcomes (*)
      `)
      .eq("id", id)
      .single();

    if (marketError) {
      console.error("Error fetching market:", marketError);
      return NextResponse.json(
        { success: false, error: "Market not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: market,
    });
  } catch (error) {
    console.error("Error in market detail API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
