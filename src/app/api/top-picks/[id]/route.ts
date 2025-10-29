import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let id = params?.id;
    if (!id) {
      try {
        const url = new URL(request.url);
        const segs = url.pathname.split('/');
        id = segs[segs.length - 1] || '';
      } catch {}
    }
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("top_picks")
      .select(`*, market:markets(*)`)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}


