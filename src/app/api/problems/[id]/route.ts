import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid problem id" }, { status: 400 });
    }

    const updates = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Ensure user is authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow certain fields to be updated
    const allowedFields = ["title", "description", "status", "priority", "owner_id"] as const;
    const payload: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) payload[key] = updates[key];
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("problems")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating problem:", error);
      return NextResponse.json({ error: "Failed to update problem" }, { status: 500 });
    }

    return NextResponse.json({ problem: data });
  } catch (error) {
    console.error("Error in PATCH /api/problems/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


